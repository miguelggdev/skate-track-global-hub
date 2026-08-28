"""
Webhook endpoints for event-driven Celery automations.

Supabase Database Webhooks → POST here → Celery task.delay()

Each endpoint:
- Validates X-Webhook-Secret header against settings.webhook_secret
- Reads the Supabase webhook payload (type, table, record)
- Dispatches the corresponding Celery task

Configure in Supabase Dashboard → Database → Webhooks:
  Table              Event         URL
  training_attendance INSERT/UPDATE https://stride.arkanatech.tech/api/webhooks/attendance-change
  financial_transactions INSERT     https://stride.arkanatech.tech/api/webhooks/payment-received
  competition_results  INSERT      https://stride.arkanatech.tech/api/webhooks/competition-result
  medical_sessions     INSERT      https://stride.arkanatech.tech/api/webhooks/medical-session
  athletes             INSERT      https://stride.arkanatech.tech/api/webhooks/new-athlete

Custom header: X-Webhook-Secret: <WEBHOOK_SECRET from .env>

Aparte, /telegram-bot es el webhook del Bot de Telegram (no de Supabase) —
ver comentario en esa ruta más abajo.
"""
from __future__ import annotations

import hmac
import logging

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


class SupabaseWebhookPayload(BaseModel):
    type: str  # INSERT | UPDATE | DELETE
    table: str
    schema: str = "public"
    record: dict = {}
    old_record: dict | None = None


def _verify(secret: str | None) -> None:
    if not settings.webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured on server")
    if not secret or not hmac.compare_digest(secret, settings.webhook_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook secret")


# ── AUTO-04: Ausencia detectada en entrenamiento ──────────────────────────────

@router.post("/attendance-change")
async def webhook_attendance_change(
    payload: SupabaseWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict:
    """
    Triggered by: training_attendance INSERT or UPDATE.
    Dispatches handle_absence when attended=false.
    """
    _verify(x_webhook_secret)
    record = payload.record
    if payload.type in ("INSERT", "UPDATE") and not record.get("attended", True):
        athlete_id = record.get("athlete_id")
        session_id = record.get("training_session_id")
        if athlete_id and session_id:
            from tasks.calendar_tasks import handle_absence
            handle_absence.delay(athlete_id, session_id)
            logger.info("AUTO-04 queued: athlete=%s session=%s", athlete_id, session_id)
    return {"queued": True}


# ── AUTO-07: Recibo automático de pago ───────────────────────────────────────

@router.post("/payment-received")
async def webhook_payment_received(
    payload: SupabaseWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict:
    """
    Triggered by: financial_transactions INSERT where payment_status='paid'.
    Dispatches generate_payment_receipt.
    """
    _verify(x_webhook_secret)
    record = payload.record
    if payload.type == "INSERT" and record.get("payment_status") == "paid":
        transaction_id = record.get("id")
        if transaction_id:
            from tasks.finance_tasks import generate_payment_receipt
            generate_payment_receipt.delay(transaction_id)
            logger.info("AUTO-07 queued: transaction=%s", transaction_id)
    return {"queued": True}


# ── AUTO-12 + AUTO-24: Post-competencia y solicitud de testimonio ─────────────

@router.post("/competition-result")
async def webhook_competition_result(
    payload: SupabaseWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict:
    """
    Triggered by: competition_results INSERT.
    Dispatches post_competition_followup immediately.
    If position <= 3, also schedules request_testimonial 24 h later (AUTO-24).
    """
    _verify(x_webhook_secret)
    record = payload.record
    if payload.type == "INSERT":
        result_id = record.get("id")
        if result_id:
            from tasks.athlete_tasks import post_competition_followup
            post_competition_followup.delay(result_id)
            logger.info("AUTO-12 queued: result=%s", result_id)

            position = record.get("position") or record.get("final_position")
            if position and int(position) <= 3:
                from tasks.marketing_tasks import request_testimonial
                request_testimonial.apply_async(args=[result_id], countdown=86400)
                logger.info("AUTO-24 scheduled 24h: result=%s", result_id)
    return {"queued": True}


# ── AUTO-14: Protocolo de lesión ──────────────────────────────────────────────

@router.post("/medical-session")
async def webhook_medical_session(
    payload: SupabaseWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict:
    """
    Triggered by: medical_sessions INSERT.
    Dispatches injury_protocol when session_type indicates injury.
    """
    _verify(x_webhook_secret)
    record = payload.record
    if payload.type == "INSERT":
        session_type = record.get("session_type", "")
        if "lesion" in session_type.lower() or "injury" in session_type.lower():
            session_id = record.get("id")
            if session_id:
                from tasks.athlete_tasks import injury_protocol
                injury_protocol.delay(session_id)
                logger.info("AUTO-14 queued: medical_session=%s", session_id)
    return {"queued": True}


# ── AUTO-20: Documentos para nuevo atleta ────────────────────────────────────

@router.post("/new-athlete")
async def webhook_new_athlete(
    payload: SupabaseWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict:
    """
    Triggered by: athletes INSERT.
    Dispatches new_athlete_documents.
    """
    _verify(x_webhook_secret)
    if payload.type == "INSERT":
        athlete_id = payload.record.get("id")
        if athlete_id:
            from tasks.admin_tasks import new_athlete_documents
            new_athlete_documents.delay(athlete_id)
            logger.info("AUTO-20 queued: athlete=%s", athlete_id)
    return {"queued": True}


# ── AUTO-30: Acceso sospechoso ────────────────────────────────────────────────

@router.post("/suspicious-access")
async def webhook_suspicious_access(
    payload: SupabaseWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict:
    """
    Triggered by: audit_log INSERT with event_type='login_failed' or similar.
    Also callable manually from Supabase Auth hooks.
    Expected record fields: user_id, ip_address, success (bool).
    """
    _verify(x_webhook_secret)
    record = payload.record
    user_id = record.get("user_id") or record.get("performed_by")
    ip_address = record.get("ip_address", "unknown")
    success = record.get("success", False)
    if user_id:
        from tasks.security_tasks import check_suspicious_access
        check_suspicious_access.delay(user_id, ip_address, success)
        logger.info("AUTO-30 queued: user=%s ip=%s success=%s", user_id, ip_address, success)
    return {"queued": True}


# ── Bot de Telegram: responde con el chat_id a quien le escriba ────────────
# No usa X-Webhook-Secret (ese header es para Supabase) — Telegram no lo
# manda. Se protege con un secret propio en la URL (?secret=), configurado
# al registrar el webhook con setWebhook.

@router.post("/telegram-bot")
async def webhook_telegram_bot(payload: dict, secret: str | None = None) -> dict:
    """Registrar con: https://api.telegram.org/bot<TOKEN>/setWebhook?
    url=https://stride.arkanatech.tech/api/webhooks/telegram-bot?secret=<TELEGRAM_WEBHOOK_SECRET>
    """
    if not settings.telegram_webhook_secret or secret != settings.telegram_webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid secret")

    message = payload.get("message") or payload.get("edited_message")
    if not message:
        return {"ok": True}

    chat_id = message.get("chat", {}).get("id")
    if chat_id is None:
        return {"ok": True}

    from services.telegram_service import send_telegram_message
    send_telegram_message(
        str(chat_id),
        f"Tu Chat ID es:\n<code>{chat_id}</code>\n\n"
        "Pegalo en la configuración de notificaciones de SpeedSkateTrack Hub "
        "(club → Configurar Club → Notificaciones, o panel de Superadmin).",
    )
    return {"ok": True}
