-- =============================================================
-- Fix urgente: handle_new_user() (y sus versiones anteriores en el
-- historial de migraciones) insertan en user_roles(user_id, role) SIN
-- club_id. Desde 20260822000000_multitenant_foundation.sql, club_id es
-- NOT NULL sin default → cualquier registro nuevo rompería con
-- "null value in column club_id violates not-null constraint".
--
-- Fix temporal: DEFAULT al club actual (mientras solo existe 1 club).
-- Cuando la Fase 1/7 del plan multi-tenant agregue selección de club en
-- el signup (club_id vendría en raw_user_meta_data), este default deja
-- de ser necesario para altas nuevas — se puede quitar entonces, o
-- dejarlo como red de seguridad adicional.
-- =============================================================

CREATE OR REPLACE FUNCTION public.default_club_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT id FROM public.clubs ORDER BY created_at LIMIT 1
$$;

COMMENT ON FUNCTION public.default_club_id IS
  'Club por defecto para inserts que no especifican club_id (ej. handle_new_user() en el signup). Fix temporal mientras exista un solo club activo.';

ALTER TABLE public.user_roles ALTER COLUMN club_id SET DEFAULT public.default_club_id();
