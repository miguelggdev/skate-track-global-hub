"""AUTO-36: Envío diario de frase motivadora por WhatsApp.

Multi-tenant (Fase 5 + 6): programada, usa el patrón dispatch — `_dispatch`
(Beat) abanica una corrida por club activo, cada una con sus propios
suscriptores y el nombre de SU club en el mensaje.

Flujo (por club):
1. Obtiene la frase menos usada (FIFO por last_used_at, nulos primero) —
   motivational_phrases es un catálogo global (Grupo B), compartido por
   todos los clubes a propósito.
2. Obtiene imagen: Storage bucket → DALL-E 3 → sin imagen (texto solo).
3. Formatea el mensaje con emojis según la categoría y el nombre del club.
4. Envía a los suscriptores activos DEL CLUB.
5. Actualiza used_count / last_used_at (global, no por club) y registra en
   whatsapp_message_log.
"""
from __future__ import annotations

import logging
import os
from datetime import date

from database.supabase_client import get_supabase
from services.image_service import get_motivational_image
from services.twilio_service import send_whatsapp_bulk
from tasks.celery_app import celery_app
from tasks.helpers import get_active_club_ids, get_automation_config, log_activity

logger = logging.getLogger(__name__)

# Emoji de apertura por categoría
_CATEGORY_EMOJI: dict[str, str] = {
    "motivacion": "🏆",
    "disciplina": "🎯",
    "equipo":     "🤝",
    "tecnica":    "⚡",
    "vida":       "🌟",
}


def _build_message(phrase: str, author: str | None, category: str, club_name: str) -> str:
    emoji = _CATEGORY_EMOJI.get(category, "💪")
    today = date.today().strftime("%d/%m/%Y")
    author_line = f"\n\n— _{author}_" if author else ""
    return (
        f"{emoji} *FRASE DEL DÍA* {emoji}\n\n"
        f"💪 _\"{phrase}\"{author_line}_\n\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🛼 *{club_name}* | 📅 {today}"
    )


@celery_app.task(name="tasks.whatsapp.send_daily_motivational_dispatch")
def send_daily_motivational_phrase_dispatch() -> dict:
    club_ids = get_active_club_ids()
    for club_id in club_ids:
        send_daily_motivational_phrase.delay(club_id)
    return {"records_found": len(club_ids), "actions_taken": len(club_ids),
            "summary": f"Despachado a {len(club_ids)} club(es)"}


@celery_app.task(
    name="tasks.whatsapp.send_daily_motivational",
    max_retries=2,
    default_retry_delay=300,
)
def send_daily_motivational_phrase(club_id: str) -> dict:
    """AUTO-36 — Diario 08:30 (horario Bogotá), una corrida por club."""
    cfg = get_automation_config("AUTO-36-WA", club_id)
    if not cfg["enabled"]:
        return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
    if not os.getenv("TWILIO_ACCOUNT_SID"):
        logger.warning(
            "AUTO-36: Twilio no configurado — tarea omitida. "
            "Configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM."
        )
        return {"records_found": 0, "actions_taken": 0, "summary": "Twilio no configurado"}

    db = get_supabase()

    # ── 1. Frase menos usada (FIFO, catálogo global compartido) ────────────────
    phrase_res = (
        db.table("motivational_phrases")
        .select("id, phrase, author, category, used_count")
        .eq("active", True)
        .order("last_used_at", desc=False, nullsfirst=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    if not phrase_res.data:
        logger.warning("AUTO-36: no hay frases activas en la BD")
        return {"records_found": 0, "actions_taken": 0, "summary": "Sin frases disponibles"}

    phrase_data = phrase_res.data

    # ── 2. Suscriptores activos DEL CLUB ────────────────────────────────────────
    subs_res = (
        db.table("whatsapp_subscribers")
        .select("phone_number")
        .eq("club_id", club_id)
        .eq("active", True)
        .execute()
    )
    subscribers = [s["phone_number"] for s in (subs_res.data or [])]
    if not subscribers:
        logger.info("AUTO-36: sin suscriptores activos para el club %s", club_id)
        return {"records_found": 0, "actions_taken": 0, "summary": "Sin suscriptores"}

    # ── 3. Imagen ─────────────────────────────────────────────────────────────
    image_url, image_source = get_motivational_image(db, phrase_data.get("category", "motivacion"))

    # ── 4. Nombre del club (tabla clubs, no club_settings — deprecada) ─────────
    club_row = (
        db.table("clubs")
        .select("name")
        .eq("id", club_id)
        .maybeSingle()
        .execute()
    )
    club_name = (club_row.data or {}).get("name", "SpeedSkateTrack Hub")

    # ── 5. Envío ──────────────────────────────────────────────────────────────
    message = _build_message(
        phrase_data["phrase"],
        phrase_data.get("author"),
        phrase_data.get("category", "motivacion"),
        club_name,
    )
    sent, errors = send_whatsapp_bulk(subscribers, message, image_url)

    # ── 6. Actualizar frase usada (global — el contador es del catálogo
    # compartido, no por club) ──────────────────────────────────────────────
    db.table("motivational_phrases").update({
        "last_used_at": "now()",
        "used_count": (phrase_data.get("used_count") or 0) + 1,
    }).eq("id", phrase_data["id"]).execute()

    # ── 7. Log ────────────────────────────────────────────────────────────────
    db.table("whatsapp_message_log").insert({
        "phrase_id":        phrase_data["id"],
        "image_url":        image_url,
        "image_source":     image_source,
        "recipients_count": sent,
        "errors_count":     errors,
        "status":           "sent" if errors == 0 else ("failed" if sent == 0 else "partial"),
        "club_id":          club_id,
    }).execute()

    log_activity(
        automation_id="AUTO-36",
        agent_id="AG-13",
        status="success" if errors == 0 else "partial",
        records_found=len(subscribers),
        actions_taken=sent,
        summary=f"Frase enviada a {sent}/{len(subscribers)} suscriptores — imagen: {image_source}",
        club_id=club_id,
    )

    logger.info("AUTO-36 (club %s): %d enviados, %d errores, imagen=%s", club_id, sent, errors, image_source)
    return {
        "records_found": len(subscribers),
        "actions_taken": sent,
        "summary": f"{sent} envíos ok, {errors} errores, imagen: {image_source}",
    }
