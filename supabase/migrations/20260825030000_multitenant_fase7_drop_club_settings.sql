-- =============================================================
-- Multi-tenant — Fase 7 (cierre). Ver plan en
-- ~/.claude/plans/linear-roaming-torvalds.md.
--
-- club_settings tenía 0 filas en producción, RLS sin ningún scoping por
-- club (SELECT qual=true, UPDATE solo chequeaba rol) — riesgo de seguridad
-- latente documentado desde la Fase 4: con un 2do club activo, el admin de
-- un club podría leer/pisar la config del otro. Como nunca tuvo datos, se
-- borra directamente en vez de agregarle RLS.
--
-- 4 columnas reales de club_settings que no existían en `clubs` (el resto
-- de las columnas del formulario ClubInfoSettings.tsx — social_facebook/
-- instagram/twitter, timezone, language, doctor_*, physiotherapist_*,
-- coach_*, report_include_*, report_header_style, delegate_email,
-- president_phone, president_id — NUNCA existieron como columna real en
-- club_settings tampoco: ese INSERT/UPDATE fallaba con "column does not
-- exist" para cualquier admin que intentara guardar esa parte del
-- formulario, desde antes de esta sesión. No se agregan esas columnas acá
-- — es una feature que nunca funcionó, no algo que este migration rompe).
-- =============================================================

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS target_athletes integer,
  ADD COLUMN IF NOT EXISTS target_revenue numeric,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'COP';

-- Hallazgo al intentar el DROP: award_scheme_configs.club_id quedó con FK
-- apuntando a club_settings (tabla equivocada, típo de la migración de
-- Fase 1 20260824040000 — el resto de las 46 tablas de Grupo A sí
-- referencian `clubs` correctamente) y sin backfill — sus 2 filas
-- existentes tienen club_id NULL. Bug preexistente, no relacionado con el
-- borrado de club_settings en sí, pero bloqueaba este DROP.
ALTER TABLE public.award_scheme_configs DROP CONSTRAINT award_scheme_configs_club_id_fkey;
UPDATE public.award_scheme_configs SET club_id = public.default_club_id() WHERE club_id IS NULL;
ALTER TABLE public.award_scheme_configs ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.award_scheme_configs
  ADD CONSTRAINT award_scheme_configs_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id);

DROP TABLE IF EXISTS public.club_settings;
