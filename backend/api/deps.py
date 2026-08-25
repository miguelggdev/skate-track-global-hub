import asyncio
import logging

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import PyJWKClient

from config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()

# Roles con acceso a datos sensibles del club
PRIVILEGED_ROLES = {"admin", "coach", "leader", "delegate", "finance"}

# ── Verificación de JWT (claves asimétricas ES256/RS256 vía JWKS + fallback HS256) ──
# Supabase migró a firmas asimétricas (ECC/RSA). Los tokens nuevos ya no se pueden
# verificar con el secreto compartido, así que se valida contra el JWKS del proyecto.
# Se mantiene el fallback HS256 para tokens legacy aún vigentes.
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        url = settings.supabase_url.rstrip("/") + "/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(
            url, cache_keys=True, headers={"apikey": settings.supabase_service_key}
        )
    return _jwks_client


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verifica el JWT de Supabase (asimétrico o legacy HS256) y devuelve el payload."""
    token = credentials.credentials
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
        if alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise HTTPException(status_code=401, detail="Token legacy no soportado")
            payload = jwt.decode(
                token, settings.supabase_jwt_secret,
                algorithms=["HS256"], audience="authenticated",
            )
        else:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token, signing_key.key,
                algorithms=["ES256", "RS256"], audience="authenticated",
            )
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Token inválido: sin user ID")
        return payload
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception as e:  # noqa: BLE001 — falla cerrado: cualquier error de verificación = 401
        logger.warning("JWT validation failed: %s", e)
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


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


def _fetch_role_and_club(user_id: str) -> tuple[str | None, str | None]:
    """Consulta user_roles y devuelve (role, club_id) del usuario en una sola query.

    Multi-tenant (Fase 5): el backend usa service_role, que ignora RLS por completo —
    cualquier tool/ruta que lea/escriba tablas de negocio DEBE filtrar por este club_id
    explícitamente, o mezclará datos entre clubes.
    """
    from database.supabase_client import get_supabase
    result = (
        get_supabase()
        .table("user_roles")
        .select("role, club_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None, None
    row = result.data[0]
    return row.get("role"), row.get("club_id")


async def _fetch_role_and_club_async(user_id: str) -> tuple[str | None, str | None]:
    """Versión async de _fetch_role_and_club."""
    return await asyncio.to_thread(_fetch_role_and_club, user_id)


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
