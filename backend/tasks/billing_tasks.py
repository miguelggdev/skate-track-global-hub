"""
Billing automation tasks — Monthly invoice generation and reminders.

AUTO-36: generate_monthly_fees   — 1st of each month at 07:00
AUTO-37: send_invoice_reminder   — daily at 09:00

Multi-tenant (Fase 5 + 6): ambas programadas usan el patrón dispatch — el
riesgo más alto del plan (mezclar facturación entre clubes), así que se
migran al final, con el patrón ya validado en 8 módulos anteriores.
"""
from __future__ import annotations

import base64
import io
import logging
from calendar import monthrange
from datetime import date, datetime, timedelta

from database.supabase_client import get_supabase
from tasks.celery_app import celery_app
from tasks.helpers import (
    get_active_club_ids,
    get_automation_config,
    log_activity,
    notify_user,
    render_email_template,
    send_email,
)

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


def _generate_invoice_pdf(
    invoice_number: str,
    athlete_name: str,
    concept: str,
    month_name: str,
    year: int,
    amount: float,
    due_date_str: str,
    payment_instructions: str,
    club_name: str = "SpeedSkateTrack Hub",
) -> bytes:
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
        )
    except ImportError:
        logger.warning("reportlab not installed — invoice sent without PDF attachment")
        return b""

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2.5 * cm, rightMargin=2.5 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    orange = colors.HexColor("#F97316")
    dark = colors.HexColor("#1F2937")
    gray = colors.HexColor("#6B7280")

    title_style = ParagraphStyle("InvTitle", parent=styles["Heading1"],
        textColor=orange, fontSize=22, spaceAfter=4)
    sub_style = ParagraphStyle("InvSub", parent=styles["Normal"],
        textColor=gray, fontSize=10)
    body_style = ParagraphStyle("InvBody", parent=styles["Normal"],
        textColor=dark, fontSize=11, leading=16)
    small_style = ParagraphStyle("InvSmall", parent=styles["Normal"],
        textColor=gray, fontSize=9, leading=13)

    story = []
    story.append(Paragraph(club_name, title_style))
    story.append(Paragraph("Sistema de gestión de patinaje de velocidad", sub_style))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=2, color=orange))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(f"<b>FACTURA</b> {invoice_number}", body_style))
    story.append(Spacer(1, 0.3 * cm))

    data = [
        ["FACTURADO A", "DETALLES DE LA FACTURA"],
        [athlete_name, f"Período: {month_name} {year}"],
        ["", f"Concepto: {concept}"],
        ["", f"Vencimiento: {due_date_str}"],
    ]
    col_w = [8.5 * cm, 9 * cm]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (1, 0), orange),
        ("TEXTCOLOR", (0, 0), (1, 0), colors.white),
        ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (1, 0), 10),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.6 * cm))

    total_data = [["", "TOTAL A PAGAR"], ["", f"$ {amount:,.0f} COP"]]
    tt = Table(total_data, colWidths=col_w)
    tt.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FFF7ED")),
        ("BACKGROUND", (1, 1), (1, 1), orange),
        ("TEXTCOLOR", (1, 1), (1, 1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (1, 1), (1, 1), 18),
        ("FONTSIZE", (1, 0), (1, 0), 9),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("GRID", (1, 0), (1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
    ]))
    story.append(tt)
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB")))
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("<b>Instrucciones de pago</b>", body_style))
    story.append(Spacer(1, 0.2 * cm))
    for line in payment_instructions.split("\n"):
        if line.strip():
            story.append(Paragraph(line.strip(), small_style))
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(
        "Documento generado automáticamente — SpeedSkateTrack Hub", small_style,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.read()


# ── AUTO-36: Generación de cuotas mensuales ────────────────────────────────

@celery_app.task(name="tasks.billing.generate_monthly_fees_dispatch")
def generate_monthly_fees_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        generate_monthly_fees.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.billing.generate_monthly_fees", bind=True, max_retries=3)
def generate_monthly_fees(self, club_id: str, year: int = None, month: int = None) -> dict:
    """
    AUTO-36: Run on the 1st of each month at 07:00 (via dispatch, por club).

    Creates one invoice + one financial_transaction (pending) per active
    athlete DEL CLUB. Skips athletes who already have an invoice for this
    period. Sends a billing email to each athlete that has an email address.
    """
    cfg = get_automation_config("AUTO-36-BIL", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    p = cfg["custom_params"]
    today = date.today()
    year = year or today.year
    month = month or today.month
    month_name = MONTH_NAMES_ES[month]
    due_day = int(p.get("due_day_of_month", 5))
    due_date = date(year, month, due_day)

    db = get_supabase()

    # Get default monthly fee from system_settings (modelo key/value:
    # setting_key='monthly_fee', setting_value=texto). Bug preexistente
    # corregido: el código anterior hacía .select("monthly_fee") — esa
    # columna nunca existió (la tabla es key/value), así que esta consulta
    # fallaba con un error de PostgREST y tumbaba la tarea completa ANTES
    # de crear ninguna factura, en cada corrida desde que existe AUTO-36.
    settings_row = (
        db.table("system_settings")
        .select("setting_value")
        .eq("club_id", club_id)
        .eq("setting_key", "monthly_fee")
        .maybeSingle()
        .execute()
    )
    raw_fee = (settings_row.data or {}).get("setting_value")
    default_fee = float(raw_fee) if raw_fee else 80000.0

    # Get all active athletes of este club con email
    athletes = (
        db.table("athletes")
        .select("id, first_name, last_name, email, category, user_id")
        .eq("club_id", club_id)
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
        # No hay columna de cuota por atleta en el schema — se usa siempre
        # el valor configurado en system_settings (o el default).
        fee = default_fee

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
                "club_id": club_id,
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
                "club_id": club_id,
            }).execute()

            invoice = invoice_result.data[0] if invoice_result.data else {}

            # Send invoice email
            if athlete_email:
                inv_number = invoice.get("invoice_number", "")
                due_str = due_date.strftime("%d/%m/%Y")
                html = render_email_template("invoice_email.html", {
                    "athlete_name": athlete_name,
                    "invoice_number": inv_number,
                    "concept": "Cuota mensual de membresía",
                    "month_name": month_name,
                    "year": year,
                    "due_date": due_str,
                    "amount": f"{fee:,.0f}",
                    "payment_instructions": PAYMENT_INSTRUCTIONS,
                    "to_email": athlete_email,
                })
                pdf_bytes = _generate_invoice_pdf(
                    invoice_number=inv_number,
                    athlete_name=athlete_name,
                    concept="Cuota mensual de membresía",
                    month_name=month_name,
                    year=year,
                    amount=fee,
                    due_date_str=due_str,
                    payment_instructions=PAYMENT_INSTRUCTIONS,
                )
                attachments = None
                if pdf_bytes:
                    attachments = [{
                        "filename": f"Factura_{inv_number}_{month_name}{year}.pdf",
                        "content": base64.b64encode(pdf_bytes).decode(),
                    }]
                send_email(
                    to=athlete_email,
                    subject=f"Factura membresía {month_name} {year} — SpeedSkateTrack",
                    html_body=html,
                    attachments=attachments,
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
                    automation_id="AUTO-36-BIL",
                    club_id=club_id,
                )

            created += 1

        except Exception as exc:
            logger.error("Error creating invoice for athlete %s: %s", athlete_id, exc)
            errors += 1

    # Log a agent_activity_log vía el helper compartido — antes este módulo
    # hacía un insert manual con columnas ("action", "result", "metadata")
    # que no existen en la tabla real (automation_id/status/records_found/
    # actions_taken/summary), envuelto en un try/except que lo silenciaba:
    # nunca quedó registro real de las corridas de AUTO-36.
    summary = (
        f"Facturas {month_name} {year}: {created} creadas, "
        f"{skipped} ya existían, {errors} errores"
    )
    log_activity(
        "AUTO-36-BIL", "AG-07",
        "error" if errors and not created else "success",
        records_found=len(athletes), actions_taken=created,
        summary=summary, club_id=club_id,
    )

    logger.info(summary)
    return {"created": created, "skipped": skipped, "errors": errors}


# ── AUTO-37: Recordatorios de pago ────────────────────────────────────────

@celery_app.task(name="tasks.billing.send_invoice_reminder_dispatch")
def send_invoice_reminder_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        send_invoice_reminder.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(name="tasks.billing.send_invoice_reminder", bind=True, max_retries=3)
def send_invoice_reminder(self, club_id: str) -> dict:
    """
    AUTO-37: Run daily at 09:00 (via dispatch, por club).

    Sends payment reminders for:
    - Invoices due in exactly 5 days (pre-due gentle reminder).
    - Overdue invoices, repeating every 7 days after the due date
      (1st, 8th, 15th, 22nd overdue day, etc.).
    """
    cfg = get_automation_config("AUTO-37", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    p = cfg["custom_params"]
    db = get_supabase()
    today = date.today()
    reminder_date = today + timedelta(days=int(p.get("pre_due_days", 5)))
    sent = 0

    # ── Pre-due reminder (5 days before due date) ──────────────────────────
    invoices_due_soon = (
        db.table("invoices")
        .select(
            "id, invoice_number, athlete_id, amount, period_year, period_month, due_date, "
            "athletes(first_name, last_name, email, user_id)"
        )
        .eq("club_id", club_id)
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
                club_id=club_id,
            )

    # ── Overdue reminders ──────────────────────────────────────────────────
    overdue_invoices = (
        db.table("invoices")
        .select(
            "id, invoice_number, athlete_id, amount, period_year, period_month, "
            "due_date, transaction_id, "
            "athletes(first_name, last_name, email, user_id)"
        )
        .eq("club_id", club_id)
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
                club_id=club_id,
            )

    logger.info("AUTO-37 send_invoice_reminder (club %s): %d reminder emails sent", club_id, sent)
    return {"sent": sent}
