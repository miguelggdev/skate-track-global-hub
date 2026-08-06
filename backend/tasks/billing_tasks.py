"""
Billing automation tasks — Monthly invoice generation and reminders.

AUTO-36: generate_monthly_fees   — 1st of each month at 07:00
AUTO-37: send_invoice_reminder   — daily at 09:00
"""
from __future__ import annotations

import logging
from calendar import monthrange
from datetime import date, datetime, timedelta

from celery import shared_task
from supabase import create_client

from config import settings
from tasks.helpers import notify_user, render_email_template, send_email

logger = logging.getLogger(__name__)

MONTH_NAMES_ES: dict[int, str] = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
}

PAYMENT_INSTRUCTIONS = (
    "Banco: Bancolombia\n"
    "Cuenta de ahorros: 000-000000-00\n"
    "A nombre de: Club de Patinaje de Velocidad\n"
    "Referencia: [Nombre del atleta + mes]"
)


def _supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


# ── AUTO-36: Generación de cuotas mensuales ────────────────────────────────


@shared_task(name="tasks.billing.generate_monthly_fees", bind=True, max_retries=3)
def generate_monthly_fees(self, year: int = None, month: int = None) -> dict:
    """
    AUTO-36: Run on the 1st of each month at 07:00.

    Creates one invoice + one financial_transaction (pending) per active athlete.
    Skips athletes who already have an invoice for this period.
    Sends a billing email to each athlete that has an email address.
    """
    today = date.today()
    year = year or today.year
    month = month or today.month
    month_name = MONTH_NAMES_ES[month]
    due_date = date(year, month, 5)  # Due on the 5th of the month

    db = _supabase()

    # Get default monthly fee from system_settings
    settings_row = db.table("system_settings").select("monthly_fee").single().execute()
    default_fee = float((settings_row.data or {}).get("monthly_fee", 80000))

    # Get all active athletes with email
    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, email, category, monthly_fee, user_id")
        .eq("status", "active")
        .execute()
    ).data or []

    created = 0
    skipped = 0
    errors = 0

    for athlete in athletes:
        athlete_id = athlete["id"]
        athlete_name = f"{athlete['first_name']} {athlete.get('last_name', '')}".strip()
        athlete_email = athlete.get("email") or ""
        fee = float(athlete.get("monthly_fee") or default_fee)

        # Skip if an invoice already exists for this period
        existing = (
            db.table("invoices")
            .select("id")
            .eq("athlete_id", athlete_id)
            .eq("period_year", year)
            .eq("period_month", month)
            .execute()
        ).data

        if existing:
            skipped += 1
            continue

        try:
            # Create financial_transaction (pending)
            tx_result = db.table("financial_transactions").insert({
                "athlete_id": athlete_id,
                "amount": fee,
                "transaction_type": "mensualidad",
                "payment_status": "pending",
                "transaction_date": date(year, month, 1).isoformat(),
                "due_date": due_date.isoformat(),
                "description": f"Cuota mensual {month_name} {year}",
                "category": "membership",
            }).execute()

            tx_id = tx_result.data[0]["id"] if tx_result.data else None

            # Create invoice linked to the transaction
            invoice_result = db.table("invoices").insert({
                "athlete_id": athlete_id,
                "period_year": year,
                "period_month": month,
                "amount": fee,
                "status": "sent",
                "concept": f"Cuota mensual de membresía — {month_name} {year}",
                "due_date": due_date.isoformat(),
                "transaction_id": tx_id,
                "sent_at": datetime.utcnow().isoformat(),
            }).execute()

            invoice = invoice_result.data[0] if invoice_result.data else {}

            # Send invoice email
            if athlete_email:
                html = render_email_template("invoice_email.html", {
                    "athlete_name": athlete_name,
                    "invoice_number": invoice.get("invoice_number", ""),
                    "concept": "Cuota mensual de membresía",
                    "month_name": month_name,
                    "year": year,
                    "due_date": due_date.strftime("%d/%m/%Y"),
                    "amount": f"{fee:,.0f}",
                    "payment_instructions": PAYMENT_INSTRUCTIONS,
                    "to_email": athlete_email,
                })
                send_email(
                    to=athlete_email,
                    subject=f"Factura membresía {month_name} {year} — SpeedSkateTrack",
                    html_body=html,
                )

            # In-app notification
            if athlete.get("user_id"):
                notify_user(
                    user_id=athlete["user_id"],
                    title="Factura de membresía",
                    message=(
                        f"Factura de {month_name}: ${fee:,.0f} — "
                        f"Vence el {due_date.strftime('%d/%m')}"
                    ),
                    notification_type="info",
                    automation_id="AUTO-36",
                )

            created += 1

        except Exception as exc:
            logger.error("Error creating invoice for athlete %s: %s", athlete_id, exc)
            errors += 1

    # Log to agent_activity_log
    summary = (
        f"Facturas {month_name} {year}: {created} creadas, "
        f"{skipped} ya existían, {errors} errores"
    )
    try:
        db.table("agent_activity_log").insert({
            "agent_id": "AUTO-36",
            "action": "generate_monthly_fees",
            "result": summary,
            "metadata": {
                "year": year,
                "month": month,
                "created": created,
                "skipped": skipped,
                "errors": errors,
            },
        }).execute()
    except Exception as exc:
        logger.warning("Failed to write agent_activity_log: %s", exc)

    logger.info(summary)
    return {"created": created, "skipped": skipped, "errors": errors}


