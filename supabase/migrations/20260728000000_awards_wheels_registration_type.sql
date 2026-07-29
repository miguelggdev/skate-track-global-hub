-- =============================================================
-- Migración: Sistema de premios configurable, diámetro de ruedas,
-- tipo de registro de deportistas y configuración de corte de edad
-- =============================================================

-- ────────────────────────────────────────────────────────────────
-- 1. ENUM: tipo de registro del deportista (ligado/federado/escuela)
-- ────────────────────────────────────────────────────────────────
CREATE TYPE public.athlete_registration_type AS ENUM (
  'ligado',       -- afiliado a la Liga de Bogotá
  'federado',     -- afiliado a la FCP (nacional)
  'escuela',      -- miembro de escuela/no ligado
  'nuevo'         -- en proceso de afiliación
);

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS registration_type athlete_registration_type NOT NULL DEFAULT 'escuela',
  ADD COLUMN IF NOT EXISTS registration_number text,           -- número de carné liga/federación
  ADD COLUMN IF NOT EXISTS registration_valid_until date;      -- vencimiento del carné

-- ────────────────────────────────────────────────────────────────
-- 2. TABLA: ruedas del deportista (historial de equipamiento)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE public.athlete_wheels (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id         uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  brand              text        NOT NULL,
  model              text,
  diameter_mm        integer     NOT NULL CHECK (diameter_mm BETWEEN 60 AND 130),
  hardness_a         integer     CHECK (hardness_a BETWEEN 60 AND 110), -- dureza Shore A
  purchase_date      date,
  is_current         boolean     NOT NULL DEFAULT true,
  notes              text,
  -- validación automática vs límite de categoría
  category_limit_mm  integer,    -- límite calculado al momento del registro
  exceeds_limit      boolean     GENERATED ALWAYS AS (
                       category_limit_mm IS NOT NULL AND diameter_mm > category_limit_mm
                     ) STORED,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_athlete_wheels_athlete  ON public.athlete_wheels(athlete_id);
CREATE INDEX idx_athlete_wheels_current  ON public.athlete_wheels(athlete_id, is_current) WHERE is_current = true;

ALTER TABLE public.athlete_wheels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes view own wheels" ON public.athlete_wheels
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
         OR has_role(auth.uid(), 'coach')
         OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Athletes manage own wheels" ON public.athlete_wheels
  FOR ALL TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
         OR has_role(auth.uid(), 'admin'))
  WITH CHECK (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
              OR has_role(auth.uid(), 'admin'));

-- ────────────────────────────────────────────────────────────────
-- 3. TABLA: configuración de premiación (por club)
-- ────────────────────────────────────────────────────────────────
CREATE TYPE public.award_scheme_type AS ENUM (
  'clasico',        -- top 3: oro/plata/bronce
  'resolucion_061', -- según Resolución 061 Liga Bogotá: varía por edad
  'personalizado'   -- configuración libre por admin
);

CREATE TABLE public.award_scheme_configs (
  id           uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid                REFERENCES public.club_settings(id) ON DELETE CASCADE,
  scheme_type  award_scheme_type   NOT NULL DEFAULT 'resolucion_061',
  name         text                NOT NULL DEFAULT 'Esquema por defecto',
  -- JSON de configuración para esquema personalizado:
  -- { "Mini 7 años": {"count": 10, "type": "destacado"}, "Infantil 12 años": {"count": 3, "type": "podio"} }
  custom_config jsonb              DEFAULT '{}',
  is_active    boolean             NOT NULL DEFAULT true,
  created_by   uuid                REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz         NOT NULL DEFAULT now(),
  updated_at   timestamptz         NOT NULL DEFAULT now(),
  UNIQUE (scheme_type)
);

ALTER TABLE public.award_scheme_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view award schemes" ON public.award_scheme_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manages award schemes" ON public.award_scheme_configs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Configuración por defecto: Resolución 061 Liga Bogotá
INSERT INTO public.award_scheme_configs (scheme_type, name, custom_config) VALUES
  ('resolucion_061', 'Resolución 061 — Liga de Bogotá', '{
    "Mini 7 años":          {"count": 10, "type": "destacado"},
    "Mini 8 años":          {"count": 7,  "type": "destacado"},
    "Mini 9 años":          {"count": 7,  "type": "destacado"},
    "Mini 10 años":         {"count": 7,  "type": "destacado"},
    "Pre-infantil 11 años": {"count": 5,  "type": "destacado"},
    "Infantil 12 años":     {"count": 5,  "type": "podio", "silver_range": [2,3], "bronze_range": [4,5]},
    "Junior 13 años":       {"count": 5,  "type": "podio", "silver_range": [2,3], "bronze_range": [4,5]},
    "default":              {"count": 3,  "type": "clasico"}
  }'),
  ('clasico', 'Clásico — Oro, Plata, Bronce (Top 3)', '{"default": {"count": 3, "type": "clasico"}}')
ON CONFLICT (scheme_type) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 4. SYSTEM_SETTINGS: corte de edad y esquema de premios activo
-- ────────────────────────────────────────────────────────────────
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category) VALUES
  ('category_cutoff_system', 'fcp', 'string',
   'Sistema de corte para cálculo de categoría: fcp (1 de julio) o worldskate (31 de diciembre)',
   'competitions'),
  ('active_award_scheme', 'resolucion_061', 'string',
   'Esquema de premiación activo: clasico, resolucion_061 o personalizado',
   'competitions'),
  ('wheel_validation_enabled', 'true', 'boolean',
   'Validar diámetro de ruedas contra límite de la categoría al registrar equipamiento',
   'competitions')
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 5. VISTA: tabla de límites de rueda por categoría
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.wheel_limits_by_category AS
SELECT
  category_name,
  max_diameter_mm,
  applies_from_age,
  applies_to_age
FROM (VALUES
  ('Mini 7 años',          80, 0,  7),
  ('Mini 8 años',          80, 8,  8),
  ('Mini 9 años',          84, 9,  9),
  ('Mini 10 años',         84, 10, 10),
  ('Pre-infantil 11 años', 90, 11, 11),
  ('Infantil 12 años',    100, 12, 12),
  ('Junior 13 años',      100, 13, 13),
  ('Prejuvenil 14 años',  NULL, 14, 14),
  ('Juvenil 1er año',     NULL, 15, 15),
  ('Juvenil 2do año',     NULL, 16, 16),
  ('Juvenil 3er año',     NULL, 17, 17),
  ('Mayores',             NULL, 18, 34),
  ('Masters',             NULL, 35, 99)
) AS t(category_name, max_diameter_mm, applies_from_age, applies_to_age);

GRANT SELECT ON public.wheel_limits_by_category TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 6. FUNCIÓN: obtener límite de rueda por edad deportiva
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_wheel_limit_for_age(p_sport_age integer)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT max_diameter_mm
  FROM public.wheel_limits_by_category
  WHERE p_sport_age BETWEEN applies_from_age AND applies_to_age
  LIMIT 1;
$$;

-- ────────────────────────────────────────────────────────────────
-- 7. ÍNDICES adicionales en competition_results para medal queries
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comp_results_medal_type
  ON public.competition_results(competition_id, medal_type)
  WHERE medal_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_results_medal_athlete
  ON public.competition_results(athlete_id, competition_id)
  WHERE medal_type IS NOT NULL;
