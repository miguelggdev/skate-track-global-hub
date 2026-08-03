import asyncio

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from config import settings

security = HTTPBearer()

# Roles con acceso a datos sensibles del club
PRIVILEGED_ROLES = {"admin", "coach", "leader", "delegate", "finance"}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verifica el JWT de Supabase y devuelve el payload del usuario."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Token inválido: sin user ID")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {e}")


def _fetch_app_role(user_id: str) -> str | None:
    """Consulta la tabla user_roles para obtener el rol de la app (no el del JWT)."""
    from database.supabase_client import get_supabase
    result = (
        get_supabase()
        .table("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0].get("role") if result.data else None


async def _fetch_app_role_async(user_id: str) -> str | None:
    """Versión async de _fetch_app_role — usa asyncio.to_thread para no bloquear el event loop."""
    return await asyncio.to_thread(_fetch_app_role, user_id)


def require_roles(*allowed_roles: str):
    """
    Dependency factory que verifica que el usuario tenga uno de los roles indicados.
    Nota: el JWT de Supabase lleva 'role: authenticated', el rol de la app está en DB.
    """
    def _check(current_user: dict = Depends(get_current_user)) -> dict:
        user_id = current_user.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token sin sub claim")

        app_role = _fetch_app_role(user_id)
        if app_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para acceder a este recurso",
            )
        return {**current_user, "app_role": app_role}

    return _check