# ── AUTO-37: Recordatorios de pago ────────────────────────────────────────


@shared_task(name="tasks.billing.send_invoice_reminder", bind=True, max_retries=3)
def send_invoice_reminder(self) -> dict:
    """
    AUTO-37: Run daily at 09:00.

    Sends payment reminders for:
    - Invoices due in exactly 5 days (pre-due gentle reminder).
    - Overdue invoices, repeating every 7 days after the due date
      (1st, 8th, 15th, 22nd overdue day, etc.).
    """
    db = _supabase()
    today = date.today()
    reminder_date = today + timedelta(days=5)
    sent = 0

    # ── Pre-due reminder (5 days before due date) ──────────────────────────
    invoices_due_soon = (
        db.table("invoices")
        .select(
            "id, invoice_number, athlete_id, amount, period_year, period_month, due_date, "
            "athletes(first_name, last_name, email, user_id)"
        )
        .eq("status", "sent")
        .eq("due_date", reminder_date.isoformat())
        .execute()
    ).data or []

    for inv in invoices_due_soon:
        athlete = inv.get("athletes") or {}
        athlete_email = athlete.get("email") or ""
        athlete_name = (
            f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
        )
        month_name = MONTH_NAMES_ES.get(inv["period_month"], "")

        if athlete_email:
            html = render_email_template("payment_reminder_email.html", {
                "athlete_name": athlete_name,
                "invoice_number": inv.get("invoice_number", ""),
                "month_name": month_name,
                "year": inv["period_year"],
                "amount": f"{float(inv['amount']):,.0f}",
                "days_overdue": 0,
                "payment_instructions": PAYMENT_INSTRUCTIONS,
                "to_email": athlete_email,
            })
            send_email(
                to=athlete_email,
                subject=f"Tu cuota de {month_name} vence en 5 días — SpeedSkateTrack",
                html_body=html,
            )
            sent += 1

        if athlete.get("user_id"):
            notify_user(
                user_id=athlete["user_id"],
                title="Recordatorio de pago",
                message=f"Tu cuota de {month_name} vence en 5 días.",
                notification_type="warning",
                automation_id="AUTO-37",
            )

    # ── Overdue reminders ──────────────────────────────────────────────────
    overdue_invoices = (
        db.table("invoices")
        .select(
            "id, invoice_number, athlete_id, amount, period_year, period_month, "
            "due_date, transaction_id, "
            "athletes(first_name, last_name, email, user_id)"
        )
        .eq("status", "sent")
        .lt("due_date", today.isoformat())
        .execute()
    ).data or []

    for inv in overdue_invoices:
        athlete = inv.get("athletes") or {}
        athlete_email = athlete.get("email") or ""
        athlete_name = (
            f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
        )
        due = date.fromisoformat(inv["due_date"])
        days_overdue = (today - due).days
        month_name = MONTH_NAMES_ES.get(inv["period_month"], "")

        # Mark the underlying transaction as overdue regardless of email
        try:
            db.table("financial_transactions").update(
                {"payment_status": "overdue"}
            ).eq("id", inv["transaction_id"]).execute() if inv.get("transaction_id") else None
        except Exception as exc:
            logger.warning("Could not update transaction status for invoice %s: %s", inv["id"], exc)

        # Only send email every 7 days after due date (days 1, 8, 15, 22 …)
        if days_overdue % 7 != 1:
            continue

        if athlete_email:
            html = render_email_template("payment_reminder_email.html", {
                "athlete_name": athlete_name,
                "invoice_number": inv.get("invoice_number", ""),
                "month_name": month_name,
                "year": inv["period_year"],
                "amount": f"{float(inv['amount']):,.0f}",
                "days_overdue": days_overdue,
                "payment_instructions": PAYMENT_INSTRUCTIONS,
                "to_email": athlete_email,
            })
            send_email(
                to=athlete_email,
                subject=(
                    f"Pago vencido {days_overdue} días — "
                    f"{month_name} {inv['period_year']} — SpeedSkateTrack"
                ),
                html_body=html,
            )
            sent += 1

        if athlete.get("user_id"):
            notify_user(
                user_id=athlete["user_id"],
                title="Pago vencido",
                message=(
                    f"Tu pago de {month_name} lleva {days_overdue} días vencido. "
                    "Por favor regulariza tu situación."
                ),
                notification_type="error",
                automation_id="AUTO-37",
            )

    logger.info("AUTO-37 send_invoice_reminder: %d reminder emails sent", sent)
    return {"sent": sent}
