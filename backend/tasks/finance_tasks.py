"""AUTO-07 to AUTO-11: Automatizaciones de Facturación y Finanzas.

Multi-tenant (Fase 5 + 6): AUTO-08/09/10/11 (programadas) usan el patrón
dispatch — `_dispatch` (Beat) abanica una corrida por club activo. AUTO-07
(event-driven) deriva club_id de la transacción que la dispara.
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
    render_email_template,
    send_email,
)

logger = logging.getLogger(__name__)

PAYMENT_INSTRUCTIONS = (
    "Banco: Bancolombia\n"
    "Cuenta de ahorros: 000-000000-00\n"
    "A nombre de: Club de Patinaje de Velocidad\n"
    "Referencia: [Nombre del atleta + mes]"
)


# ── AUTO-07: Recibo automático de pago (event-driven) ──────────────────────

@celery_app.task(name="tasks.finance.generate_payment_receipt")
def generate_payment_receipt(transaction_id: str) -> dict:
    """Triggered on new income transaction — notifies payer and logs receipt."""
    db = get_supabase()

    tx = (
        db.table("financial_transactions")
        .select("id, amount, transaction_type, description, athlete_id, transaction_date, club_id")
        .eq("id", transaction_id)
        .maybeSingle()
        .execute()
    ).data

    if not tx:
        log_activity("AUTO-07", "AG-07", "skipped", summary="Transacción no encontrada")
        return {"records_found": 0, "actions_taken": 0}

    club_id = tx.get("club_id")
    cfg = get_automation_config("AUTO-07", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}

    athlete_id = tx.get("athlete_id")
    amount = tx.get("amount", 0)
    description = tx.get("description") or tx.get("transaction_type", "Pago")
    tx_date = tx.get("transaction_date", date.today().isoformat())

    msg = (
        f"Se registró tu pago de ${amount:,.0f} por concepto de '{description}' "
        f"el {tx_date}. ¡Gracias! 🎉"
    )

    actions = 0
    if athlete_id:
        athlete = (
            db.table("athletes")
            .select("first_name, last_name, email, user_id")
            .eq("id", athlete_id)
            .maybeSingle()
            .execute()
        ).data
        if athlete:
            if athlete.get("user_id"):
                notify_user(
                    athlete["user_id"], "✅ Pago registrado", msg, "success", "AUTO-07", club_id=club_id
                )
                actions += 1
            if athlete.get("email"):
                send_email(
                    athlete["email"],
                    "Recibo de pago — Club Patinaje",
                    msg,
                )
                actions += 1

    log_activity("AUTO-07", "AG-07", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Recibo generado: ${amount:,.0f} - {description}", club_id=club_id)
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-08: Alertas de cartera morosa ─────────────────────────────────────

@celery_app.task(name="tasks.finance.overdue_payment_alerts_dispatch")
def overdue_payment_alerts_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        overdue_payment_alerts.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.finance.overdue_payment_alerts")
def overdue_payment_alerts(club_id: str) -> dict:
    """1ro y 15 de cada mes 09:00 — alerta sobre atletas del club con pagos vencidos."""
    cfg = get_automation_config("AUTO-08", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    p = cfg["custom_params"]
    db = get_supabase()
    today = date.today()
    thirty_days_ago = (today - timedelta(days=int(p.get("days_warning", 30)))).isoformat()
    sixty_days_ago = (today - timedelta(days=int(p.get("days_critical", 60)))).isoformat()
    ninety_days_ago = (today - timedelta(days=int(p.get("days_urgent", 90)))).isoformat()

    overdue = (
        db.table("financial_transactions")
        .select("id, athlete_id, amount, transaction_date, payment_status, athletes(first_name, last_name, email, user_id)")
        .eq("club_id", club_id)
        .eq("payment_status", "pending")
        .lte("transaction_date", thirty_days_ago)
        .execute()
    ).data or []

    if not overdue:
        log_activity("AUTO-08", "AG-07", "skipped", summary="Sin morosos", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

    total_overdue = sum(tx.get("amount", 0) for tx in overdue)
    red, orange, yellow = [], [], []
    actions = 0

    for tx in overdue:
        tx_date = tx.get("transaction_date", "")
        athlete = tx.get("athletes") or {}
        name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
        amount = tx.get("amount", 0)

        if tx_date <= ninety_days_ago:
            red.append((name, amount))
            level = "error"
        elif tx_date <= sixty_days_ago:
            orange.append((name, amount))
            level = "warning"
        else:
            yellow.append((name, amount))
            level = "info"

        # Notify the athlete's linked user
        if athlete.get("user_id"):
            notify_user(
                athlete["user_id"],
                "💸 Pago pendiente",
                f"Tienes un pago pendiente de ${amount:,.0f}. "
                f"Por favor regulariza tu situación para continuar entrenando.",
                level,
                "AUTO-08",
                club_id=club_id,
            )
            actions += 1

        # Send email reminder to the athlete
        athlete_email = athlete.get("email") or ""
        if athlete_email:
            try:
                days_overdue = (date.today() - date.fromisoformat(tx["transaction_date"])).days
                tx_date_obj = date.fromisoformat(tx["transaction_date"])
                html = render_email_template("payment_reminder_email.html", {
                    "athlete_name": name,
                    "invoice_number": str(tx.get("id", ""))[:8].upper(),
                    "month_name": tx_date_obj.strftime("%B"),
                    "year": tx_date_obj.year,
                    "amount": f"{float(amount):,.0f}",
                    "days_overdue": days_overdue,
                    "payment_instructions": PAYMENT_INSTRUCTIONS,
                    "to_email": athlete_email,
                })
                send_email(
                    to=athlete_email,
                    subject="Pago pendiente — Club SpeedSkateTrack",
                    html_body=html,
                )
                actions += 1
            except Exception as exc:
                logger.error("AUTO-08 email failed for %s: %s", athlete_email, exc)

    # Summary to admins of THIS club
    summary_msg = (
        f"Cartera morosa: {len(overdue)} pagos vencidos | Total: ${total_overdue:,.0f}\n"
        f"🔴 Crítico (>90d): {len(red)} | 🟠 Alto (60-90d): {len(orange)} | 🟡 Moderado (30-60d): {len(yellow)}"
    )
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "💰 Alerta cartera morosa", summary_msg, "warning", "AUTO-08", club_id=club_id)
        actions += 1

    log_activity("AUTO-08", "AG-07", "success",
                 records_found=len(overdue), actions_taken=actions,
                 summary=summary_msg, club_id=club_id)
    return {"records_found": len(overdue), "actions_taken": actions}


# ── AUTO-09: Cierre de caja diario ─────────────────────────────────────────

@celery_app.task(name="tasks.finance.daily_cash_close_dispatch")
def daily_cash_close_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        daily_cash_close.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.finance.daily_cash_close")
def daily_cash_close(club_id: str) -> dict:
    """22:00 diario — resume ingresos y egresos del día para el club."""
    cfg = get_automation_config("AUTO-09", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    db = get_supabase()
    today = date.today().isoformat()

    transactions = (
        db.table("financial_transactions")
        .select("amount, transaction_type, payment_status")
        .eq("club_id", club_id)
        .gte("transaction_date", today)
        .lte("transaction_date", today)
        .execute()
    ).data or []

    income = sum(
        tx["amount"] for tx in transactions
        if tx.get("payment_status") == "paid"
        and tx.get("transaction_type") not in ("expense",)
    )
    expense = sum(
        tx["amount"] for tx in transactions
        if tx.get("transaction_type") == "expense"
    )
    net = income - expense

    # Training attendance stats — filter by today's sessions first to avoid full-table scan
    today_sessions = (
        db.table("training_sessions")
        .select("id")
        .eq("club_id", club_id)
        .gte("scheduled_at", f"{today}T00:00:00")
        .lte("scheduled_at", f"{today}T23:59:59")
        .execute()
    ).data or []
    today_session_ids = [s["id"] for s in today_sessions]

    if today_session_ids:
        attendances = (
            db.table("training_attendance")
            .select("attended, training_session_id")
            .in_("training_session_id", today_session_ids)
            .execute()
        ).data or []
    else:
        attendances = []

    sessions_count = len({a.get("training_session_id") for a in attendances if a.get("training_session_id")})
    attended = sum(1 for a in attendances if a.get("attended"))
    total_expected = len(attendances)
    att_rate = round((attended / total_expected * 100), 1) if total_expected else 0

    # Store daily report. daily_reports.club_id + UNIQUE(club_id, report_date)
    # desde la Fase 1c del plan multi-tenant.
    db.table("daily_reports").upsert({
        "report_date": today,
        "report_type": "combined",
        "total_income": income,
        "total_expense": expense,
        "sessions_held": sessions_count,
        "attendance_rate": att_rate,
        "summary_json": {
            "transactions": len(transactions),
            "income": income,
            "expense": expense,
            "net": net,
        },
        "club_id": club_id,
    }, on_conflict="club_id,report_date").execute()

    msg = (
        f"📊 Cierre de caja {today}\n"
        f"Ingresos: ${income:,.0f} | Egresos: ${expense:,.0f} | Neto: ${net:,.0f}\n"
        f"Sesiones: {sessions_count} | Asistencia: {att_rate}%"
    )
    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "📊 Cierre de caja", msg, "info", "AUTO-09", club_id=club_id)
        actions += 1

    log_activity("AUTO-09", "AG-07", "success",
                 records_found=len(transactions), actions_taken=actions,
                 summary=msg, club_id=club_id)
    return {"records_found": len(transactions), "actions_taken": actions}


# ── AUTO-10: Proyección financiera mensual ──────────────────────────────────

@celery_app.task(name="tasks.finance.monthly_financial_projection_dispatch")
def monthly_financial_projection_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        monthly_financial_projection.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.finance.monthly_financial_projection")
def monthly_financial_projection(club_id: str) -> dict:
    """Último día del mes 18:00 — proyección de flujo de caja 3 meses del club."""
    cfg = get_automation_config("AUTO-10", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    import calendar as _calendar
    today = date.today()
    last_day = _calendar.monthrange(today.year, today.month)[1]
    if today.day != last_day:
        return {"skipped": "not last day of month"}

    db = get_supabase()
    # Last 3 months of data
    three_months_ago = (today - timedelta(days=90)).isoformat()

    transactions = (
        db.table("financial_transactions")
        .select("amount, transaction_type, payment_status, transaction_date")
        .eq("club_id", club_id)
        .gte("transaction_date", three_months_ago)
        .lte("transaction_date", today.isoformat())
        .execute()
    ).data or []

    monthly: dict[str, dict] = {}
    for tx in transactions:
        month = tx["transaction_date"][:7]
        if month not in monthly:
            monthly[month] = {"income": 0.0, "expense": 0.0}
        if tx.get("payment_status") == "paid":
            monthly[month]["income"] += float(tx.get("amount", 0))
        if tx.get("transaction_type") == "expense":
            monthly[month]["expense"] += float(tx.get("amount", 0))

    if not monthly:
        log_activity("AUTO-10", "AG-07", "skipped", summary="Sin datos de transacciones", club_id=club_id)
        return {"records_found": 0, "actions_taken": 0}

    avg_income = sum(m["income"] for m in monthly.values()) / len(monthly)
    avg_expense = sum(m["expense"] for m in monthly.values()) / len(monthly)
    avg_net = avg_income - avg_expense

    risk = "🔴 Alto" if avg_net < 0 else ("🟡 Moderado" if avg_net < avg_income * 0.1 else "🟢 Bajo")

    msg = (
        f"📈 Proyección financiera — {today.strftime('%B %Y')}\n"
        f"Promedio mensual: Ingresos ${avg_income:,.0f} | Egresos ${avg_expense:,.0f} | Neto ${avg_net:,.0f}\n"
        f"Riesgo de liquidez: {risk}\n"
        f"Proyección próximos 3 meses: ${avg_net * 3:,.0f} neto acumulado"
    )
    actions = 0
    for uid in get_admin_user_ids(club_id):
        notify_user(uid, "📈 Proyección financiera mensual", msg, "info", "AUTO-10", club_id=club_id)
        actions += 1

    log_activity("AUTO-10", "AG-07", "success",
                 records_found=len(transactions), actions_taken=actions,
                 summary=msg, club_id=club_id)
    return {"records_found": len(transactions), "actions_taken": actions}


# ── AUTO-11: Recordatorio de renovación de membresía ───────────────────────

@celery_app.task(name="tasks.finance.membership_renewal_reminder_dispatch")
def membership_renewal_reminder_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        membership_renewal_reminder.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.finance.membership_renewal_reminder")
def membership_renewal_reminder(club_id: str) -> dict:
    """Diario — avisa 30/15/7/1 días antes del vencimiento de membresía en el club."""
    cfg = get_automation_config("AUTO-11", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    p = cfg["custom_params"]
    db = get_supabase()
    today = date.today()
    expiry_days = int(p.get("days_before_expiry", 30))
    urgent_days = int(p.get("days_urgent", 7))
    reminder_days = sorted({expiry_days, expiry_days // 2, urgent_days, 1}, reverse=True)

    actions = 0
    total_found = 0

    for days in reminder_days:
        target_date = (today + timedelta(days=days)).isoformat()
        athletes = (
            db.table("athletes")
            .select("id, first_name, last_name, email, user_id, membership_expires_at")
            .eq("club_id", club_id)
            .eq("membership_expires_at", target_date)
            .eq("status", "active")
            .execute()
        ).data or []

        for athlete in athletes:
            total_found += 1
            name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
            expires = athlete.get("membership_expires_at", target_date)

            urgency = "🚨" if days <= 7 else ("⚠️" if days <= 15 else "📅")
            msg = (
                f"Hola {name}, tu membresía vence el {expires} "
                f"(en {days} días). Renueva a tiempo para continuar entrenando. {urgency}"
            )

            if athlete.get("user_id"):
                notify_user(
                    athlete["user_id"],
                    f"{urgency} Membresía vence en {days} días",
                    msg,
                    "warning" if days <= 15 else "info",
                    "AUTO-11",
                    club_id=club_id,
                )
                actions += 1

            if athlete.get("email"):
                send_email(
                    athlete["email"],
                    f"Renueva tu membresía — vence en {days} días",
                    msg,
                )
                actions += 1

    log_activity("AUTO-11", "AG-07", "success" if total_found else "skipped",
                 records_found=total_found, actions_taken=actions,
                 summary=f"{total_found} membresías próximas a vencer", club_id=club_id)
    return {"records_found": total_found, "actions_taken": actions}
