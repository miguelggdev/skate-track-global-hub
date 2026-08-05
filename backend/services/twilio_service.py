"""WhatsApp via Twilio Messaging API (httpx — no SDK dependency)."""
from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_ACCOUNT_SID   = os.getenv("TWILIO_ACCOUNT_SID", "")
_AUTH_TOKEN    = os.getenv("TWILIO_AUTH_TOKEN", "")
_FROM_NUMBER   = os.getenv("TWILIO_WHATSAPP_FROM", "")   # e.g. +14155238886
_TWILIO_BASE   = "https://api.twilio.com/2010-04-01"


def _is_configured() -> bool:
    return bool(_ACCOUNT_SID and _AUTH_TOKEN and _FROM_NUMBER)


def _messages_url() -> str:
    return f"{_TWILIO_BASE}/Accounts/{_ACCOUNT_SID}/Messages.json"


def send_whatsapp_message(
    to: str,
    body: str,
    media_url: str | None = None,
) -> str | None:
    """Send a WhatsApp message via Twilio.

    Args:
        to:        Recipient phone number in E.164 format (+57XXXXXXXXXX).
        body:      Message text (supports WhatsApp markdown: *bold*, _italic_).
        media_url: Optional public URL of an image (jpg/png/webp ≤ 5 MB).

    Returns:
        Twilio message SID on success, None if Twilio is not configured.

    Raises:
        httpx.HTTPStatusError: If Twilio rejects the request.
    """
    if not _is_configured():
        logger.warning("Twilio not configured — message not sent to %s", to)
        return None

    payload: dict = {
        "From": f"whatsapp:{_FROM_NUMBER}",
        "To":   f"whatsapp:{to}",
        "Body": body,
    }
    if media_url:
        payload["MediaUrl"] = media_url

    resp = httpx.post(
        _messages_url(),
        data=payload,
        auth=(_ACCOUNT_SID, _AUTH_TOKEN),
        timeout=20.0,
    )
    resp.raise_for_status()
    sid = resp.json().get("sid")
    logger.info("WhatsApp sent to %s — SID=%s", to, sid)
    return sid


def send_whatsapp_bulk(
    numbers: list[str],
    body: str,
    media_url: str | None = None,
) -> tuple[int, int]:
    """Send the same message to a list of numbers.

    Returns:
        (sent_count, error_count)
    """
    sent = errors = 0
    for phone in numbers:
        try:
            result = send_whatsapp_message(phone, body, media_url)
            if result is not None:
                sent += 1
        except Exception as exc:
            logger.error("WhatsApp failed for %s: %s", phone, exc)
            errors += 1
    return sent, errors
