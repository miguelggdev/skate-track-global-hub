"""AUTO-21 to AUTO-25: Automatizaciones de Marketing y Retención."""
from __future__ import annotations

import logging
from datetime import date, timedelta

from database.supabase_client import get_supabase
from tasks.celery_app import celery_app
from tasks.helpers import (
    get_admin_user_ids,
    get_automation_config,
    log_activity,
    notify_user,
    send_email,
)

logger = logging.getLogger(__name__)


# ── AUTO-21: Felicitación de cumpleaños ─────────────────────────────────────
@celery_app.task(name="tasks.marketing.birthday_greetings")
def birthday_greetings() -> dict:
    """Diario 07:00 — detecta cumpleaños y envía felicitaciones personalizadas."""
    cfg = get_automation_config("AUTO-21")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    today_mmdd = today.strftime("-%m-%d")

    # Athletes born on this day (any year)
    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, date_of_birth, user_id, coach_id, email")
        .eq("status", "active")
        .execute()
    ).data or []

    birthday_athletes = [
        a for a in athletes
        if a.get("date_of_birth") and a["date_of_birth"].endswith(today_mmdd)
    ]

    if not birthday_athletes:
        log_activity("AUTO-21", "AG-09", "skipped", summary="Sin cumpleaños hoy")
        return {"records_found": 0, "actions_taken": 0}

    actions = 0
    for athlete in birthday_athletes:
        name = athlete.get("first_name", "Deportista")
        dob = athlete.get("date_of_birth", "")
        age = today.year - int(dob[:4]) if dob else None
        age_text = f" ¡{age} años!" if age else ""

        # Age-appropriate message
        if age and age < 13:
            msg = f"🎂 ¡Feliz cumpleaños {name}!{age_text} El club te desea un día genial. ¡Sigue patinando con esa energía! 🛼🎉"
        elif age and age < 18:
            msg = f"🎂 ¡Feliz cumpleaños {name}!{age_text} Otro año de crecimiento deportivo. ¡Que este año sea el de tus mejores marcas! 🏆"
        else:
            msg = f"🎂 ¡Feliz cumpleaños {name}!{age_text} El club te agradece tu compromiso con el patinaje. ¡Que sea un gran año! 🛼"

        if athlete.get("user_id"):
            notify_user(athlete["user_id"], "🎂 ¡Feliz Cumpleaños!", msg, "success", "AUTO-21")
            actions += 1

        if athlete.get("email"):
            send_email(athlete["email"], f"¡Feliz Cumpleaños {name}!", msg)

        # Notify the coach to mention it in training
        if athlete.get("coach_id"):
            notify_user(
                athlete["coach_id"],
                f"🎂 Cumpleaños: {name}",
                f"Hoy cumple años {name}. Menciónalo en el entrenamiento. 🎉",
                "info",
                "AUTO-21",
            )
            actions += 1

    log_activity("AUTO-21", "AG-09", "success",
                 records_found=len(birthday_athletes), actions_taken=actions,
                 summary=f"{len(birthday_athletes)} cumpleaños hoy")
    return {"records_found": len(birthday_athletes), "actions_taken": actions}


