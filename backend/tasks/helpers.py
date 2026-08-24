"""Shared helpers for all automation tasks."""
from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any

from jinja2 import Environment, FileSystemLoader

from config import settings
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

# ── Automation config cache ────────────────────────────────────────────────────
_CONFIG_CACHE: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 300.0

_DEFAULT_AUTOMATION_PARAMS: dict[str, dict] = {
    "AUTO-01": {"days_ahead": 1},
    "AUTO-02": {"hours_ahead": 2, "window_minutes": 30},
    "AUTO-03": {"lookahead_weeks": 4, "min_gap_days": 3},
    "AUTO-04": {"consecutive_threshold": 3},
    "AUTO-05": {},
    "AUTO-06": {"max_weekly_hours": 15, "overload_threshold": 0.85},
    "AUTO-07": {},
    "AUTO-08": {"days_warning": 30, "days_critical": 60, "days_urgent": 90},
    "AUTO-09": {"notify_admin": True},
    "AUTO-10": {"projection_months": 3},
    "AUTO-11": {"days_before_expiry": 30, "days_urgent": 7},
    "AUTO-12": {"followup_hours": 24},
    "AUTO-13": {"evaluation_months": 6},
    "AUTO-14": {},
    "AUTO-15": {"lookback_weeks": 4},
    "AUTO-16": {},
    "AUTO-17": {},
    "AUTO-18": {"warning_days": 14, "urgent_days": 7},
    "AUTO-19": {"low_stock_threshold": 2},
    "AUTO-20": {},
    "AUTO-21": {},
    "AUTO-22": {"inactive_days": 60},
    "AUTO-23": {},
    "AUTO-24": {"delay_hours": 24, "min_position": 3},
    "AUTO-25": {},
    "AUTO-26": {},
    "AUTO-27": {},
    "AUTO-28": {},
    "AUTO-29": {"lookback_months": 6},
    "AUTO-30": {"max_failures": 5, "window_minutes": 10},
    "AUTO-31": {},
    "AUTO-32": {"anomaly_threshold": 100},
    "AUTO-33": {"inactive_days": 30},
    "AUTO-34": {},
    "AUTO-35": {},
    "AUTO-36-WA": {},
    "AUTO-36-BIL": {"billing_day": 1, "due_day_of_month": 5},
    "AUTO-37": {"pre_due_days": 5, "overdue_cycle_days": 7},
}


def _config_cache_key(automation_id: str, club_id: str | None) -> str:
    # club_id=None preserva la key en formato viejo (string plano) — así los
    # módulos que todavía no pasan club_id (no migrados a Fase 5) no invalidan
    # ni comparten cache con los que sí lo hacen.
    return automation_id if club_id is None else f"{automation_id}:{club_id}"


def get_automation_config(automation_id: str, club_id: str | None = None) -> dict:
    """Return live automation config from DB with 5-minute in-process cache.

    Multi-tenant (Fase 5): automation_config ahora tiene club_id (cada club
    puede activar/desactivar y parametrizar cada automatización por su
    cuenta). Pasar club_id explícito una vez el caller ya sabe para qué club
    está corriendo (dispatch pattern, ver get_active_club_ids). club_id=None
    preserva el comportamiento viejo (sin filtro) para módulos aún no
    migrados a Fase 5 — no rompe nada, simplemente no es multi-tenant-aware
    todavía.
    """
    cache_key = _config_cache_key(automation_id, club_id)
    now = time.monotonic()
    cached = _CONFIG_CACHE.get(cache_key)
    if cached and now - cached[1] < _CACHE_TTL:
        return cached[0]

    defaults = _DEFAULT_AUTOMATION_PARAMS.get(automation_id, {})
    config: dict = {
        "enabled": True,
        "schedule_hour": None,
        "schedule_minute": None,
        "custom_params": defaults.copy(),
    }

    try:
        db = get_supabase()
        query = (
            db.table("automation_config")
            .select("enabled,schedule_hour,schedule_minute,custom_params")
            .eq("automation_id", automation_id)
        )
        if club_id is not None:
            query = query.eq("club_id", club_id)
        row = query.maybe_single().execute()
        if row.data:
            d = row.data
            config["enabled"] = bool(d.get("enabled", True))
            config["schedule_hour"] = d.get("schedule_hour")
            config["schedule_minute"] = d.get("schedule_minute")
            merged = defaults.copy()
            merged.update(d.get("custom_params") or {})
            config["custom_params"] = merged
    except Exception as exc:
        logger.warning("get_automation_config failed for %s: %s", automation_id, exc)

    _CONFIG_CACHE[cache_key] = (config, now)
    return config


