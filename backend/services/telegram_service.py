"""Notificaciones vía Telegram Bot API (httpx — sin SDK)."""
from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
_API_BASE = "https://api.telegram.org"


def _is_configured() -> bool:
    return bool(_BOT_TOKEN)


def _api_url(method: str) -> str:
    return f"{_API_BASE}/bot{_BOT_TOKEN}/{method}"


def send_telegram_message(chat_id: str, text: str) -> bool:
    """Envía un mensaje de texto a un chat_id de Telegram.

    Returns:
        True si Telegram aceptó el mensaje, False si no está configurado,
        chat_id vacío, o Telegram rechazó el envío (se loguea el motivo).
    """
    if not _is_configured():
        logger.warning("Telegram no configurado (TELEGRAM_BOT_TOKEN vacío) — mensaje no enviado")
        return False
    if not chat_id:
        return False

    try:
        resp = httpx.post(
            _api_url("sendMessage"),
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10.0,
        )
        resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Telegram sendMessage falló para chat_id=%s: %s", chat_id, exc)
        return False