# ── AUTO-22: Reactivación de atletas inactivos ──────────────────────────────
@celery_app.task(name="tasks.marketing.reactivate_inactive_athletes")
def reactivate_inactive_athletes() -> dict:
    """Quincena 10:00 — campaña de reactivación para atletas inactivos."""
    cfg = get_automation_config("AUTO-22")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    inactive_days = int(cfg["custom_params"].get("inactive_days", 60))
    db = get_supabase()
    today = date.today()
    thirty_days_ago = (today - timedelta(days=inactive_days)).isoformat()

    # Athletes inactive or with no attendance in 30+ days
    inactive = (
        db.table("athletes")
        .select("id, first_name, last_name, email, user_id, status")
        .eq("status", "inactive")
        .execute()
    ).data or []

    # Also check active athletes with no recent attendance
    recent_ids_result = (
        db.table("training_attendance")
        .select("athlete_id")
        .gte("created_at", thirty_days_ago)
        .execute()
    ).data or []
    attended_ids = {r["athlete_id"] for r in recent_ids_result}

    all_active = (
        db.table("athletes")
        .select("id, first_name, last_name, email, user_id")
        .eq("status", "active")
        .execute()
    ).data or []
    active_no_attendance = [a for a in all_active if a["id"] not in attended_ids]

    targets = {a["id"]: a for a in inactive + active_no_attendance}

    if not targets:
        log_activity("AUTO-22", "AG-09", "skipped", summary="Sin atletas para reactivar")
        return {"records_found": 0, "actions_taken": 0}

    actions = 0
    for athlete in targets.values():
        name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
        msg = (
            f"Hola {name}, te echamos de menos en la pista 🛼. "
            f"¿Todo bien? El club tiene novedades y tus compañeros preguntan por ti. "
            f"¡Ven a entrenar esta semana!"
        )

        # Log campaign (upsert evita duplicados si la tarea reintenta)
        db.table("retention_campaigns").upsert({
            "athlete_id": athlete["id"],
            "campaign_type": "reactivation",
            "period": today.strftime("%Y-%m"),
            "message_sent": msg,
        }, on_conflict="athlete_id,campaign_type,period").execute()

        if athlete.get("user_id"):
            notify_user(athlete["user_id"], "👋 ¡Te extrañamos!", msg, "info", "AUTO-22")
            actions += 1

        if athlete.get("email"):
            send_email(athlete["email"], "¡Te esperamos en el club!", msg)

    # Notify admin of campaign
    for uid in get_admin_user_ids():
        notify_user(
            uid,
            f"📢 Campaña de reactivación enviada",
            f"Se contactaron {len(targets)} atletas inactivos o con ausencia >30 días.",
            "info",
            "AUTO-22",
        )
        actions += 1

    log_activity("AUTO-22", "AG-09", "success",
                 records_found=len(targets), actions_taken=actions,
                 summary=f"Campaña enviada a {len(targets)} atletas")
    return {"records_found": len(targets), "actions_taken": actions}


# ── AUTO-23: Encuesta de satisfacción ──────────────────────────────────────
@celery_app.task(name="tasks.marketing.satisfaction_survey")
def satisfaction_survey() -> dict:
    """Trimestral — envía encuesta NPS a atletas y padres."""
    cfg = get_automation_config("AUTO-23")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    period = f"{today.year}-Q{(today.month - 1) // 3 + 1}"

    # Check if already sent this quarter
    existing = (
        db.table("satisfaction_surveys")
        .select("id")
        .eq("period", period)
        .limit(1)
        .execute()
    ).data or []

    if existing:
        log_activity("AUTO-23", "AG-09", "skipped", summary=f"Ya enviada en {period}")
        return {"records_found": 0, "actions_taken": 0}

    # Get active athletes with user accounts
    athletes = (
        db.table("athletes")
        .select("id, first_name, email, user_id")
        .eq("status", "active")
        .not_.is_("user_id", "null")
        .execute()
    ).data or []

    actions = 0
    for athlete in athletes:
        if not athlete.get("user_id"):
            continue

        db.table("satisfaction_surveys").insert({
            "user_id": athlete["user_id"],
            "respondent_role": "athlete",
            "period": period,
        }).execute()

        msg = (
            f"Hola {athlete.get('first_name', '')}, ¿qué tan satisfecho/a estás "
            f"con el club este trimestre? Responde nuestra encuesta rápida de 5 preguntas. "
            f"¡Tu opinión mejora el club! 📊"
        )
        notify_user(athlete["user_id"], "📊 Encuesta de satisfacción", msg, "info", "AUTO-23")
        actions += 1

        if athlete.get("email"):
            send_email(athlete["email"], f"Encuesta NPS — {period}", msg)

    log_activity("AUTO-23", "AG-09", "success",
                 records_found=len(athletes), actions_taken=actions,
                 summary=f"Encuesta {period} enviada a {len(athletes)} atletas")
    return {"records_found": len(athletes), "actions_taken": actions}


