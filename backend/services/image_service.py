"""Image selection for WhatsApp motivational messages.

Strategy (in order):
1. Pick a random image from Supabase Storage bucket 'whatsapp-motivational'
   (admin uploads sports photos here via the admin panel).
2. If the bucket is empty or unavailable, generate one with DALL-E 3
   and store it in the same bucket for future reuse.
3. If DALL-E fails or OPENAI_API_KEY is not set, return None
   (the task will send a text-only message).
"""
from __future__ import annotations

import logging
import os
import random
import time

import httpx

logger = logging.getLogger(__name__)

_OPENAI_KEY     = os.getenv("OPENAI_API_KEY", "")
_OPENAI_IMAGES  = "https://api.openai.com/v1/images/generations"

# DALL-E 3 prompt per category — no text in the image, always sports-themed.
_CATEGORY_PROMPTS: dict[str, str] = {
    "motivacion": (
        "Dynamic speed skater in full sprint, motion blur, vibrant orange and blue "
        "colors, professional sports photography, dramatic lighting, no text or words"
    ),
    "disciplina": (
        "Speed skating athlete training alone on an indoor rink at dawn, "
        "focused and determined, cinematic lighting, no text"
    ),
    "equipo": (
        "Group of speed skaters celebrating a victory together, colorful uniforms, "
        "team spirit, wide angle, no text"
    ),
    "tecnica": (
        "Close-up of speed skater in perfect aerodynamic position on ice, "
        "technical precision, shallow depth of field, no text"
    ),
    "vida": (
        "Sunrise over a speed skating stadium, inspirational landscape, "
        "warm golden colors, peaceful atmosphere, no text"
    ),
}


def get_motivational_image(supabase_client, category: str = "motivacion") -> tuple[str | None, str]:
    """Return (public_url, source) where source is 'storage', 'ai_generated', or 'none'."""
    url = _from_storage(supabase_client)
    if url:
        return url, "storage"

    url = _generate_with_dalle(supabase_client, category)
    if url:
        return url, "ai_generated"

    return None, "none"


# ── Private helpers ──────────────────────────────────────────────────────────

def _from_storage(supabase_client) -> str | None:
    """Pick a random image from the 'whatsapp-motivational' bucket."""
    try:
        bucket = "whatsapp-motivational"
        files = supabase_client.storage.from_(bucket).list()
        images = [
            f["name"] for f in (files or [])
            if f.get("name", "").lower().rsplit(".", 1)[-1] in {"jpg", "jpeg", "png", "webp"}
        ]
        if not images:
            return None
        chosen = random.choice(images)
        return supabase_client.storage.from_(bucket).get_public_url(chosen)
    except Exception as exc:
        logger.warning("Storage image fetch failed: %s", exc)
        return None


def _generate_with_dalle(supabase_client, category: str) -> str | None:
    """Generate an image with DALL-E 3 and store it in Storage for reuse."""
    if not _OPENAI_KEY:
        logger.info("OPENAI_API_KEY not set — skipping DALL-E image generation")
        return None

    prompt = _CATEGORY_PROMPTS.get(category, _CATEGORY_PROMPTS["motivacion"])
    try:
        # 1. Request image from DALL-E 3
        resp = httpx.post(
            _OPENAI_IMAGES,
            headers={
                "Authorization": f"Bearer {_OPENAI_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model":   "dall-e-3",
                "prompt":  prompt,
                "size":    "1024x1024",
                "quality": "standard",
                "n":       1,
            },
            timeout=60.0,
        )
        resp.raise_for_status()
        image_url = resp.json()["data"][0]["url"]

        # 2. Download the generated image
        img_resp = httpx.get(image_url, timeout=30.0)
        img_resp.raise_for_status()

        # 3. Upload to Supabase Storage for reuse (avoids repeated API calls)
        filename  = f"ai_{category}_{int(time.time())}.png"
        bucket    = "whatsapp-motivational"
        supabase_client.storage.from_(bucket).upload(
            filename,
            img_resp.content,
            {"content-type": "image/png"},
        )
        public_url = supabase_client.storage.from_(bucket).get_public_url(filename)
        logger.info("DALL-E image generated and stored: %s", filename)
        return public_url

    except Exception as exc:
        logger.error("DALL-E image generation failed: %s", exc)
        return None
