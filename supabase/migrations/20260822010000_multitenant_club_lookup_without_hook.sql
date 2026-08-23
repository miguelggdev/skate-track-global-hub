-- =============================================================
-- Multi-tenant — ajuste: Custom Access Token Hook requiere plan
-- Team/Enterprise de Supabase Cloud (no disponible en el plan actual).
--
-- Se reemplaza la lectura de club_id desde el JWT por una consulta
-- SECURITY DEFINER a user_claims por auth.uid() — el mismo patrón
-- que ya usan has_role()/get_user_role() sobre user_roles en
-- 20260101000000_initial_schema.sql. Sin dependencia de ningún hook.
--
-- custom_access_token_hook() (de la migración anterior) queda definida
-- pero inactiva — se puede activar sin cambios de schema el día que se
-- suba de plan o se migre a self-hosted (Fase 8 del plan multi-tenant).
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_user_club_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT club_id FROM public.user_claims WHERE user_id = _user_id
$$;

COMMENT ON FUNCTION public.get_user_club_id IS
  'Devuelve el club_id del usuario consultando user_claims. Reemplaza la lectura desde JWT (que requeriría el Custom Access Token Hook, no disponible en el plan actual de Supabase).';

GRANT EXECUTE ON FUNCTION public.get_user_club_id TO authenticated, anon, service_role;

-- Redefine same_club() sin JWT: compara contra el club del usuario
-- autenticado. Sigue usando "=" (nunca IS NOT DISTINCT FROM).
CREATE OR REPLACE FUNCTION public.same_club(row_club_id uuid)
RETURNS boolean
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  SELECT row_club_id = public.get_user_club_id(auth.uid())
$$;

-- user_club_id() (creada en la migración anterior, leía del JWT) pasa a
-- delegar en la misma consulta por auth.uid() — deja de depender del hook.
CREATE OR REPLACE FUNCTION public.user_club_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT public.get_user_club_id(auth.uid())
$$;

GRANT EXECUTE ON FUNCTION public.same_club TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.user_club_id TO authenticated, anon, service_role;