# ── AUTO-24: Solicitud de testimonio post-logro ─────────────────────────────
@celery_app.task(name="tasks.marketing.request_testimonial")
def request_testimonial(result_id: str) -> dict:
    """Triggered 24h after a notable competition result (medal or >5% improvement)."""
    cfg = get_automation_config("AUTO-24")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()

    result = (
        db.table("competition_results")
        .select("id, athlete_id, position, final_time, competition_id, athletes(user_id, first_name, last_name, email)")
        .eq("id", result_id)
        .maybeSingle()
        .execute()
    ).data

    if not result:
        return {"records_found": 0, "actions_taken": 0}

    position = result.get("position", 999)
    # Only request testimonial for top-3 finishes
    if position > 3:
        log_activity("AUTO-24", "AG-09", "skipped",
                     summary=f"Posición {position} no califica para testimonio")
        return {"records_found": 0, "actions_taken": 0}

    athlete = result.get("athletes") or {}
    name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
    medal = ["🥇", "🥈", "🥉"][position - 1]

    suggested_text = (
        f"'{medal} Conseguí el puesto #{position} en la competencia y estoy muy orgulloso/a "
        f"del trabajo que hemos hecho junto al club. ¡Gracias al equipo por el apoyo!'"
    )
    msg = (
        f"¡Felicidades {name} por tu {medal} puesto #{position}! "
        f"¿Nos compartes cómo te sentiste? Sugerencia: {suggested_text}"
    )

    actions = 0
    if athlete.get("user_id"):
        # Log testimonial request
        db.table("athlete_testimonials").insert({
            "athlete_id": result["athlete_id"],
            "trigger_result_id": result_id,
            "content": suggested_text,
            "approved": False,
        }).execute()

        notify_user(athlete["user_id"], "✍️ Comparte tu logro", msg, "success", "AUTO-24")
        actions += 1

    if athlete.get("email"):
        send_email(athlete["email"], f"Tu logro {medal} en la competencia", msg)

    log_activity("AUTO-24", "AG-09", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Testimonio solicitado a {name} por puesto #{position}")
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-25: Campaña pre-inscripción nueva temporada ───────────────────────
@celery_app.task(name="tasks.marketing.season_enrollment_campaign")
def season_enrollment_campaign() -> dict:
    """60 días antes del inicio de temporada — campaña de re-inscripción."""
    cfg = get_automation_config("AUTO-25")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()

    # All active athletes
    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, email, user_id, category, status")
        .in_("status", ["active", "inactive"])
        .execute()
    ).data or []

    if not athletes:
        log_activity("AUTO-25", "AG-09", "skipped", summary="Sin atletas")
        return {"records_found": 0, "actions_taken": 0}

    season_year = today.year if today.month > 6 else today.year
    next_season = f"{season_year + 1}"

    actions = 0
    for athlete in athletes:
        name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
        category = (athlete.get("category") or "").replace("_", " ").title()
        is_active = athlete.get("status") == "active"

        if is_active:
            msg = (
                f"Hola {name}, la temporada {next_season} ya está cerca. "
                f"Como atleta activo/a de {category}, tienes prioridad de inscripción. "
                f"¡Renueva tu lugar en el equipo!"
            )
        else:
            msg = (
                f"Hola {name}, ¡la temporada {next_season} es tu oportunidad de volver! "
                f"Plazas limitadas para categoría {category}. ¡Inscríbete antes que se agoten!"
            )

        if athlete.get("user_id"):
            notify_user(
                athlete["user_id"],
                f"📅 Inscripciones temporada {next_season}",
                msg,
                "info",
                "AUTO-25",
            )
            actions += 1

        if athlete.get("email"):
            send_email(
                athlete["email"],
                f"Inscripción temporada {next_season} — Club Patinaje",
                msg,
            )

    # Summary to admin
    for uid in get_admin_user_ids():
        notify_user(
            uid,
            f"📢 Campaña temporada {next_season} lanzada",
            f"Se contactaron {len(athletes)} atletas para la campaña de inscripción {next_season}.",
            "success",
            "AUTO-25",
        )
        actions += 1

    log_activity("AUTO-25", "AG-09", "success",
                 records_found=len(athletes), actions_taken=actions,
                 summary=f"Campaña {next_season} enviada a {len(athletes)} atletas")
    return {"records_found": len(athletes), "actions_taken": actions}
