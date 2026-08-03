"""Shared helpers for all automation tasks."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def notify_user(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    automation_id: str = "unknown",
) -> None:
    """Insert in-app notification (picked up by Supabase Realtime) and log it."""
    db = get_supabase()
    try:
        db.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
        }).execute()
    except Exception as exc:
        logger.error("notify_user insert failed for %s: %s", user_id, exc)

    _log_notification(automation_id=automation_id, channel="push",
                      recipient_id=user_id, subject=title, body=message)


def notify_role(
    role: str,
    title: str,
    message: str,
    notification_type: str = "info",
    automation_id: str = "unknown",
) -> int:
    """Send in-app notification to every active user with a given role."""
    db = get_supabase()
    try:
        rows = (
            db.table("user_roles")
            .select("user_id")
            .eq("role", role)
            .execute()
        ).data or []
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
) -> None:
    db = get_supabase()
    try:
        db.table("notification_log").insert({
            "automation_id": automation_id,
            "channel": channel,
            "recipient_id": recipient_id,
            "recipient_ref": recipient_ref,
            "subject": subject,
            "body": body,
            "status": status,
        }).execute()
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
) -> None:
    """Write a row to agent_activity_log for observability."""
    db = get_supabase()
    try:
        db.table("agent_activity_log").insert({
            "automation_id": automation_id,
            "agent_id": agent_id,
            "status": status,
            "records_found": records_found,
            "actions_taken": actions_taken,
            "summary": summary,
            "error_message": error_message,
        }).execute()
    except Exception as exc:
        logger.error("log_activity insert failed: %s", exc)


def get_admin_user_ids() -> list[str]:
    """Return all user IDs with the admin role."""
    db = get_supabase()
    try:
        rows = (
            db.table("user_roles").select("user_id").eq("role", "admin").execute()
        ).data or []
        return [r["user_id"] for r in rows]
    except Exception as exc:
        logger.error("get_admin_user_ids failed: %s", exc)
        return []


def get_coach_user_ids() -> list[str]:
    """Return all user IDs with the coach role."""
    db = get_supabase()
    try:
        rows = (
            db.table("user_roles").select("user_id").eq("role", "coach").execute()
        ).data or []
        return [r["user_id"] for r in rows]
    except Exception as exc:
        logger.error("get_coach_user_ids failed: %s", exc)
        return []


def send_email_placeholder(
    to_email: str,
    subject: str,
    body: str,
    automation_id: str = "unknown",
) -> None:
    """Log intent to send email — wire up Resend/SMTP here when ready."""
    logger.info("[EMAIL QUEUED] automation=%s to=%s subject=%s", automation_id, to_email, subject)
    _log_notification(
        automation_id=automation_id,
        channel="email",
        recipient_ref=to_email,
        subject=subject,
        body=body,
        status="queued",
    )


def task_wrapper(automation_id: str, agent_id: str):
    """Decorator that catches exceptions and logs the activity outcome."""
    import functools

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs) -> dict[str, Any]:
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
