from functools import lru_cache
from supabase import create_client, Client
from config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Singleton del cliente Supabase con service_role (permisos totales)."""
    return create_client(settings.supabase_url, settings.supabase_service_key)
