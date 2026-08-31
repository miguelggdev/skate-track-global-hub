"""AUTO-26 to AUTO-29: Automatizaciones de Reportería.

Multi-tenant (Fase 5 + 6): las 4 son programadas, todas usan el patrón
dispatch — `_dispatch` (Beat) abanica una corrida por club activo.
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
    get_coach_user_ids,
    log_activity,
    notify_user,
)

logger = logging.getLogger(__name__)


# ── AUTO-26: Reporte semanal para el directivo ──────────────────────────────

@celery_app.task(name="tasks.reporting.weekly_executive_report_dispatch")
def weekly_executive_report_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        weekly_executive_report.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.reporting.weekly_executive_report")
def weekly_executive_report(club_id: str) -> dict:
    """Domingos 20:00 — consolida KPIs semanales del club para el directivo."""
    cfg = get_automation_config("AUTO-26", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    week_ago = (today - timedelta(weeks=1)).isoformat()
    two_weeks_ago = (today - timedelta(weeks=2)).isoformat()

    # Fetch session IDs for the last 2 weeks to avoid full table scan
    recent_session_rows = (
        db.table("training_sessions")
        .select("id")
        .eq("club_id", club_id)
        .gte("scheduled_at", two_weeks_ago)
        .lte("scheduled_at", today.isoformat())
        .execute()
    ).data or []
    recent_session_ids = [s["id"] for s in recent_session_rows] or ["00000000-0000-0000-0000-000000000000"]

    # This week's attendance (filtered by session IDs)
    attendance_this = (
        db.table("training_attendance")
        .select("attended, training_sessions!inner(scheduled_at)")
        .in_("training_session_id", recent_session_ids)
        .execute()
    ).data or []

    this_week_att = [
        a for a in attendance_this
        if week_ago <= (a.get("training_sessions") or {}).get("scheduled_at", "")[:10] <= today.isoformat()
    ]
    last_week_att = [
        a for a in attendance_this
        if two_weeks_ago <= (a.get("training_sessions") or {}).get("scheduled_at", "")[:10] < week_ago
    ]

    this_attended = sum(1 for a in this_week_att if a.get("attended"))
    this_total = len(this_week_att)
    last_attended = sum(1 for a in last_week_att if a.get("attended"))
    last_total = len(last_week_att)

    att_rate_now = round(this_attended / this_total * 100, 1) if this_total else 0
    att_rate_prev = round(last_attended / last_total * 100, 1) if last_total else 0
    att_delta = att_rate_now - att_rate_prev

    # This week's income
    transactions = (
        db.table("financial_transactions")
        .select("amount, payment_status")
        .eq("club_id", club_id)
        .gte("transaction_date", week_ago)
        .lte("transaction_date", today.isoformat())
        .execute()
    ).data or []
    weekly_income = sum(
        t["amount"] for t in transactions if t.get("payment_status") == "paid"
    )

    # Active athletes count
    athletes = (
        db.table("athletes").select("id").eq("club_id", club_id).eq("status", "active").execute()
    ).data or []

    # Competition results this week. competition_results es Grupo C (hereda
    # club_id de competitions vía RLS) — se filtra por athlete_id del club
    # para no depender de un join adicional.
    athlete_ids = [a["id"] for a in athletes] or ["00000000-0000-0000-0000-000000000000"]
    results = (
        db.table("competition_results")
        .select("id, position")
        .in_("athlete_id", athlete_ids)
        .gte("created_at", week_ago)
        .execute()
    ).data or []
    medals = [r for r in results if r.get("position", 99) <= 3]

    att_trend = f"{'↑' if att_delta >= 0 else '↓'}{abs(att_delta):.1f}%"
    msg = (
        f"📊 REPORTE SEMANAL — {today.strftime('%d/%m/%Y')}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👟 Asistencia: {att_rate_now}% ({att_trend} vs semana anterior)\n"
        f"💰 Ingresos semana: ${weekly_income:,.0f}\n"
        f"👥 Atletas activos: {len(athletes)}\n"
        f"🏆 Resultados: {len(results)} registrados | {len(medals)} medallas\n"
        f"━━━━━━━━━━━━━━━━━━━━━━"
    )

    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "📊 Reporte semanal", msg, "info", "AUTO-26", club_id=club_id)
        actions += 1

    log_activity("AUTO-26", "AG-01", "success",
                 records_found=len(athletes), actions_taken=actions,
                 summary=f"Asistencia {att_rate_now}%, ingresos ${weekly_income:,.0f}", club_id=club_id)
    return {"records_found": len(athletes), "actions_taken": actions}


# ── AUTO-27: Reporte mensual de rendimiento deportivo ──────────────────────

@celery_app.task(name="tasks.reporting.monthly_performance_report_dispatch")
def monthly_performance_report_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        monthly_performance_report.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.reporting.monthly_performance_report")
def monthly_performance_report(club_id: str) -> dict:
    """1ro de cada mes 08:00 — consolida rendimiento deportivo del club del mes anterior."""
    cfg = get_automation_config("AUTO-27", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    # Last month range
    first_this_month = today.replace(day=1)
    last_month_end = first_this_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    athletes = (
        db.table("athletes").select("id").eq("club_id", club_id).execute()
    ).data or []
    athlete_ids = [a["id"] for a in athletes] or ["00000000-0000-0000-0000-000000000000"]

    # Competition results last month (Grupo C, se filtra por athlete_id del club)
    results = (
        db.table("competition_results")
        .select("id, athlete_id, position, time_seconds, event_name, athletes(first_name, last_name)")
        .in_("athlete_id", athlete_ids)
        .gte("created_at", last_month_start.isoformat())
        .lte("created_at", last_month_end.isoformat())
        .execute()
    ).data or []

    # Time records last month
    time_records = (
        db.table("time_records")
        .select("athlete_id, time_ms, athletes(first_name, last_name, category)")
        .eq("club_id", club_id)
        .gte("recorded_at", last_month_start.isoformat())
        .lte("recorded_at", last_month_end.isoformat())
        .execute()
    ).data or []

    medals = [r for r in results if r.get("position", 99) <= 3]
    top_position = min((r.get("position", 99) for r in results), default=None)

    msg = (
        f"🏆 REPORTE DEPORTIVO — {last_month_start.strftime('%B %Y').upper()}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Competencias registradas: {len(results)} resultados\n"
        f"Medallas (top 3): {len(medals)} 🏅\n"
        f"Mejor posición del mes: #{top_position if top_position is not None else 'N/A'}\n"
        f"Registros de tiempo: {len(time_records)}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Ver detalle completo en el dashboard del club."
    )

    actions = 0
    for uid in get_coach_user_ids(club_id) + get_admin_user_ids(club_id):
        notify_user(uid, "🏅 Reporte mensual deportivo", msg, "success", "AUTO-27", club_id=club_id)
        actions += 1

    log_activity("AUTO-27", "AG-02", "success",
                 records_found=len(results), actions_taken=actions,
                 summary=f"{len(results)} resultados, {len(medals)} medallas en {last_month_start.strftime('%B %Y')}", club_id=club_id)
    return {"records_found": len(results), "actions_taken": actions}


# ── AUTO-28: Reporte inscripción federativa ──────────────────────────────────

@celery_app.task(name="tasks.reporting.federation_inscription_report_dispatch")
def federation_inscription_report_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        federation_inscription_report.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.reporting.federation_inscription_report")
def federation_inscription_report(club_id: str) -> dict:
    """Manual + automático 30 días antes de cierre federativo — verifica documentación del club."""
    cfg = get_automation_config("AUTO-28", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    season = str(today.year)

    active_athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, email, user_id")
        .eq("club_id", club_id)
        .eq("status", "active")
        .execute()
    ).data or []

    # Required doc types per athlete
    required_types = ["inscription", "cert_medical", "auth_image", "membership"]
    complete, incomplete = 0, 0
    incomplete_list: list[str] = []

    athlete_ids = [a["id"] for a in active_athletes]
    all_docs = (
        db.table("federation_documents")
        .select("athlete_id, doc_type, status")
        .eq("club_id", club_id)
        .in_("athlete_id", athlete_ids or ["00000000-0000-0000-0000-000000000000"])
        .eq("season", season)
        .execute()
    ).data or []
    docs_by_athlete: dict[str, list] = {}
    for doc in all_docs:
        docs_by_athlete.setdefault(doc["athlete_id"], []).append(doc)

    for athlete in active_athletes:
        existing_docs = docs_by_athlete.get(athlete["id"], [])

        complete_types = {d["doc_type"] for d in existing_docs if d.get("status") == "complete"}
        missing = [t for t in required_types if t not in complete_types]

        if missing:
            incomplete += 1
            name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
            incomplete_list.append(f"{name}: {', '.join(missing)}")

            # Notify athlete about missing docs
            if athlete.get("user_id"):
                notify_user(
                    athlete["user_id"],
                    "📋 Documentos federativos pendientes",
                    f"Para la temporada {season} te faltan: {', '.join(missing)}. "
                    f"Súbelos a tu perfil antes del cierre de inscripciones.",
                    "warning",
                    "AUTO-28",
                    club_id=club_id,
                )
        else:
            complete += 1

    summary_msg = (
        f"📋 DOCUMENTACIÓN FEDERATIVA {season}\n"
        f"Atletas completos: {complete} ✅\n"
        f"Atletas con docs faltantes: {incomplete} ⚠️\n"
        f"{'Detalle: ' + '; '.join(incomplete_list[:5]) if incomplete_list else ''}"
    )

    actions = incomplete  # Each incomplete notification counts
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "📋 Estado documentación federativa", summary_msg,
                    "error" if incomplete > 5 else "warning", "AUTO-28", club_id=club_id)
        actions += 1

    log_activity("AUTO-28", "AG-01", "success",
                 records_found=len(active_athletes), actions_taken=actions,
                 summary=f"{complete} completos, {incomplete} incompletos para temporada {season}", club_id=club_id)
    return {"records_found": len(active_athletes), "actions_taken": actions}


# ── AUTO-29: Dashboard de análisis predictivo ───────────────────────────────

@celery_app.task(name="tasks.reporting.predictive_analysis_dispatch")
def predictive_analysis_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        predictive_analysis.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.reporting.predictive_analysis")
def predictive_analysis(club_id: str) -> dict:
    """Domingos 23:00 — predice rendimiento y riesgo de lesión por atleta del club."""
    cfg = get_automation_config("AUTO-29", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today()
    three_months_ago = (today - timedelta(days=90)).isoformat()
    one_month_ago = (today - timedelta(days=30)).isoformat()

    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, category")
        .eq("club_id", club_id)
        .eq("status", "active")
        .execute()
    ).data or []

    predictions_created = 0

    for athlete in athletes:
        athlete_id = athlete["id"]

        # Load factor: sessions in last month
        recent_sessions = (
            db.table("training_attendance")
            .select("id")
            .eq("athlete_id", athlete_id)
            .eq("attended", True)
            .gte("created_at", one_month_ago)
            .execute()
        ).data or []
        session_count = len(recent_sessions)

        # Time trend: compare last month vs 3 months ago
        time_records = (
            db.table("time_records")
            .select("time_ms, recorded_at")
            .eq("athlete_id", athlete_id)
            .gte("recorded_at", three_months_ago)
            .order("recorded_at")
            .execute()
        ).data or []

        # Calculate load status
        if session_count >= 24:
            load_status = "overloaded"
            injury_risk = "high"
        elif session_count <= 4:
            load_status = "underloaded"
            injury_risk = "low"
        else:
            load_status = "optimal"
            injury_risk = "low" if session_count <= 16 else "medium"

        # Medal potential based on time trend
        if len(time_records) >= 4:
            first_half = [r["time_ms"] for r in time_records[:len(time_records)//2] if r.get("time_ms")]
            second_half = [r["time_ms"] for r in time_records[len(time_records)//2:] if r.get("time_ms")]
            if first_half and second_half:
                avg_first = sum(first_half) / len(first_half)
                avg_second = sum(second_half) / len(second_half)
                improvement_pct = (avg_first - avg_second) / avg_first * 100 if avg_first > 0 else 0
                medal_potential = "high" if improvement_pct > 5 else ("medium" if improvement_pct > 1 else "low")
            else:
                medal_potential = "medium"
        else:
            medal_potential = "medium"

        rec = (
            f"Carga: {load_status} ({session_count} sesiones/mes). "
            f"Riesgo lesión: {injury_risk}. "
            f"Potencial medalla: {medal_potential}. "
            f"{'Reducir carga esta semana.' if load_status == 'overloaded' else ''}"
            f"{'Aumentar frecuencia de entrenamiento.' if load_status == 'underloaded' else ''}"
        )

        db.table("athlete_performance_predictions").upsert({
            "athlete_id": athlete_id,
            "medal_potential": medal_potential,
            "injury_risk": injury_risk,
            "training_load_status": load_status,
            "recommendations": rec,
            "model_data": {
                "sessions_last_month": session_count,
                "time_records_analyzed": len(time_records),
            },
        }, on_conflict="athlete_id").execute()
        predictions_created += 1

    # Summary to coaches
    actions = 0
    if predictions_created > 0:
        msg = (
            f"🤖 Análisis predictivo semanal completado:\n"
            f"{predictions_created} atletas analizados.\n"
            f"Revisa el dashboard para ver potencial de medallas y riesgo de lesión."
        )
        for uid in get_coach_user_ids(club_id) + get_admin_user_ids(club_id):
            notify_user(uid, "🤖 Análisis predictivo listo", msg, "info", "AUTO-29", club_id=club_id)
            actions += 1

    log_activity("AUTO-29", "AG-02", "success",
                 records_found=len(athletes), actions_taken=actions,
                 summary=f"{predictions_created} predicciones generadas", club_id=club_id)
    return {"records_found": len(athletes), "actions_taken": predictions_created}
