"""AUTO-30 to AUTO-35: Automatizaciones de Seguridad y Comunicación.

Multi-tenant (Fase 5 + 6): AUTO-32/33/35 (programadas, datos por club) usan
el patrón dispatch. AUTO-30/34 (event-driven) derivan club_id del
usuario/atleta del evento cuando se puede resolver. AUTO-31 (verificación
de backups) queda deliberadamente GLOBAL — un backup de Supabase es del
proyecto entero, no de un club — y sigue notificando a "todos los admins"
sin filtrar por club (gap conocido: sin un rol platform-wide "superadmin",
hoy eso significa que los admins de TODOS los clubes reciben la alerta de
infraestructura; documentado como pendiente).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from database.supabase_client import get_supabase
from tasks.celery_app import celery_app
from tasks.helpers import (
    get_active_club_ids,
    get_admin_user_ids,
    get_automation_config,
    log_activity,
    notify_user,
)

logger = logging.getLogger(__name__)


def _resolve_club_id(db, user_id: str | None) -> str | None:
    """Best-effort: resuelve el club de un usuario para eventos de seguridad
    donde puede o no haber un usuario identificado todavía (ej. login fallido
    con email inexistente)."""
    if not user_id:
        return None
    try:
        row = (
            db.table("user_roles")
            .select("club_id")
            .eq("user_id", user_id)
            .limit(1)
            .maybeSingle()
            .execute()
        ).data
        return (row or {}).get("club_id")
    except Exception:
        return None


# ── AUTO-30: Monitoreo de accesos sospechosos (event-driven) ───────────────

@celery_app.task(name="tasks.security.check_suspicious_access")
def check_suspicious_access(user_id: str, ip_address: str, success: bool) -> dict:
    """Triggered per login attempt — detecta IPs sospechosas y bloquea."""
    db = get_supabase()
    club_id = _resolve_club_id(db, user_id)

    cfg = get_automation_config("AUTO-30", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}

    now = datetime.now(timezone.utc)
    ten_min_ago = (now - timedelta(minutes=10)).isoformat()

    # Log this attempt to security_audit_log
    try:
        db.table("security_audit_log").insert({
            "user_id": user_id or None,
            "event_type": "login_failed" if not success else "login",
            "ip_address": ip_address,
            "details": {"success": success, "action": "login_attempt"},
            "created_at": now.isoformat(),
            "club_id": club_id,
        }).execute()
    except Exception as exc:
        logger.warning("No se pudo registrar intento de login en security_audit_log: %s", exc)

    if success:
        log_activity("AUTO-30", "AG-08", "success", records_found=1, actions_taken=0,
                     summary=f"Login exitoso desde {ip_address}", club_id=club_id)
        return {"records_found": 1, "actions_taken": 0}

    # Count failed attempts from this IP in the last 10 minutes (bloqueo por
    # IP es plataforma-wide a propósito — blocked_ips es Grupo B, un
    # atacante no respeta fronteras de club).
    failed = (
        db.table("security_audit_log")
        .select("id")
        .eq("ip_address", ip_address)
        .eq("event_type", "login_failed")
        .gte("created_at", ten_min_ago)
        .execute()
    ).data or []

    actions = 0
    if len(failed) >= 5:
        # Check if already blocked
        already_blocked = (
            db.table("blocked_ips")
            .select("id")
            .eq("ip_address", ip_address)
            .gt("expires_at", now.isoformat())
            .execute()
        ).data or []

        if not already_blocked:
            expires = (now + timedelta(minutes=30)).isoformat()
            db.table("blocked_ips").upsert({
                "ip_address": ip_address,
                "reason": f">{len(failed)} intentos fallidos en 10 min",
                "expires_at": expires,
            }, on_conflict="ip_address").execute()

            alert_msg = (
                f"🚨 IP {ip_address} bloqueada por {len(failed)} intentos fallidos en 10 minutos. "
                f"Bloqueo activo por 30 minutos."
            )
            for uid in get_admin_user_ids(club_id):
                notify_user(uid, "🔒 Acceso sospechoso bloqueado", alert_msg, "error", "AUTO-30", club_id=club_id)
                actions += 1

    log_activity("AUTO-30", "AG-08", "success",
                 records_found=len(failed), actions_taken=actions,
                 summary=f"{len(failed)} intentos fallidos desde {ip_address}", club_id=club_id)
    return {"records_found": len(failed), "actions_taken": actions}


# ── AUTO-31: Verificación de backups (GLOBAL, no dispatch por club) ────────

@celery_app.task(name="tasks.security.verify_backup")
def verify_backup() -> dict:
    """Diario 03:00 — verifica que el backup de Supabase esté al día (nivel proyecto)."""
    cfg = get_automation_config("AUTO-31")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    now = datetime.now(timezone.utc)

    # Supabase handles backups internally; we verify by checking the last backup log
    last_backup = (
        db.table("backup_log")
        .select("ran_at, status")
        .order("ran_at", desc=True)
        .limit(1)
        .execute()
    ).data or []

    # Determine status
    if last_backup:
        last_ran = datetime.fromisoformat(last_backup[0]["ran_at"].replace("Z", "+00:00"))
        hours_since = (now - last_ran).total_seconds() / 3600
        status = "ok" if hours_since < 26 else "unknown"
        detail = f"Último backup hace {hours_since:.1f}h"
    else:
        status = "unknown"
        detail = "Sin registros previos de backup"

    # Log backup verification
    db.table("backup_log").insert({
        "status": status,
        "details": detail,
        "alert_sent": status != "ok",
    }).execute()

    actions = 0
    if status != "ok":
        alert_msg = (
            f"⚠️ Alerta de backup: {detail}. "
            f"Verifica el panel de Supabase para confirmar el estado de los backups."
        )
        # Global a propósito — ver nota del módulo. get_admin_user_ids()
        # sin club_id notifica a los admins de TODOS los clubes.
        for uid in get_admin_user_ids():
            notify_user(uid, "💾 Alerta de backup", alert_msg, "error", "AUTO-31")
            actions += 1
    else:
        logger.info("Backup OK: %s", detail)

    log_activity("AUTO-31", "AG-08", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Backup {status}: {detail}")
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-32: Auditoría de acceso a datos sensibles ──────────────────────────

@celery_app.task(name="tasks.security.sensitive_data_audit_dispatch")
def sensitive_data_audit_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        sensitive_data_audit.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.security.sensitive_data_audit")
def sensitive_data_audit(club_id: str) -> dict:
    """Semanal — revisa accesos anómalos a tablas sensibles del club."""
    cfg = get_automation_config("AUTO-32", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    # Check audit_log for sensitive table accesses
    sensitive_tables = ["athlete_body_info", "medical_sessions", "financial_transactions"]
    audit_entries = (
        db.table("audit_log")
        .select("user_id, action, table_name, created_at")
        .eq("club_id", club_id)
        .in_("table_name", sensitive_tables)
        .gte("created_at", week_ago)
        .execute()
    ).data or []

    if not audit_entries:
        log_activity("AUTO-32", "AG-08", "skipped", summary="Sin accesos a datos sensibles esta semana", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

    # Group by user
    from collections import Counter
    by_user: Counter = Counter(entry["user_id"] for entry in audit_entries)

    # Flag users with excessive access (>100 accesses in a week)
    anomalies = [(uid, count) for uid, count in by_user.items() if count > 100]

    msg = (
        f"🔍 Auditoría semanal de datos sensibles:\n"
        f"Total accesos: {len(audit_entries)}\n"
        f"Usuarios únicos: {len(by_user)}\n"
        f"{'⚠️ Anomalías detectadas: ' + str(len(anomalies)) if anomalies else '✅ Sin anomalías'}"
    )

    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "🔍 Auditoría datos sensibles", msg,
                    "warning" if anomalies else "info", "AUTO-32", club_id=club_id)
        actions += 1

    log_activity("AUTO-32", "AG-08", "success",
                 records_found=len(audit_entries), actions_taken=actions,
                 summary=f"{len(audit_entries)} accesos, {len(anomalies)} anomalías", club_id=club_id)
    return {"records_found": len(audit_entries), "actions_taken": actions}


# ── AUTO-33: Rotación de sesiones inactivas ─────────────────────────────────

@celery_app.task(name="tasks.security.rotate_inactive_sessions_dispatch")
def rotate_inactive_sessions_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        rotate_inactive_sessions.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.security.rotate_inactive_sessions")
def rotate_inactive_sessions(club_id: str) -> dict:
    """Diario 02:00 — invalida tokens con >30 días de inactividad (info report) del club."""
    cfg = get_automation_config("AUTO-33", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    # Supabase handles JWT expiration internally.
    # Here we report on profiles that haven't accessed in 30+ days.
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    # profiles no tiene club_id propio (Grupo C especial) — se resuelve el
    # club vía los user_id de user_roles.
    club_user_rows = (
        db.table("user_roles").select("user_id").eq("club_id", club_id).execute()
    ).data or []
    club_user_ids = [r["user_id"] for r in club_user_rows]
    if not club_user_ids:
        return {"records_found": 0, "actions_taken": 0}

    PAGE_SIZE = 1000
    offset = 0
    inactive_profiles = []
    while True:
        page = (
            db.table("profiles")
            .select("id, first_name, last_name, updated_at")
            .in_("id", club_user_ids)
            .lte("updated_at", thirty_days_ago)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        ).data or []
        inactive_profiles.extend(page)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    # In Supabase, sessions expire per JWT TTL; we log the count for reporting.
    msg = (
        f"🔄 Rotación de sesiones:\n"
        f"Perfiles sin actividad >30 días: {len(inactive_profiles)}\n"
        f"Los tokens JWT de Supabase se rotan automáticamente según TTL configurado."
    )

    actions = 0
    # Only notify if there's a significant number of inactive users
    if len(inactive_profiles) > 10:
        for uid in get_admin_user_ids(club_id):
            notify_user(uid, "🔄 Informe de sesiones inactivas", msg, "info", "AUTO-33", club_id=club_id)
            actions += 1

    log_activity("AUTO-33", "AG-08", "success",
                 records_found=len(inactive_profiles), actions_taken=actions,
                 summary=f"{len(inactive_profiles)} perfiles inactivos >30 días", club_id=club_id)
    return {"records_found": len(inactive_profiles), "actions_taken": actions}


# ── AUTO-34: Notificaciones en tiempo real (dispatcher, event-driven) ──────

@celery_app.task(name="tasks.security.realtime_event_dispatcher")
def realtime_event_dispatcher(event_type: str, payload: dict) -> dict:
    """Routes real-time events to the correct notification recipients."""
    db = get_supabase()
    actions = 0

    # Resuelve club_id ANTES de decidir si la automatización está
    # habilitada — el chequeo de "enabled" debe cortar antes de notificar
    # a nadie, así que no puede depender de efectos secundarios de las
    # ramas de abajo.
    athlete_row = None
    club_id = None
    if event_type in ("new_competition_result", "medical_alert"):
        athlete_id = payload.get("athlete_id")
        if athlete_id:
            athlete_row = (
                db.table("athletes")
                .select("user_id, first_name, coach_id, club_id")
                .eq("id", athlete_id)
                .maybeSingle()
                .execute()
            ).data
            club_id = (athlete_row or {}).get("club_id")
    elif event_type == "payment_registered":
        club_id = _resolve_club_id(db, payload.get("user_id"))

    cfg = get_automation_config("AUTO-34", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}

    if event_type == "new_competition_result" and athlete_row:
        if athlete_row.get("user_id"):
            notify_user(
                athlete_row["user_id"],
                "🏆 Nuevo resultado registrado",
                "Tu resultado de competencia ha sido registrado. Revísalo en tu perfil.",
                "success", "AUTO-34", club_id=club_id,
            )
            actions += 1
        if athlete_row.get("coach_id"):
            notify_user(
                athlete_row["coach_id"],
                f"📊 Resultado: {athlete_row.get('first_name', 'Atleta')}",
                "Nuevo resultado de competencia registrado. Revísalo en el panel.",
                "info", "AUTO-34", club_id=club_id,
            )
            actions += 1

    elif event_type == "payment_registered":
        user_id = payload.get("user_id")
        amount = payload.get("amount", 0)
        if user_id:
            notify_user(
                user_id, "✅ Pago registrado",
                f"Se registró tu pago de ${amount:,.0f}.",
                "success", "AUTO-34", club_id=club_id,
            )
            actions += 1

    elif event_type == "medical_alert":
        alert_msg = payload.get("message", "Alerta médica registrada")
        if athlete_row:
            for uid in get_admin_user_ids(club_id):
                notify_user(uid, "🏥 Alerta médica", alert_msg, "error", "AUTO-34", club_id=club_id)
                actions += 1

    log_activity("AUTO-34", "AG-01", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Evento {event_type} despachado, {actions} notificaciones", club_id=club_id)
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-35: Resumen diario de actividad de agentes IA ──────────────────────

@celery_app.task(name="tasks.security.daily_agent_activity_summary_dispatch")
def daily_agent_activity_summary_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        daily_agent_activity_summary.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.security.daily_agent_activity_summary")
def daily_agent_activity_summary(club_id: str) -> dict:
    """Diario 23:30 — consolida actividad de las automatizaciones del club en el día.

    Nota: solo ve filas de agent_activity_log que ya traen club_id seteado
    (los módulos migrados a Fase 5 lo pasan explícito). Los módulos aún no
    migrados escriben con club_id NULL y no aparecen acá hasta que se
    actualicen — gap conocido, no un bug de este task.
    """
    cfg = get_automation_config("AUTO-35", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    from datetime import date
    today = date.today().isoformat()

    activity = (
        db.table("agent_activity_log")
        .select("automation_id, agent_id, status, records_found, actions_taken, error_message, ran_at")
        .eq("club_id", club_id)
        .gte("ran_at", f"{today}T00:00:00")
        .lte("ran_at", f"{today}T23:59:59")
        .execute()
    ).data or []

    if not activity:
        log_activity("AUTO-35", "AG-01", "skipped", summary="Sin actividad de agentes hoy", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

    successes = [a for a in activity if a.get("status") == "success"]
    errors = [a for a in activity if a.get("status") == "error"]
    skipped = [a for a in activity if a.get("status") == "skipped"]
    total_actions = sum(a.get("actions_taken", 0) for a in activity)
    total_records = sum(a.get("records_found", 0) for a in activity)

    error_detail = ""
    if errors:
        error_detail = "\n⚠️ Errores:\n" + "\n".join(
            f"  - {e['automation_id']}: {e.get('error_message', 'sin detalle')}"
            for e in errors[:5]
        )

    msg = (
        f"🤖 ACTIVIDAD AGENTES IA — {today}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"✅ Exitosas: {len(successes)} | ⏭️ Omitidas: {len(skipped)} | ❌ Errores: {len(errors)}\n"
        f"Registros procesados: {total_records}\n"
        f"Acciones ejecutadas: {total_actions}"
        f"{error_detail}"
    )

    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(
            uid, "🤖 Resumen agentes IA",
            msg,
            "error" if errors else "info",
            "AUTO-35",
            club_id=club_id,
        )
        actions += 1

    log_activity("AUTO-35", "AG-01", "success",
                 records_found=len(activity), actions_taken=actions,
                 summary=f"{len(successes)} ok, {len(errors)} errores, {total_actions} acciones totales", club_id=club_id)
    return {"records_found": len(activity), "actions_taken": actions}
