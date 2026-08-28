"""AUTO-16 to AUTO-20: Automatizaciones Administrativas.

Multi-tenant (Fase 5 + 6): AUTO-16/17/18/19 (programadas) usan el patrón
dispatch. AUTO-20 (event-driven) deriva club_id del atleta que la dispara.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

from database.supabase_client import get_supabase
from tasks.celery_app import celery_app
from tasks.helpers import (
    get_active_club_ids,
    get_admin_user_ids,
    get_automation_config,
    log_activity,
    notify_club_telegram,
    notify_user,
    send_email,
)

logger = logging.getLogger(__name__)


# ── AUTO-16: Briefing matutino del administrador ────────────────────────────

@celery_app.task(name="tasks.admin.morning_briefing_dispatch")
def morning_briefing_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        morning_briefing.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.admin.morning_briefing")
def morning_briefing(club_id: str) -> dict:
    """Lun–Vie 07:30 — resumen diario para el administrador del club."""
    cfg = get_automation_config("AUTO-16", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    today_str = today.isoformat()
    fourteen_days = (today + timedelta(days=14)).isoformat()
    thirty_ago = (today - timedelta(days=30)).isoformat()

    # Sessions today
    sessions_today = (
        db.table("training_sessions")
        .select("id, scheduled_at, training_type, max_participants")
        .eq("club_id", club_id)
        .gte("scheduled_at", f"{today_str}T00:00:00")
        .lte("scheduled_at", f"{today_str}T23:59:59")
        .eq("status", "scheduled")
        .execute()
    ).data or []

    # Overdue payments
    overdue_txs = (
        db.table("financial_transactions")
        .select("amount")
        .eq("club_id", club_id)
        .eq("payment_status", "pending")
        .lte("transaction_date", thirty_ago)
        .execute()
    ).data or []
    overdue_total = sum(tx.get("amount", 0) for tx in overdue_txs)

    # Upcoming competitions (14 days)
    competitions = (
        db.table("competitions")
        .select("name, start_date")
        .eq("club_id", club_id)
        .gte("start_date", today_str)
        .lte("start_date", fourteen_days)
        .execute()
    ).data or []

    # Active attendance alerts
    alerts = (
        db.table("attendance_alerts")
        .select("id, athlete_id, consecutive_absences, alert_level")
        .eq("club_id", club_id)
        .is_("resolved_at", "null")
        .execute()
    ).data or []

    # Expiring documents (7 days)
    expiring_docs = (
        db.table("user_documents")
        .select("id")
        .eq("club_id", club_id)
        .gte("expiry_date", today_str)
        .lte("expiry_date", (today + timedelta(days=7)).isoformat())
        .execute()
    ).data or []

    sessions_text = " | ".join(
        f"{s.get('scheduled_at', '')[11:16]} {(s.get('training_type') or '').replace('_', ' ').title()}"
        for s in sessions_today
    ) or "Sin sesiones"

    competitions_text = " | ".join(
        f"{c.get('name', 'Competencia')} ({c.get('start_date', '')})"
        for c in competitions[:3]
    ) or "Sin competencias próximas"

    msg = (
        f"📋 BRIEFING — {today.strftime('%A %d/%m/%Y').upper()}\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"🏋️ HOY: {len(sessions_today)} sesiones — {sessions_text}\n"
        f"💰 FINANZAS: {len(overdue_txs)} pagos vencidos | ${overdue_total:,.0f} en mora\n"
        f"🏆 PRÓXIMAS: {competitions_text}\n"
        f"⚠️ ALERTAS: {len(alerts)} inasistencias activas\n"
        f"📋 DOCUMENTOS: {len(expiring_docs)} documentos por vencer esta semana"
    )

    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "📋 Briefing del día", msg, "info", "AUTO-16", club_id=club_id)
        actions += 1

    log_activity("AUTO-16", "AG-01", "success",
                 records_found=len(sessions_today), actions_taken=actions,
                 summary=f"{len(sessions_today)} sesiones hoy, {len(overdue_txs)} pagos morosos", club_id=club_id)
    return {"records_found": len(sessions_today), "actions_taken": actions}


# ── AUTO-17: Resumen de fin de día ──────────────────────────────────────────

@celery_app.task(name="tasks.admin.end_of_day_summary_dispatch")
def end_of_day_summary_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        end_of_day_summary.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.admin.end_of_day_summary")
def end_of_day_summary(club_id: str) -> dict:
    """Lun–Sáb 21:00 — resumen de lo ocurrido en el día para el club."""
    cfg = get_automation_config("AUTO-17", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today().isoformat()

    # Fetch today's session IDs to avoid full table scan
    today_session_rows = (
        db.table("training_sessions")
        .select("id")
        .eq("club_id", club_id)
        .gte("scheduled_at", f"{today}T00:00:00")
        .lte("scheduled_at", f"{today}T23:59:59")
        .execute()
    ).data or []
    today_session_ids = [s["id"] for s in today_session_rows] or ["00000000-0000-0000-0000-000000000000"]

    # Attendance for today
    attendances = (
        db.table("training_attendance")
        .select("attended, training_sessions!inner(scheduled_at)")
        .in_("training_session_id", today_session_ids)
        .execute()
    ).data or []

    today_att = [
        a for a in attendances
        if (a.get("training_sessions") or {}).get("scheduled_at", "").startswith(today)
    ]
    attended = sum(1 for a in today_att if a.get("attended"))
    total = len(today_att)
    rate = round(attended / total * 100, 1) if total else 0

    # Payments today
    payments = (
        db.table("financial_transactions")
        .select("amount")
        .eq("club_id", club_id)
        .eq("transaction_date", today)
        .eq("payment_status", "paid")
        .execute()
    ).data or []
    income_today = sum(p.get("amount", 0) for p in payments)

    # Medical incidents today
    incidents = (
        db.table("medical_sessions")
        .select("id")
        .eq("club_id", club_id)
        .eq("session_date", today)
        .execute()
    ).data or []

    msg = (
        f"📅 Resumen del día {today}:\n"
        f"👟 Asistencia: {attended}/{total} atletas ({rate}%)\n"
        f"💰 Ingresos del día: ${income_today:,.0f}\n"
        f"🏥 Incidencias médicas: {len(incidents)}"
    )

    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "📅 Resumen fin de día", msg, "info", "AUTO-17", club_id=club_id)
        actions += 1

    log_activity("AUTO-17", "AG-01", "success",
                 records_found=total, actions_taken=actions,
                 summary=f"Asistencia {rate}%, ingresos ${income_today:,.0f}", club_id=club_id)
    return {"records_found": total, "actions_taken": actions}


# ── AUTO-18: Gestión de documentos vencidos ─────────────────────────────────

@celery_app.task(name="tasks.admin.expiring_documents_check_dispatch")
def expiring_documents_check_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        expiring_documents_check.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.admin.expiring_documents_check")
def expiring_documents_check(club_id: str) -> dict:
    """Diario 09:00 — notifica sobre documentos del club próximos a vencer."""
    cfg = get_automation_config("AUTO-18", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    reminder_days = [30, 15, 5]
    actions = 0
    total_found = 0

    for days in reminder_days:
        target_date = (today + timedelta(days=days)).isoformat()
        docs = (
            db.table("user_documents")
            .select("id, user_id, doc_type, expiry_date, profiles(first_name, email)")
            .eq("club_id", club_id)
            .eq("expiry_date", target_date)
            .execute()
        ).data or []

        for doc in docs:
            total_found += 1
            profile = doc.get("profiles") or {}
            name = profile.get("first_name", "Usuario")
            doc_type = (doc.get("doc_type") or "documento").replace("_", " ").title()
            expiry = doc.get("expiry_date", target_date)

            msg = (
                f"Hola {name}, tu {doc_type} vence el {expiry} (en {days} días). "
                f"Por favor renuévalo para continuar participando en actividades del club."
            )

            if doc.get("user_id"):
                notify_user(
                    doc["user_id"],
                    f"📄 {doc_type} vence en {days} días",
                    msg,
                    "warning" if days <= 15 else "info",
                    "AUTO-18",
                    club_id=club_id,
                )
                actions += 1

            if profile.get("email"):
                send_email(profile["email"], f"Documento por vencer: {doc_type}", msg)

    # Summary to admins if any critical (5 days)
    critical = (
        db.table("user_documents")
        .select("id")
        .eq("club_id", club_id)
        .lte("expiry_date", (today + timedelta(days=5)).isoformat())
        .gte("expiry_date", today.isoformat())
        .execute()
    ).data or []

    if critical:
        for uid in get_admin_user_ids(club_id):
            notify_user(
                uid,
                "⚠️ Documentos críticos por vencer",
                f"{len(critical)} documentos vencen en los próximos 5 días.",
                "error",
                "AUTO-18",
                club_id=club_id,
            )
            actions += 1

    log_activity("AUTO-18", "AG-01", "success" if total_found else "skipped",
                 records_found=total_found, actions_taken=actions,
                 summary=f"{total_found} documentos próximos a vencer", club_id=club_id)
    return {"records_found": total_found, "actions_taken": actions}


# ── AUTO-19: Control de equipamiento e inventario ───────────────────────────

@celery_app.task(name="tasks.admin.equipment_inventory_check_dispatch")
def equipment_inventory_check_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        equipment_inventory_check.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.admin.equipment_inventory_check")
def equipment_inventory_check(club_id: str) -> dict:
    """Lunes 06:00 — detecta stock bajo y mantenimiento vencido del club."""
    cfg = get_automation_config("AUTO-19", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today().isoformat()

    # Low stock items (quantity below minimum)
    equipment = (
        db.table("equipment")
        .select("id, name, quantity, minimum_quantity, status")
        .eq("club_id", club_id)
        .execute()
    ).data or []

    low_stock = [
        e for e in equipment
        if e.get("quantity", 0) < (e.get("minimum_quantity") or 1)
        and e.get("status") != "retired"
    ]

    # Overdue maintenance
    overdue_maintenance = (
        db.table("equipment_maintenance")
        .select("id, equipment_id, next_maintenance_date, maintenance_type, equipment(name)")
        .eq("club_id", club_id)
        .lte("next_maintenance_date", today)
        .eq("status", "scheduled")
        .execute()
    ).data or []

    if not low_stock and not overdue_maintenance:
        log_activity("AUTO-19", "AG-11", "skipped", summary="Inventario en orden", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

    msg_parts = []
    if low_stock:
        items = ", ".join(e.get("name", "Item") for e in low_stock[:5])
        msg_parts.append(f"📦 Stock bajo ({len(low_stock)}): {items}")
    if overdue_maintenance:
        items = ", ".join(
            (m.get("equipment") or {}).get("name", "Equipo")
            for m in overdue_maintenance[:5]
        )
        msg_parts.append(f"🔧 Mantenimiento vencido ({len(overdue_maintenance)}): {items}")

    msg = "\n".join(msg_parts)
    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "🏭 Alerta de inventario", msg, "warning", "AUTO-19", club_id=club_id)
        actions += 1

    log_activity("AUTO-19", "AG-11", "success",
                 records_found=len(low_stock) + len(overdue_maintenance),
                 actions_taken=actions,
                 summary=msg, club_id=club_id)
    return {"records_found": len(low_stock) + len(overdue_maintenance), "actions_taken": actions}


# ── AUTO-20: Generación de carnets y documentos de nuevo atleta (event-driven) ─

@celery_app.task(name="tasks.admin.new_athlete_documents")
def new_athlete_documents(athlete_id: str) -> dict:
    """Triggered on new athlete registration — prepara documentos iniciales."""
    db = get_supabase()

    athlete = (
        db.table("athletes")
        .select("id, first_name, last_name, email, user_id, category, athlete_number, created_at, club_id")
        .eq("id", athlete_id)
        .maybeSingle()
        .execute()
    ).data

    if not athlete:
        log_activity("AUTO-20", "AG-01", "skipped", summary="Atleta no encontrado")
        return {"records_found": 0, "actions_taken": 0}

    club_id = athlete.get("club_id")
    cfg = get_automation_config("AUTO-20", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}

    name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
    athlete_number = athlete.get("athlete_number") or "pendiente"

    # Create initial document records
    doc_types = [
        {"doc_type": "carnet", "doc_name": f"Carnet Digital — {name}"},
        {"doc_type": "membership_contract", "doc_name": f"Contrato de Membresía — {name}"},
        {"doc_type": "image_authorization", "doc_name": f"Autorización de Imagen — {name}"},
    ]

    actions = 0
    for doc in doc_types:
        db.table("user_documents").upsert({
            "user_id": athlete.get("user_id") or athlete_id,
            "doc_type": doc["doc_type"],
            "doc_name": doc["doc_name"],
            "doc_status": "pending",
            "club_id": club_id,
        }, on_conflict="user_id,doc_type").execute()
        actions += 1

    msg = (
        f"¡Bienvenido/a {name}! Tu número de atleta es #{athlete_number}. "
        f"Hemos preparado tus documentos de ingreso (carnet, contrato, autorización de imagen). "
        f"Descárgalos desde tu perfil."
    )

    if athlete.get("user_id"):
        notify_user(athlete["user_id"], "🎉 ¡Bienvenido al club!", msg, "success", "AUTO-20", club_id=club_id)
        actions += 1

    if athlete.get("email"):
        send_email(
            athlete["email"],
            f"¡Bienvenido/a {name}! — Club de Patinaje",
            msg,
        )

    # Notify admins of THIS club of new registration
    for uid in get_admin_user_ids(club_id):
        notify_user(
            uid,
            f"👤 Nuevo atleta registrado: {name}",
            f"Se registró el atleta {name} (#{athlete_number}). "
            f"Documentos generados y pendientes de revisión.",
            "info",
            "AUTO-20",
            club_id=club_id,
        )
        actions += 1

    if club_id:
        notify_club_telegram(
            club_id, "new_athletes",
            f"👤 Nuevo atleta registrado: {name} (#{athlete_number})",
        )

    log_activity("AUTO-20", "AG-01", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Documentos iniciales creados para {name}", club_id=club_id)
    return {"records_found": 1, "actions_taken": actions}