def invalidate_automation_config_cache(automation_id: str | None = None) -> None:
    if automation_id:
        # Invalida tanto la key global vieja como cualquier variante por club.
        for key in [k for k in _CONFIG_CACHE if k == automation_id or k.startswith(f"{automation_id}:")]:
            _CONFIG_CACHE.pop(key, None)
    else:
        _CONFIG_CACHE.clear()


# ── Email templates ────────────────────────────────────────────────────────────
_template_env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), '..', 'templates'))
)


def render_email_template(template_name: str, context: dict) -> str:
    """Render a Jinja2 email template from backend/templates/."""
    context.setdefault('year', datetime.now().year)
    context.setdefault('recipient_email', context.get('to_email', ''))
    template = _template_env.get_template(template_name)
    return template.render(**context)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def get_active_club_ids() -> list[str]:
    """Return the ids of every active club (Fase 6: base del patrón dispatch).

    Un task programado deja de correr "una vez global" y pasa a correr una
    vez POR CLUB ACTIVO — este helper es la fuente de verdad de qué clubes
    procesar. Un club con is_active=false (suspendido, ver clubs.is_active)
    se excluye a propósito: no tiene sentido facturarlo/notificarlo.
    """
    db = get_supabase()
    try:
        rows = (
            db.table("clubs").select("id").eq("is_active", True).execute()
        ).data or []
        return [r["id"] for r in rows]
    except Exception as exc:
        logger.error("get_active_club_ids failed: %s", exc)
        return []


def notify_user(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    automation_id: str = "unknown",
    club_id: str | None = None,
) -> None:
    """Insert in-app notification (picked up by Supabase Realtime) and log it.

    club_id: pásalo explícito una vez el caller sepa para qué club está
    notificando (dispatch pattern). notifications/notification_log tienen
    club_id NOT NULL — sin pasarlo acá, el trigger de la BD lo completa con
    el club "por defecto" (el primero que existe), lo cual es incorrecto en
    cuanto haya más de un club: el usuario del club B recibiría una
    notificación marcada como del club A y, por RLS, ¡nunca la vería!
    """
    db = get_supabase()
    try:
        payload = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
        }
        if club_id is not None:
            payload["club_id"] = club_id
        db.table("notifications").insert(payload).execute()
    except Exception as exc:
        logger.error("notify_user insert failed for %s: %s", user_id, exc)

    _log_notification(automation_id=automation_id, channel="push",
                      recipient_id=user_id, subject=title, body=message,
                      club_id=club_id)


def notify_role(
    role: str,
    title: str,
    message: str,
    notification_type: str = "info",
    automation_id: str = "unknown",
    club_id: str | None = None,
) -> int:
    """Send in-app notification to every user with a given role.

    club_id: filtra a los usuarios de ESE club solamente (y se propaga a
    cada notify_user). Sin pasarlo, notifica al rol en TODOS los clubes —
    correcto solo para módulos globales de plataforma, no para automations
    de negocio de un club específico.
    """
    db = get_supabase()
    try:
        query = db.table("user_roles").select("user_id").eq("role", role)
        if club_id is not None:
            query = query.eq("club_id", club_id)
        rows = query.execute().data or []
    except Exception as exc:
        logger.error("notify_role fetch failed role=%s: %s", role, exc)
        return 0

    count = 0
    for row in rows:
        notify_user(
            user_id=row["user_id"],
            title=title,
            message=message,
            notification_type=notification_type,
            automation_id=automation_id,
            club_id=club_id,
        )
        count += 1
    return count


def _log_notification(
    automation_id: str,
    channel: str,
    body: str,
    subject: str | None = None,
    recipient_id: str | None = None,
    recipient_ref: str | None = None,
    status: str = "sent",
    club_id: str | None = None,
) -> None:
    db = get_supabase()
    try:
        payload = {
            "automation_id": automation_id,
            "channel": channel,
            "recipient_id": recipient_id,
            "recipient_ref": recipient_ref,
            "subject": subject,
            "body": body,
            "status": status,
        }
        if club_id is not None:
            payload["club_id"] = club_id
        db.table("notification_log").insert(payload).execute()
    except Exception as exc:
        logger.error("_log_notification failed: %s", exc)


