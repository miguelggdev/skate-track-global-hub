"""Automation control panel — config CRUD + activity log."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from api.deps import _fetch_role_and_club_async, get_current_user
from database.supabase_client import get_supabase
from tasks.helpers import get_automation_config, invalidate_automation_config_cache

router = APIRouter(prefix="/automations", tags=["automations"])


class AutomationConfigUpdate(BaseModel):
    enabled: bool | None = None
    schedule_hour: int | None = None
    schedule_minute: int | None = None
    custom_params: dict[str, Any] | None = None

    @field_validator("schedule_hour")
    @classmethod
    def validate_hour(cls, v: int | None) -> int | None:
        if v is not None and not (0 <= v <= 23):
            raise ValueError("schedule_hour debe estar entre 0 y 23")
        return v

    @field_validator("schedule_minute")
    @classmethod
    def validate_minute(cls, v: int | None) -> int | None:
        if v is not None and not (0 <= v <= 59):
            raise ValueError("schedule_minute debe estar entre 0 y 59")
        return v


@router.get("")
async def list_automations(current_user: dict = Depends(get_current_user)) -> dict:
    role, club_id = await _fetch_role_and_club_async(current_user["sub"])
    if role not in ("admin", "leader"):
        raise HTTPException(status_code=403, detail="Solo admin o leader pueden ver las automatizaciones")
    if not club_id:
        raise HTTPException(status_code=403, detail="Usuario sin club asignado")
    db = get_supabase()
    result = (
        db.table("automation_config")
        .select("*")
        .eq("club_id", club_id)
        .order("automation_id")
        .execute()
    )
    return {"automations": result.data or []}


_VALID_STATUSES = {"success", "error", "skipped", "partial"}

from tasks.helpers import _DEFAULT_AUTOMATION_PARAMS as _KNOWN_IDS


@router.get("/logs")
async def list_activity_logs(
    limit: int = 50,
    automation_id: str | None = None,
    status: str | None = None,
    current_user: dict = Depends(get_current_user),
) -> dict:
    role, club_id = await _fetch_role_and_club_async(current_user["sub"])
    if role not in ("admin", "leader"):
        raise HTTPException(status_code=403, detail="Solo admin o leader pueden ver los logs")
    if not club_id:
        raise HTTPException(status_code=403, detail="Usuario sin club asignado")
    if status and status not in _VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status debe ser uno de: {sorted(_VALID_STATUSES)}")

    db = get_supabase()
    query = (
        db.table("agent_activity_log")
        .select("id,automation_id,agent_id,status,records_found,actions_taken,summary,error_message,ran_at")
        .eq("club_id", club_id)
        .order("ran_at", desc=True)
        .limit(min(limit, 200))
    )
    if automation_id:
        query = query.eq("automation_id", automation_id)
    if status:
        query = query.eq("status", status)

    result = query.execute()
    logs = result.data or []
    return {"logs": logs, "total": len(logs)}


@router.patch("/{automation_id}")
async def update_automation(
    automation_id: str,
    body: AutomationConfigUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    role, club_id = await _fetch_role_and_club_async(current_user["sub"])
    if role != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede modificar automatizaciones")
    if not club_id:
        raise HTTPException(status_code=403, detail="Usuario sin club asignado")
    if automation_id not in _KNOWN_IDS:
        raise HTTPException(status_code=404, detail=f"Automatización '{automation_id}' no encontrada")

    update_data: dict[str, Any] = {
        "automation_id": automation_id,
        "club_id": club_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user["sub"],
    }
    if body.enabled is not None:
        update_data["enabled"] = body.enabled
    if body.schedule_hour is not None:
        update_data["schedule_hour"] = body.schedule_hour
    if body.schedule_minute is not None:
        update_data["schedule_minute"] = body.schedule_minute
    if body.custom_params is not None:
        update_data["custom_params"] = body.custom_params

    db = get_supabase()
    result = db.table("automation_config").upsert(update_data).execute()
    invalidate_automation_config_cache(automation_id)
    return {"ok": True, "automation_id": automation_id, "data": result.data}
