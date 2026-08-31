"""AUTO-21 to AUTO-25: Automatizaciones de Marketing y Retención.

Multi-tenant (Fase 5 + 6 del plan, ver ~/.claude/plans/linear-roaming-torvalds.md):
cada task que corre por schedule (AUTO-21, 22, 23, 25) deja de ejecutarse
"una vez global" y pasa al patrón dispatch — una tarea `_dispatch` (la que
registra tasks/schedules.py) abanica una corrida hija por cada club activo
(tasks/helpers.get_active_club_ids). Si un club falla, no bloquea a los
demás: cada uno es su propia tarea con sus propios reintentos.

AUTO-24 (request_testimonial) sigue siendo event-driven, no en el
schedule — el club_id se deriva del atleta dueño del resultado.
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
    notify_user,
    send_email,
)

logger = logging.getLogger(__name__)


# ── AUTO-21: Felicitación de cumpleaños ─────────────────────────────────────

@celery_app.task(name="tasks.marketing.birthday_greetings_dispatch")
def birthday_greetings_dispatch() -> dict:
    """Diario 07:00 (Beat) — abanica una corrida de AUTO-21 por club activo."""
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        birthday_greetings.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.marketing.birthday_greetings")
def birthday_greetings(club_id: str) -> dict:
    """Detecta cumpleaños de HOY en el club y envía felicitaciones personalizadas."""
    cfg = get_automation_config("AUTO-21", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    today_mmdd = today.strftime("-%m-%d")

    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, date_of_birth, user_id, coach_id, email")
        .eq("club_id", club_id)
        .eq("status", "active")
        .execute()
    ).data or []

    birthday_athletes = [
        a for a in athletes
        if a.get("date_of_birth") and a["date_of_birth"].endswith(today_mmdd)
    ]

    if not birthday_athletes:
        log_activity("AUTO-21", "AG-09", "skipped", summary="Sin cumpleaños hoy", club_id=club_id)
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
            notify_user(athlete["user_id"], "🎂 ¡Feliz Cumpleaños!", msg, "success", "AUTO-21", club_id=club_id)
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
                club_id=club_id,
            )
            actions += 1

    log_activity("AUTO-21", "AG-09", "success",
                 records_found=len(birthday_athletes), actions_taken=actions,
                 summary=f"{len(birthday_athletes)} cumpleaños hoy", club_id=club_id)
    return {"records_found": len(birthday_athletes), "actions_taken": actions}


# ── AUTO-22: Reactivación de atletas inactivos ──────────────────────────────

@celery_app.task(name="tasks.marketing.reactivate_inactive_athletes_dispatch")
def reactivate_inactive_athletes_dispatch() -> dict:
    """Quincena 10:00 (Beat) — abanica una corrida de AUTO-22 por club activo."""
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        reactivate_inactive_athletes.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.marketing.reactivate_inactive_athletes")
def reactivate_inactive_athletes(club_id: str) -> dict:
    """Campaña de reactivación para atletas inactivos del club."""
    cfg = get_automation_config("AUTO-22", club_id)
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
        .eq("club_id", club_id)
        .eq("status", "inactive")
        .execute()
    ).data or []

    # Also check active athletes with no recent attendance. training_attendance
    # es tabla hija de athletes (Grupo C, sin club_id propio) — se filtra
    # implícitamente porque los athlete_id de este club son los únicos que
    # importan para el cruce de abajo.
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
        .eq("club_id", club_id)
        .eq("status", "active")
        .execute()
    ).data or []
    active_no_attendance = [a for a in all_active if a["id"] not in attended_ids]

    targets = {a["id"]: a for a in inactive + active_no_attendance}

    if not targets:
        log_activity("AUTO-22", "AG-09", "skipped", summary="Sin atletas para reactivar", club_id=club_id)
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
            "club_id": club_id,
        }, on_conflict="club_id,athlete_id,campaign_type,period").execute()

        if athlete.get("user_id"):
            notify_user(athlete["user_id"], "👋 ¡Te extrañamos!", msg, "info", "AUTO-22", club_id=club_id)
            actions += 1

        if athlete.get("email"):
            send_email(athlete["email"], "¡Te esperamos en el club!", msg)

    # Notify admins of THIS club only
    for uid in get_admin_user_ids(club_id):
        notify_user(
            uid,
            f"📢 Campaña de reactivación enviada",
            f"Se contactaron {len(targets)} atletas inactivos o con ausencia >30 días.",
            "info",
            "AUTO-22",
            club_id=club_id,
        )
        actions += 1

    log_activity("AUTO-22", "AG-09", "success",
                 records_found=len(targets), actions_taken=actions,
                 summary=f"Campaña enviada a {len(targets)} atletas", club_id=club_id)
    return {"records_found": len(targets), "actions_taken": actions}


# ── AUTO-23: Encuesta de satisfacción ──────────────────────────────────────

@celery_app.task(name="tasks.marketing.satisfaction_survey_dispatch")
def satisfaction_survey_dispatch() -> dict:
    """Trimestral (Beat) — abanica una corrida de AUTO-23 por club activo."""
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        satisfaction_survey.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.marketing.satisfaction_survey")
def satisfaction_survey(club_id: str) -> dict:
    """Envía encuesta NPS trimestral a atletas del club."""
    cfg = get_automation_config("AUTO-23", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    period = f"{today.year}-Q{(today.month - 1) // 3 + 1}"

    # Get active athletes of this club with user accounts (necesario antes
    # de chequear "ya enviada" porque satisfaction_surveys no tiene club_id
    # propio — se identifica por los user_id de ESTE club).
    athletes = (
        db.table("athletes")
        .select("id, first_name, email, user_id")
        .eq("club_id", club_id)
        .eq("status", "active")
        .not_.is_("user_id", "null")
        .execute()
    ).data or []
    club_user_ids = {a["user_id"] for a in athletes if a.get("user_id")}

    if not club_user_ids:
        log_activity("AUTO-23", "AG-09", "skipped", summary="Sin atletas con cuenta", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

    # Check if already sent this quarter to any user of this club
    existing = (
        db.table("satisfaction_surveys")
        .select("id, user_id")
        .eq("period", period)
        .in_("user_id", list(club_user_ids))
        .execute()
    ).data or []
    already_surveyed = {r["user_id"] for r in existing}

    pending = [a for a in athletes if a["user_id"] not in already_surveyed]

    if not pending:
        log_activity("AUTO-23", "AG-09", "skipped", summary=f"Ya enviada en {period}", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

    actions = 0
    for athlete in pending:
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
        notify_user(athlete["user_id"], "📊 Encuesta de satisfacción", msg, "info", "AUTO-23", club_id=club_id)
        actions += 1

        if athlete.get("email"):
            send_email(athlete["email"], f"Encuesta NPS — {period}", msg)

    log_activity("AUTO-23", "AG-09", "success",
                 records_found=len(pending), actions_taken=actions,
                 summary=f"Encuesta {period} enviada a {len(pending)} atletas", club_id=club_id)
    return {"records_found": len(pending), "actions_taken": actions}


# ── AUTO-24: Solicitud de testimonio post-logro (event-driven, sin dispatch) ─

@celery_app.task(name="tasks.marketing.request_testimonial")
def request_testimonial(result_id: str) -> dict:
    """Triggered 24h after a notable competition result (medal or top-3)."""
    db = get_supabase()

    result = (
        db.table("competition_results")
        .select("id, athlete_id, position, time_seconds, competition_id, athletes(user_id, first_name, last_name, email, club_id)")
        .eq("id", result_id)
        .maybeSingle()
        .execute()
    ).data

    if not result:
        return {"records_found": 0, "actions_taken": 0}

    athlete = result.get("athletes") or {}
    club_id = athlete.get("club_id")

    cfg = get_automation_config("AUTO-24", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}

    position = result.get("position", 999)
    # Only request testimonial for top-3 finishes
    if position > 3:
        log_activity("AUTO-24", "AG-09", "skipped",
                     summary=f"Posición {position} no califica para testimonio", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

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
        # athlete_testimonials es tabla hija de athletes (Grupo C, sin
        # club_id propio) — hereda el aislamiento vía EXISTS, no hace falta
        # setearlo acá.
        db.table("athlete_testimonials").insert({
            "athlete_id": result["athlete_id"],
            "trigger_result_id": result_id,
            "content": suggested_text,
            "approved": False,
        }).execute()

        notify_user(athlete["user_id"], "✍️ Comparte tu logro", msg, "success", "AUTO-24", club_id=club_id)
        actions += 1

    if athlete.get("email"):
        send_email(athlete["email"], f"Tu logro {medal} en la competencia", msg)

    log_activity("AUTO-24", "AG-09", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Testimonio solicitado a {name} por puesto #{position}", club_id=club_id)
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-25: Campaña pre-inscripción nueva temporada ───────────────────────

@celery_app.task(name="tasks.marketing.season_enrollment_campaign_dispatch")
def season_enrollment_campaign_dispatch() -> dict:
    """1ro de octubre (Beat) — abanica una corrida de AUTO-25 por club activo."""
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        season_enrollment_campaign.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.marketing.season_enrollment_campaign")
def season_enrollment_campaign(club_id: str) -> dict:
    """Campaña de re-inscripción de la nueva temporada para el club."""
    cfg = get_automation_config("AUTO-25", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()

    # All active/inactive athletes of this club
    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, email, user_id, category, status")
        .eq("club_id", club_id)
        .in_("status", ["active", "inactive"])
        .execute()
    ).data or []

    if not athletes:
        log_activity("AUTO-25", "AG-09", "skipped", summary="Sin atletas", club_id=club_id)
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
                club_id=club_id,
            )
            actions += 1

        if athlete.get("email"):
            send_email(
                athlete["email"],
                f"Inscripción temporada {next_season} — Club Patinaje",
                msg,
            )

    # Summary to admins of THIS club
    for uid in get_admin_user_ids(club_id):
        notify_user(
            uid,
            f"📢 Campaña temporada {next_season} lanzada",
            f"Se contactaron {len(athletes)} atletas para la campaña de inscripción {next_season}.",
            "success",
            "AUTO-25",
            club_id=club_id,
        )
        actions += 1

    log_activity("AUTO-25", "AG-09", "success",
                 records_found=len(athletes), actions_taken=actions,
                 summary=f"Campaña {next_season} enviada a {len(athletes)} atletas", club_id=club_id)
    return {"records_found": len(athletes), "actions_taken": actions}
