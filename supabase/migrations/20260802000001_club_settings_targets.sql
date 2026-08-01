-- =============================================================
-- Club settings: añadir metas configurables de KPIs
-- Elimina los valores hardcodeados TARGET_ATHLETES / TARGET_REVENUE
-- del frontend y los mueve a la tabla de configuración del club.
-- =============================================================

ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS target_athletes integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS target_revenue  numeric(12,2) NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS club_logo_url   text,
  ADD COLUMN IF NOT EXISTS city            text,
  ADD COLUMN IF NOT EXISTS country         text NOT NULL DEFAULT 'Colombia',
  ADD COLUMN IF NOT EXISTS website_url     text,
  ADD COLUMN IF NOT EXISTS founded_year    integer;
