"""AUTO-01 to AUTO-06: Automatizaciones de Calendario y Entrenamientos."""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone

from database.supabase_client import get_supabase
from tasks.celery_app import celery_app
from tasks.helpers import (
    get_admin_user_ids,
    get_coach_user_ids,
    log_activity,
    notify_role,
    notify_user,
    send_email_placeholder,
    task_wrapper,
)

logger = logging.getLogger(__name__)

AUTO = "AUTO-01"


# ── AUTO-01: Recordatorio entrenamiento del día siguiente ───────────────────
@celery_app.task(name="tasks.calendar.training_reminder_next_day")
def training_reminder_next_day() -> dict:
    """19:00 diario — notifica atletas sobre entrenamientos del día siguiente."""
    db = get_supabase()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    sessions = (
        db.table("training_sessions")
        .select("id, scheduled_at, training_type, location, max_participants")
        .gte("scheduled_at", f"{tomorrow}T00:00:00")
        .lt("scheduled_at", f"{tomorrow}T23:59:59")
        .eq("status", "scheduled")
        .execute()
    ).data or []

    if not sessions:
        log_activity("AUTO-01", "AG-11", "skipped", summary="No hay sesiones mañana")
        return {"records_found": 0, "actions_taken": 0}

    actions = 0
    for session in sessions:
        dt = datetime.fromisoformat(session["scheduled_at"].replace("Z", "+00:00"))
        time_str = dt.strftime("%H:%M")
        training_type = session.get("training_type", "Entrenamiento").replace("_", " ").title()
        location = session.get("location") or "lugar habitual"

        athletes = (
            db.table("training_attendance")
            .select("athlete_id, athletes(user_id, first_name)")
            .eq("session_id", session["id"])
            .execute()
        ).data or []

        for row in athletes:
            athlete = row.get("athletes") or {}
            user_id = athlete.get("user_id")
            if not user_id:
                continue
            name = athlete.get("first_name", "Deportista")
            msg = (
                f"Hola {name}, mañana tienes {training_type} a las {time_str} "
                f"en {location}. ¡Te esperamos! 🛼"
            )
            notify_user(user_id, "Entrenamiento mañana", msg, "info", "AUTO-01")
            actions += 1

    log_activity("AUTO-01", "AG-11", "success",
                 records_found=len(sessions), actions_taken=actions,
                 summary=f"{len(sessions)} sesiones, {actions} notificaciones enviadas")
    return {"records_found": len(sessions), "actions_taken": actions}


# ── AUTO-02: Recordatorio 2 horas antes ────────────────────────────────────
@celery_app.task(name="tasks.calendar.training_reminder_2h")
def training_reminder_2h() -> dict:
    """Cada 30 min — detecta sesiones que empiezan en 2 horas exactas."""
    db = get_supabase()
    now = datetime.now(timezone.utc)
    window_start = (now + timedelta(hours=2)).replace(second=0, microsecond=0)
    window_end = window_start + timedelta(minutes=30)

    sessions = (
        db.table("training_sessions")
        .select("id, scheduled_at, training_type")
        .gte("scheduled_at", window_start.isoformat())
        .lt("scheduled_at", window_end.isoformat())
        .eq("status", "scheduled")
        .execute()
    ).data or []

    actions = 0
    for session in sessions:
        dt = datetime.fromisoformat(session["scheduled_at"].replace("Z", "+00:00"))
        training_type = session.get("training_type", "Entrenamiento").replace("_", " ").title()
        time_str = dt.astimezone().strftime("%H:%M")

        athletes = (
            db.table("training_attendance")
            .select("athlete_id, athletes(user_id, first_name)")
            .eq("session_id", session["id"])
            .execute()
        ).data or []

        for row in athletes:
            athlete = row.get("athletes") or {}
            user_id = athlete.get("user_id")
            if not user_id:
                continue
            name = athlete.get("first_name", "Deportista")
            notify_user(
                user_id,
                f"⏰ {training_type} en 2 horas",
                f"Hola {name}, tu {training_type} empieza a las {time_str}. ¡Prepárate!",
                "info",
                "AUTO-02",
            )
            actions += 1

    log_activity("AUTO-02", "AG-11", "success" if sessions else "skipped",
                 records_found=len(sessions), actions_taken=actions)
    return {"records_found": len(sessions), "actions_taken": actions}


