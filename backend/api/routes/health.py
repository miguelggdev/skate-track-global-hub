from datetime import datetime, timezone

from fastapi import APIRouter

from config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