def log_activity(
    automation_id: str,
    agent_id: str,
    status: str,
    records_found: int = 0,
    actions_taken: int = 0,
    summary: str | None = None,
    error_message: str | None = None,
    club_id: str | None = None,
) -> None:
    """Write a row to agent_activity_log for observability.

    club_id: agent_activity_log lo tiene NULLABLE (a diferencia de
    notifications/notification_log) porque no todos los callers están
    migrados todavía — pero pasarlo cuando se conoce (dispatch por club)
    evita que el log de auditoría de un club quede atribuido al club
    "por defecto" por el trigger de la BD.
    """
    db = get_supabase()
    try:
        payload = {
            "automation_id": automation_id,
            "agent_id": agent_id,
            "status": status,
            "records_found": records_found,
            "actions_taken": actions_taken,
            "summary": summary,
            "error_message": error_message,
        }
        if club_id is not None:
            payload["club_id"] = club_id
        db.table("agent_activity_log").insert(payload).execute()
    except Exception as exc:
        logger.error("log_activity insert failed: %s", exc)


def get_admin_user_ids(club_id: str | None = None) -> list[str]:
    """Return user IDs with the admin role. club_id=None => todos los clubes."""
    db = get_supabase()
    try:
        query = db.table("user_roles").select("user_id").eq("role", "admin")
        if club_id is not None:
            query = query.eq("club_id", club_id)
        rows = query.execute().data or []
        return [r["user_id"] for r in rows]
    except Exception as exc:
        logger.error("get_admin_user_ids failed: %s", exc)
        return []


def get_coach_user_ids(club_id: str | None = None) -> list[str]:
    """Return user IDs with the coach role. club_id=None => todos los clubes."""
    db = get_supabase()
    try:
        query = db.table("user_roles").select("user_id").eq("role", "coach")
        if club_id is not None:
            query = query.eq("club_id", club_id)
        rows = query.execute().data or []
        return [r["user_id"] for r in rows]
    except Exception as exc:
        logger.error("get_coach_user_ids failed: %s", exc)
        return []


def send_email(
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    attachments: list[dict] | None = None,
) -> bool:
    """Send transactional email via Resend. Returns True on success.

    Reads API key and sender address from settings (config.py).
    Retries up to 3 times on 429 or 5xx responses with a 2s delay.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html_body: HTML content of the email.
        text_body: Optional plain-text fallback.
        attachments: Optional list of dicts with keys ``filename`` (str) and
            ``content`` (base64-encoded str), e.g.
            ``[{"filename": "factura.pdf", "content": "<base64>"}]``.
    """
    api_key = settings.resend_api_key
    from_email = settings.resend_from_email

    if not api_key:
        logger.warning("resend_api_key not configured — email not sent to %s", to)
        return False

    try:
        import httpx
        payload: dict = {
            "from": from_email,
            "to": [to],
            "subject": subject,
            "html": html_body,
        }
        if text_body:
            payload["text"] = text_body
        if attachments:
            payload["attachments"] = [
                {"filename": a["filename"], "content": a["content"]}
                for a in attachments
            ]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        last_exc: Exception | None = None
        for attempt in range(1, 4):
            try:
                resp = httpx.post(
                    "https://api.resend.com/emails",
                    headers=headers,
                    json=payload,
                    timeout=15.0,
                )
                if resp.status_code in (429,) or resp.status_code >= 500:
                    logger.warning(
                        "Resend returned %s on attempt %d for %s — retrying in 2s",
                        resp.status_code, attempt, to,
                    )
                    time.sleep(2)
                    continue
                resp.raise_for_status()
                data = resp.json()
                logger.info("Email sent to %s — id=%s", to, data.get("id"))
                return True
            except httpx.HTTPStatusError as exc:
                last_exc = exc
                if attempt < 3:
                    time.sleep(2)
        logger.error("Email send failed to %s after 3 attempts: %s", to, last_exc)
        return False
    except Exception as exc:
        logger.error("Email send failed to %s: %s", to, exc)
        return False


def task_wrapper(automation_id: str, agent_id: str):
    """Decorator: checks enabled flag, catches exceptions, logs activity."""
    import functools

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs) -> dict[str, Any]:
            cfg = get_automation_config(automation_id)
            if not cfg.get("enabled", True):
                logger.info("%s: deshabilitada — omitida", automation_id)
                return {"records_found": 0, "actions_taken": 0, "summary": "Deshabilitada"}
            try:
                result = fn(*args, **kwargs)
                log_activity(
                    automation_id=automation_id,
                    agent_id=agent_id,
                    status="success",
                    records_found=result.get("records_found", 0),
                    actions_taken=result.get("actions_taken", 0),
                    summary=result.get("summary"),
                )
                return result
            except Exception as exc:
                logger.exception("%s failed", automation_id)
                log_activity(
                    automation_id=automation_id,
                    agent_id=agent_id,
                    status="error",
                    error_message=str(exc),
                )
                raise

        return wrapper
    return decorator
