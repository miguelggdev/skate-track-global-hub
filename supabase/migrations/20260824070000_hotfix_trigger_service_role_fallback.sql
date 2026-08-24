-- =============================================================
-- HOTFIX URGENTE: set_club_id_from_current_user() solo rellenaba club_id
-- vía get_user_club_id(auth.uid()) — para requests autenticados desde el
-- frontend eso funciona, pero el backend (Celery, FastAPI routes, agentes
-- LangGraph) usa el cliente service_role, que NO tiene auth.uid() (no hay
-- JWT de usuario en ese contexto). Resultado: get_user_club_id(NULL) =
-- NULL, y cualquier INSERT del backend a una tabla del Grupo A con
-- club_id NOT NULL falla con "null value in column club_id violates
-- not-null constraint" — AHORA MISMO, no en teoría (Celery beat sigue
-- corriendo en producción).
--
-- Fix: fallback a default_club_id() (el único club real hoy) cuando no
-- hay usuario autenticado en la sesión. Esto NO reemplaza la Fase 5 (el
-- backend igual debe mandar club_id explícito por cada club una vez
-- existan varios) — es la red de seguridad para no romper nada mientras
-- esa fase se hace archivo por archivo con cuidado, y para service_role
-- sin usuario en contexto en general.
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_club_id_from_current_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.club_id IS NULL THEN
    NEW.club_id := COALESCE(public.get_user_club_id(auth.uid()), public.default_club_id());
  END IF;
  RETURN NEW;
END;
$$;