# ── AUTO-03: Detección de huecos en el calendario ──────────────────────────
@celery_app.task(name="tasks.calendar.detect_schedule_gaps")
def detect_schedule_gaps() -> dict:
    """Lunes 08:00 — detecta días sin sesión en las próximas 4 semanas."""
    db = get_supabase()
    today = date.today()
    end_date = today + timedelta(weeks=4)

    sessions = (
        db.table("training_sessions")
        .select("scheduled_at")
        .gte("scheduled_at", today.isoformat())
        .lt("scheduled_at", end_date.isoformat())
        .eq("status", "scheduled")
        .execute()
    ).data or []

    scheduled_dates = {
        datetime.fromisoformat(s["scheduled_at"].replace("Z", "+00:00")).date()
        for s in sessions
    }

    # Check weekdays (Mon–Sat) without sessions
    gaps: list[str] = []
    current = today
    while current <= end_date:
        if current.weekday() < 6 and current not in scheduled_dates:
            gaps.append(current.strftime("%A %d/%m"))
        current += timedelta(days=1)

    if not gaps:
        log_activity("AUTO-03", "AG-11", "skipped", summary="Sin huecos detectados")
        return {"records_found": 0, "actions_taken": 0}

    summary_text = ", ".join(gaps[:5])
    msg = (
        f"Se detectaron {len(gaps)} días sin sesión en las próximas 4 semanas: "
        f"{summary_text}{'...' if len(gaps) > 5 else ''}. "
        f"Considera agregar sesiones para mantener el plan de periodización."
    )
    actions = 0
    for uid in get_admin_user_ids() + get_coach_user_ids():
        notify_user(uid, "Huecos en el calendario", msg, "warning", "AUTO-03")
        actions += 1

    log_activity("AUTO-03", "AG-11", "success",
                 records_found=len(gaps), actions_taken=actions,
                 summary=f"{len(gaps)} huecos detectados")
    return {"records_found": len(gaps), "actions_taken": actions}


# ── AUTO-04: Gestión de inasistencias ──────────────────────────────────────
@celery_app.task(name="tasks.calendar.handle_absence")
def handle_absence(athlete_id: str, session_id: str) -> dict:
    """Triggered via DB hook — analiza inasistencias consecutivas del atleta."""
    db = get_supabase()

    # Count recent consecutive absences (last 30 days)
    thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
    attendance = (
        db.table("training_attendance")
        .select("attended, training_sessions(scheduled_at)")
        .eq("athlete_id", athlete_id)
        .order("id", desc=True)
        .limit(10)
        .execute()
    ).data or []

    consecutive = 0
    for row in attendance:
        if row.get("attended") is False:
            consecutive += 1
        else:
            break

    if consecutive < 2:
        return {"records_found": 1, "actions_taken": 0}

    athlete = (
        db.table("athletes")
        .select("first_name, last_name, user_id, coach_id")
        .eq("id", athlete_id)
        .maybeSingle()
        .execute()
    ).data

    if not athlete:
        return {"records_found": 0, "actions_taken": 0}

    name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
    alert_level = "critical" if consecutive >= 3 else "warning"
    msg = f"{name} lleva {consecutive} inasistencias consecutivas."

    # Upsert attendance alert
    db.table("attendance_alerts").insert({
        "athlete_id": athlete_id,
        "consecutive_absences": consecutive,
        "alert_level": alert_level,
        "notified_coach": True,
        "notified_admin": consecutive >= 3,
    }).execute()

    actions = 0
    # Notify coach
    if athlete.get("coach_id"):
        coach_profile = (
            db.table("profiles")
            .select("id")
            .eq("id", athlete["coach_id"])
            .maybeSingle()
            .execute()
        ).data
        if coach_profile:
            notify_user(
                athlete["coach_id"],
                f"⚠️ Inasistencias: {name}",
                msg + " Por favor realiza seguimiento.",
                "warning",
                "AUTO-04",
            )
            actions += 1

    # Notify admin if critical
    if consecutive >= 3:
        for uid in get_admin_user_ids():
            notify_user(uid, f"🚨 Alerta retención: {name}", msg, "error", "AUTO-04")
            actions += 1

    log_activity("AUTO-04", "AG-02", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"{name}: {consecutive} inasistencias consecutivas ({alert_level})")
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-05: Lista de espera inteligente ────────────────────────────────────
@celery_app.task(name="tasks.calendar.process_waitlist")
def process_waitlist(session_id: str, freed_slot_athlete_id: str) -> dict:
    """Triggered when an athlete cancels — notifies next in waitlist."""
    db = get_supabase()

    session = (
        db.table("training_sessions")
        .select("id, scheduled_at, training_type")
        .eq("id", session_id)
        .maybeSingle()
        .execute()
    ).data

    if not session:
        return {"records_found": 0, "actions_taken": 0}

    # Find athletes marked as waitlisted (status = 'waitlisted') in attendance
    waitlisted = (
        db.table("training_attendance")
        .select("athlete_id, athletes(user_id, first_name, email)")
        .eq("session_id", session_id)
        .eq("status", "waitlisted")
        .order("created_at")
        .limit(1)
        .execute()
    ).data or []

    if not waitlisted:
        log_activity("AUTO-05", "AG-11", "skipped", summary="Lista de espera vacía")
        return {"records_found": 0, "actions_taken": 0}

    next_athlete = waitlisted[0]
    athlete = next_athlete.get("athletes") or {}
    user_id = athlete.get("user_id")
    dt = datetime.fromisoformat(session["scheduled_at"].replace("Z", "+00:00"))
    training_type = session.get("training_type", "Entrenamiento").replace("_", " ").title()
    time_str = dt.strftime("%H:%M %d/%m")

    if user_id:
        notify_user(
            user_id,
            "🎉 Cupo disponible",
            f"Se liberó un cupo para {training_type} el {time_str}. "
            f"Confirma tu asistencia en los próximos 30 minutos.",
            "success",
            "AUTO-05",
        )

    log_activity("AUTO-05", "AG-11", "success", records_found=1, actions_taken=1,
                 summary=f"Cupo notificado a {athlete.get('first_name', 'atleta')}")
    return {"records_found": 1, "actions_taken": 1}


