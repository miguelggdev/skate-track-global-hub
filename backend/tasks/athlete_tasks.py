"""AUTO-12 to AUTO-15: Automatizaciones de Seguimiento de Atletas."""
from __future__ import annotations

import logging
from datetime import date, timedelta

from database.supabase_client import get_supabase
from tasks.celery_app import celery_app
from tasks.helpers import (
    get_admin_user_ids,
    get_automation_config,
    get_coach_user_ids,
    log_activity,
    notify_user,
    send_email,
)

logger = logging.getLogger(__name__)


# ── AUTO-12: Seguimiento post-competencia ───────────────────────────────────
@celery_app.task(name="tasks.athlete.post_competition_followup")
def post_competition_followup(result_id: str) -> dict:
    """Triggered on new competition_results row — análisis y feedback al atleta."""
    cfg = get_automation_config("AUTO-12")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()

    result = (
        db.table("competition_results")
        .select("id, athlete_id, final_time, position, category, competition_id, athletes(user_id, first_name, last_name, coach_id, email)")
        .eq("id", result_id)
        .maybeSingle()
        .execute()
    ).data

    if not result:
        log_activity("AUTO-12", "AG-02", "skipped", summary="Resultado no encontrado")
        return {"records_found": 0, "actions_taken": 0}

    athlete = result.get("athletes") or {}
    name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
    position = result.get("position")
    category = result.get("category", "")
    final_time = result.get("final_time", "")

    # Determine sentiment based on position
    if position and position <= 3:
        sentiment = "¡Excelente resultado! 🏆"
        msg_type = "success"
    elif position and position <= 8:
        sentiment = "Buen desempeño. ¡Sigue así! 💪"
        msg_type = "info"
    else:
        sentiment = "Cada competencia es una oportunidad de aprender. ¡Ánimo! 🛼"
        msg_type = "info"

    msg = (
        f"Hola {name}, tu resultado en la competencia: "
        f"Posición #{position} | Tiempo: {final_time} | Categoría: {category}. "
        f"{sentiment} Tu entrenador revisará los detalles técnicos contigo."
    )

    actions = 0
    if athlete.get("user_id"):
        notify_user(athlete["user_id"], "🏆 Resultado registrado", msg, msg_type, "AUTO-12")
        actions += 1

    # Notify coach
    if athlete.get("coach_id"):
        coach_msg = (
            f"Nuevo resultado de {name}: Posición #{position}, Tiempo {final_time}, "
            f"Categoría {category}. Revisa el análisis técnico en el perfil del atleta."
        )
        notify_user(athlete["coach_id"], f"📊 Resultado: {name}", coach_msg, "info", "AUTO-12")
        actions += 1

    log_activity("AUTO-12", "AG-02", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"{name} pos #{position} tiempo {final_time}")
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-13: Recordatorio de evaluación física semestral ───────────────────
@celery_app.task(name="tasks.athlete.evaluation_reminder")
def evaluation_reminder() -> dict:
    """Semanal — identifica atletas sin evaluación en >180 días."""
    cfg = get_automation_config("AUTO-13")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    threshold = (today - timedelta(days=180)).isoformat()

    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, email, user_id, last_evaluation_date, coach_id")
        .eq("status", "active")
        .execute()
    ).data or []

    overdue = [
        a for a in athletes
        if not a.get("last_evaluation_date") or a["last_evaluation_date"] <= threshold
    ]

    if not overdue:
        log_activity("AUTO-13", "AG-04", "skipped", summary="Todos con evaluación reciente")
        return {"records_found": 0, "actions_taken": 0}

    actions = 0
    for athlete in overdue:
        name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
        last = athlete.get("last_evaluation_date") or "nunca"
        msg = (
            f"Hola {name}, tu última evaluación física fue el {last}. "
            f"Es momento de programar una evaluación semestral para ajustar tu plan de entrenamiento."
        )
        if athlete.get("user_id"):
            notify_user(
                athlete["user_id"],
                "📋 Evaluación física pendiente",
                msg,
                "warning",
                "AUTO-13",
            )
            actions += 1
        if athlete.get("email"):
            send_email(athlete["email"], "Evaluación física semestral pendiente", msg)

    # Summary to coaches
    summary_msg = (
        f"{len(overdue)} atletas sin evaluación en más de 180 días. "
        f"Por favor programa sus evaluaciones."
    )
    for uid in get_coach_user_ids():
        notify_user(uid, "📋 Evaluaciones pendientes", summary_msg, "warning", "AUTO-13")
        actions += 1

    log_activity("AUTO-13", "AG-04", "success",
                 records_found=len(overdue), actions_taken=actions,
                 summary=f"{len(overdue)} atletas sin evaluación")
    return {"records_found": len(overdue), "actions_taken": actions}


