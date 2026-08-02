"""AUTO-07 to AUTO-11: Automatizaciones de Facturación y Finanzas."""
from __future__ import annotations

import logging
from datetime import date, timedelta

from database.supabase_client import get_supabase
from tasks.celery_app import celery_app
from tasks.helpers import (
    get_admin_user_ids,
    log_activity,
    notify_user,
    send_email_placeholder,
)

logger = logging.getLogger(__name__)


# ── AUTO-07: Recibo automático de pago ─────────────────────────────────────
@celery_app.task(name="tasks.finance.generate_payment_receipt")
def generate_payment_receipt(transaction_id: str) -> dict:
    """Triggered on new income transaction — notifies payer and logs receipt."""
    db = get_supabase()

    tx = (
        db.table("financial_transactions")
        .select("id, amount, transaction_type, description, athlete_id, transaction_date")
        .eq("id", transaction_id)
        .maybeSingle()
        .execute()
    ).data

    if not tx:
        log_activity("AUTO-07", "AG-07", "skipped", summary="Transacción no encontrada")
        return {"records_found": 0, "actions_taken": 0}

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
                    athlete["user_id"], "✅ Pago registrado", msg, "success", "AUTO-07"
                )
                actions += 1
            if athlete.get("email"):
                send_email_placeholder(
                    athlete["email"],
                    "Recibo de pago — Club Patinaje",
                    msg,
                    "AUTO-07",
                )
                actions += 1

    log_activity("AUTO-07", "AG-07", "success",
                 records_found=1, actions_taken=actions,
                 summary=f"Recibo generado: ${amount:,.0f} - {description}")
    return {"records_found": 1, "actions_taken": actions}


# ── AUTO-08: Alertas de cartera morosa ─────────────────────────────────────
@celery_app.task(name="tasks.finance.overdue_payment_alerts")
def overdue_payment_alerts() -> dict:
    """1ro y 15 de cada mes 09:00 — alerta sobre atletas con pagos vencidos."""
    db = get_supabase()
    today = date.today()
    thirty_days_ago = (today - timedelta(days=30)).isoformat()
    sixty_days_ago = (today - timedelta(days=60)).isoformat()
    ninety_days_ago = (today - timedelta(days=90)).isoformat()

    overdue = (
        db.table("financial_transactions")
        .select("id, athlete_id, amount, transaction_date, payment_status, athletes(first_name, last_name, email, user_id)")
        .eq("payment_status", "pending")
        .lte("transaction_date", thirty_days_ago)
        .execute()
    ).data or []

    if not overdue:
        log_activity("AUTO-08", "AG-07", "skipped", summary="Sin morosos")
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
            )
            actions += 1

    # Summary to admin
    summary_msg = (
        f"Cartera morosa: {len(overdue)} pagos vencidos | Total: ${total_overdue:,.0f}\n"
        f"🔴 Crítico (>90d): {len(red)} | 🟠 Alto (60-90d): {len(orange)} | 🟡 Moderado (30-60d): {len(yellow)}"
    )
    for uid in get_admin_user_ids():
        notify_user(uid, "💰 Alerta cartera morosa", summary_msg, "warning", "AUTO-08")
        actions += 1

    log_activity("AUTO-08", "AG-07", "success",
                 records_found=len(overdue), actions_taken=actions,
                 summary=summary_msg)
    return {"records_found": len(overdue), "actions_taken": actions}


# ── AUTO-09: Cierre de caja diario ─────────────────────────────────────────
@celery_app.task(name="tasks.finance.daily_cash_close")
def daily_cash_close() -> dict:
    """22:00 diario — resume ingresos y egresos del día."""
    db = get_supabase()
    today = date.today().isoformat()

    transactions = (
        db.table("financial_transactions")
        .select("amount, transaction_type, payment_status")
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

    # Training attendance stats
    attendances = (
        db.table("training_attendance")
        .select("attended, training_sessions!inner(scheduled_at)")
        .execute()
    ).data or []

    today_attendances = [
        a for a in attendances
        if (a.get("training_sessions") or {}).get("scheduled_at", "").startswith(today)
    ]
    sessions_count = len({
        (a.get("training_sessions") or {}).get("scheduled_at", "")[:10]
        for a in today_attendances
    })
    attended = sum(1 for a in today_attendances if a.get("attended"))
    total_expected = len(today_attendances)
    att_rate = round((attended / total_expected * 100), 1) if total_expected else 0

    # Store daily report
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
    }, on_conflict="report_date").execute()

    msg = (
        f"📊 Cierre de caja {today}\n"
        f"Ingresos: ${income:,.0f} | Egresos: ${expense:,.0f} | Neto: ${net:,.0f}\n"
        f"Sesiones: {sessions_count} | Asistencia: {att_rate}%"
    )
    actions = 0
    for uid in get_admin_user_ids():
        notify_user(uid, "📊 Cierre de caja", msg, "info", "AUTO-09")
        actions += 1

    log_activity("AUTO-09", "AG-07", "success",
                 records_found=len(transactions), actions_taken=actions,
                 summary=msg)
    return {"records_found": len(transactions), "actions_taken": actions}


# ── AUTO-10: Proyección financiera mensual ──────────────────────────────────
@celery_app.task(name="tasks.finance.monthly_financial_projection")
def monthly_financial_projection() -> dict:
    """Último día del mes 18:00 — proyección de flujo de caja 3 meses."""
    db = get_supabase()
    today = date.today()
    # Last 3 months of data
    three_months_ago = (today - timedelta(days=90)).isoformat()

    transactions = (
        db.table("financial_transactions")
        .select("amount, transaction_type, payment_status, transaction_date")
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
        log_activity("AUTO-10", "AG-07", "skipped", summary="Sin datos de transacciones")
        return {"records_found": 0, "actions_taken": 0}

    months_sorted = sorted(monthly.keys())
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
    for uid in get_admin_user_ids():
        notify_user(uid, "📈 Proyección financiera mensual", msg, "info", "AUTO-10")
        actions += 1

    log_activity("AUTO-10", "AG-07", "success",
                 records_found=len(transactions), actions_taken=actions,
                 summary=msg)
    return {"records_found": len(transactions), "actions_taken": actions}


# ── AUTO-11: Recordatorio de renovación de membresía ───────────────────────
@celery_app.task(name="tasks.finance.membership_renewal_reminder")
def membership_renewal_reminder() -> dict:
    """Diario — avisa 30/15/7/1 días antes del vencimiento de membresía."""
    db = get_supabase()
    today = date.today()
    reminder_days = [30, 15, 7, 1]

    actions = 0
    total_found = 0

    for days in reminder_days:
        target_date = (today + timedelta(days=days)).isoformat()
        athletes = (
            db.table("athletes")
            .select("id, first_name, last_name, email, user_id, membership_expires_at")
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
                )
                actions += 1

            if athlete.get("email"):
                send_email_placeholder(
                    athlete["email"],
                    f"Renueva tu membresía — vence en {days} días",
                    msg,
                    "AUTO-11",
                )
                actions += 1

    log_activity("AUTO-11", "AG-07", "success" if total_found else "skipped",
                 records_found=total_found, actions_taken=actions,
                 summary=f"{total_found} membresías próximas a vencer")
    return {"records_found": total_found, "actions_taken": actions}