# ── AUTO-06: Análisis semanal de carga de entrenamiento ────────────────────
@celery_app.task(name="tasks.calendar.weekly_load_analysis")
def weekly_load_analysis() -> dict:
    """Viernes 20:00 — semáforo verde/amarillo/rojo de carga por atleta."""
    db = get_supabase()
    week_ago = (date.today() - timedelta(days=7)).isoformat()

    sessions = (
        db.table("training_sessions")
        .select("id, scheduled_at, duration_minutes, intensity_level")
        .gte("scheduled_at", week_ago)
        .lte("scheduled_at", date.today().isoformat())
        .execute()
    ).data or []

    session_ids = [s["id"] for s in sessions]
    if not session_ids:
        log_activity("AUTO-06", "AG-02", "skipped", summary="Sin sesiones esta semana")
        return {"records_found": 0, "actions_taken": 0}

    attendance = (
        db.table("training_attendance")
        .select("athlete_id, attended, athletes(first_name, last_name, coach_id)")
        .in_("session_id", session_ids)
        .eq("attended", True)
        .execute()
    ).data or []

    # Group by athlete
    from collections import defaultdict
    athlete_sessions: dict[str, list] = defaultdict(list)
    athlete_info: dict[str, dict] = {}

    for row in attendance:
        aid = row["athlete_id"]
        athlete_sessions[aid].append(row)
        if aid not in athlete_info:
            athlete_info[aid] = row.get("athletes") or {}

    # Simple load scoring: sessions per week
    alerts: list[str] = []
    for aid, rows in athlete_sessions.items():
        count = len(rows)
        info = athlete_info[aid]
        name = f"{info.get('first_name', '')} {info.get('last_name', '')}".strip()
        if count >= 6:
            status = "🔴 Sobrecarga"
            alerts.append(f"{name}: {count} sesiones ({status})")
        elif count <= 1:
            status = "🟡 Sub-entrenamiento"
            alerts.append(f"{name}: {count} sesiones ({status})")

    actions = 0
    if alerts:
        msg = "Resumen de carga semanal:\n" + "\n".join(alerts[:20])
        for uid in get_coach_user_ids() + get_admin_user_ids():
            notify_user(uid, "📊 Análisis carga semanal", msg, "warning", "AUTO-06")
            actions += 1
    else:
        msg = f"Carga semanal normal para {len(athlete_sessions)} atletas. ✅"
        for uid in get_coach_user_ids():
            notify_user(uid, "📊 Carga semanal OK", msg, "success", "AUTO-06")
            actions += 1

    log_activity("AUTO-06", "AG-02", "success",
                 records_found=len(athlete_sessions), actions_taken=actions,
                 summary=f"{len(alerts)} atletas con alerta de carga")
    return {"records_found": len(athlete_sessions), "actions_taken": actions}