# ── AUTO-14: Alertas de lesión y protocolo de recuperación ─────────────────
@celery_app.task(name="tasks.athlete.injury_protocol")
def injury_protocol(medical_session_id: str) -> dict:
    """Triggered on new medical_session with injury type — protocolo automático."""
    cfg = get_automation_config("AUTO-14")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()

    session = (
        db.table("medical_sessions")
        .select("id, athlete_id, session_type, diagnosis, recommendations, session_date, athletes(user_id, first_name, last_name, coach_id)")
        .eq("id", medical_session_id)
        .maybeSingle()
        .execute()
    ).data

    if not session or session.get("session_type") not in ("lesion", "injury", "rehabilitacion"):
        log_activity("AUTO-14", "AG-06", "skipped", summary="No es registro de lesión")
        return {"records_found": 0, "actions_taken": 0}

    athlete = session.get("athletes") or {}
    name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
    diagnosis = session.get("diagnosis") or "lesión registrada"
    recs = session.get("recommendations") or "Reposo y seguimiento médico"

    actions = 0

    # Notify athlete
    if athlete.get("user_id"):
        notify_user(
            athlete["user_id"],
            "🏥 Protocolo de recuperación activado",
            f"Se registró: {diagnosis}. Recomendaciones: {recs}. "
            f"Tu entrenador fue notificado. Seguimiento programado a los 7, 14 y 30 días.",
            "warning",
            "AUTO-14",
        )
        actions += 1

    # Notify coach
    if athlete.get("coach_id"):
        notify_user(
            athlete["coach_id"],
            f"🚨 Lesión registrada: {name}",
            f"Diagnóstico: {diagnosis}. "
            f"El atleta debe modificar su entrenamiento según el protocolo médico. "
            f"Recomendaciones: {recs}",
            "error",
            "AUTO-14",
        )
        actions += 1

    # Schedule follow-ups (queue tasks for 7, 14, 30 days)
    for days in [7, 14, 30]:
        injury_followup.apply_async(
            args=[medical_session_id, days],
            countdown=days * 86400,
        )

    log_activity("AUTO-14", "AG-06", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"{name}: {diagnosis} — seguimientos programados 7/14/30 días")
    return {"records_found": 1, "actions_taken": actions}


@celery_app.task(name="tasks.athlete.injury_followup")
def injury_followup(medical_session_id: str, days: int) -> dict:
    """Seguimiento post-lesión a los 7, 14 y 30 días."""
    db = get_supabase()

    session = (
        db.table("medical_sessions")
        .select("id, athlete_id, diagnosis, athletes(user_id, first_name, coach_id)")
        .eq("id", medical_session_id)
        .maybeSingle()
        .execute()
    ).data

    if not session:
        return {"records_found": 0, "actions_taken": 0}

    athlete = session.get("athletes") or {}
    name = athlete.get("first_name", "Deportista")
    diagnosis = session.get("diagnosis", "lesión")

    actions = 0
    if athlete.get("user_id"):
        notify_user(
            athlete["user_id"],
            f"🔄 Seguimiento lesión ({days}d)",
            f"Han pasado {days} días desde tu registro de {diagnosis}. "
            f"¿Cómo te encuentras? Informa a tu médico o entrenador tu estado actual.",
            "info",
            "AUTO-14",
        )
        actions += 1

    if athlete.get("coach_id"):
        notify_user(
            athlete["coach_id"],
            f"🔄 Seguimiento lesión {name} ({days}d)",
            f"Han pasado {days} días desde el registro de {diagnosis} de {name}. "
            f"Verifica su estado de recuperación.",
            "info",
            "AUTO-14",
        )
        actions += 1

    log_activity("AUTO-14", "AG-06", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Seguimiento día {days} para {name}")
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-15: Monitoreo de progreso por categoría ────────────────────────────
@celery_app.task(name="tasks.athlete.weekly_progress_monitor")
def weekly_progress_monitor() -> dict:
    """Lunes 07:00 — compara tiempos vs 4 semanas atrás, ranking interno."""
    cfg = get_automation_config("AUTO-15")
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    four_weeks_ago = (today - timedelta(weeks=4)).isoformat()

    recent = (
        db.table("time_records")
        .select("athlete_id, time_seconds, discipline, recorded_at, athletes(first_name, last_name, category)")
        .gte("recorded_at", four_weeks_ago)
        .order("athlete_id, recorded_at", desc=True)
        .execute()
    ).data or []

    if not recent:
        log_activity("AUTO-15", "AG-02", "skipped", summary="Sin registros de tiempo recientes")
        return {"records_found": 0, "actions_taken": 0}

    # Group by athlete, get best time this week vs 4 weeks ago
    from collections import defaultdict
    by_athlete: dict[str, list] = defaultdict(list)
    for r in recent:
        by_athlete[r["athlete_id"]].append(r)

    week_ago = (today - timedelta(weeks=1)).isoformat()
    improvements: list[tuple[str, float, str]] = []

    for athlete_id, records in by_athlete.items():
        this_week = [r for r in records if r.get("recorded_at", "") >= week_ago]
        older = [r for r in records if r.get("recorded_at", "") < week_ago]

        if not this_week or not older:
            continue

        best_now_values = [r["time_seconds"] for r in this_week if r.get("time_seconds")]
        best_before_values = [r["time_seconds"] for r in older if r.get("time_seconds")]

        if not best_now_values or not best_before_values:
            continue

        best_now = min(best_now_values)
        best_before = min(best_before_values)

        if best_before > 0:
            improvement = (best_before - best_now) / best_before * 100
            info = (records[0].get("athletes") or {})
            name = f"{info.get('first_name', '')} {info.get('last_name', '')}".strip()
            improvements.append((name, improvement, info.get("category", "")))

    improvements.sort(key=lambda x: x[1], reverse=True)

    actions = 0
    if improvements:
        top3 = improvements[:3]
        ranking_text = "\n".join(
            f"{i+1}. {name} ({cat}): {imp:+.1f}% {'🏆' if i == 0 else ''}"
            for i, (name, imp, cat) in enumerate(top3)
        )
        msg = f"🏅 Atletas de la semana:\n{ranking_text}\n\nTotal evaluados: {len(improvements)}"
        for uid in get_coach_user_ids() + get_admin_user_ids():
            notify_user(uid, "📊 Progreso semanal de atletas", msg, "success", "AUTO-15")
            actions += 1

    log_activity("AUTO-15", "AG-02", "success",
                 records_found=len(by_athlete), actions_taken=actions,
                 summary=f"{len(improvements)} atletas con mejora detectada")
    return {"records_found": len(by_athlete), "actions_taken": actions}
