-- =============================================================
-- Perfil completo del atleta — campos adicionales identificados
-- como experto en patinaje de velocidad (SPEC-005)
-- =============================================================

-- =============================================================
-- 1. NUEVOS CAMPOS EN athletes
-- =============================================================

-- specialty ya tiene 'fondista' | 'velocista', agregamos 'omnium'
ALTER TYPE public.athlete_specialty ADD VALUE IF NOT EXISTS 'omnium';

ALTER TABLE public.athletes
  -- Licencias deportivas
  ADD COLUMN IF NOT EXISTS fedepatin_license    text,
  ADD COLUMN IF NOT EXISTS world_skate_id       text,
  -- Apoyo estatal (deportista de alto rendimiento con apoyo económico)
  ADD COLUMN IF NOT EXISTS is_elite_athlete     boolean NOT NULL DEFAULT false,
  -- Contacto de emergencia propio (útil para atletas adultos)
  ADD COLUMN IF NOT EXISTS emergency_contact_name  text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  -- Pruebas dominantes (ej: ['300m_cri','500m_cri'])
  ADD COLUMN IF NOT EXISTS dominant_distances   text[] NOT NULL DEFAULT '{}',
  -- Dirección completa de residencia
  ADD COLUMN IF NOT EXISTS address              text,
  ADD COLUMN IF NOT EXISTS city                 text,
  ADD COLUMN IF NOT EXISTS department           text;

-- =============================================================
-- 2. NUEVOS CAMPOS EN athlete_history
-- =============================================================

ALTER TABLE public.athlete_history
  -- Fecha exacta de ingreso al club actual
  ADD COLUMN IF NOT EXISTS club_entry_date      date,
  -- Historial de categorías año a año
  -- Ej: [{"year": 2020, "category": "prejuvenil"}, {"year": 2022, "category": "juvenil"}]
  ADD COLUMN IF NOT EXISTS category_history     jsonb NOT NULL DEFAULT '[]',
  -- ¿Ha sido convocado a selección Colombia?
  ADD COLUMN IF NOT EXISTS is_national_team     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS national_team_years  text,   -- "2023, 2024, 2025"
  -- Club anterior + años
  ADD COLUMN IF NOT EXISTS previous_clubs       jsonb NOT NULL DEFAULT '[]';
  -- Ej: [{"name": "Club Bogotá", "years": "2018-2021"}]

-- =============================================================
-- 3. COMPETENCIAS INTERNACIONALES (tabla independiente)
--    Separada de competition_results para mejor trazabilidad
--    de participaciones en eventos fuera de Colombia
-- =============================================================

CREATE TABLE public.athlete_international_competitions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id            uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  competition_name      text NOT NULL,
  organizer             text,              -- World Skate, PASPC, etc.
  city                  text NOT NULL,
  country               text NOT NULL,
  competition_year      integer NOT NULL,
  competition_date      date,
  event_name            text NOT NULL,     -- "500m CRI", "3km Fondo"
  category              athlete_category,
  gender                athlete_gender,
  position              integer,
  time_seconds          numeric(10,3),
  points                integer,
  status                text DEFAULT 'normal' CHECK (status IN ('normal','dsq','dns','dnf')),
  is_national_team_rep  boolean NOT NULL DEFAULT false,
  medal_type            text CHECK (medal_type IN ('gold','silver','bronze')),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_intl_competitions_athlete ON public.athlete_international_competitions(athlete_id);
CREATE INDEX idx_intl_competitions_year    ON public.athlete_international_competitions(competition_year);

ALTER TABLE public.athlete_international_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete views own international comps" ON public.athlete_international_competitions
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff views all international comps" ON public.athlete_international_competitions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach')
      OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));

CREATE POLICY "Admin manages international comps" ON public.athlete_international_competitions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

-- =============================================================
-- 4. MEJORAR TABLA documents PARA GESTIÓN DOCUMENTAL COMPLETA
-- =============================================================

-- Nuevos tipos de documento específicos para patinaje
ALTER TYPE public.document_type
  ADD VALUE IF NOT EXISTS 'documento_identidad';    -- TI, CC, Pasaporte

ALTER TYPE public.document_type
  ADD VALUE IF NOT EXISTS 'tarjeta_eps';             -- Carné EPS

ALTER TYPE public.document_type
  ADD VALUE IF NOT EXISTS 'registro_civil';          -- Para menores

ALTER TYPE public.document_type
  ADD VALUE IF NOT EXISTS 'licencia_fedepatin';      -- Licencia deportiva

ALTER TYPE public.document_type
  ADD VALUE IF NOT EXISTS 'certificado_medico_deportivo'; -- Apto médico

ALTER TYPE public.document_type
  ADD VALUE IF NOT EXISTS 'consentimiento_imagen';   -- Derechos de imagen

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS expiry_date      date,
  ADD COLUMN IF NOT EXISTS doc_status       text NOT NULL DEFAULT 'vigente'
      CHECK (doc_status IN ('vigente', 'vencido', 'pendiente', 'no_aplica')),
  ADD COLUMN IF NOT EXISTS file_name        text,
  ADD COLUMN IF NOT EXISTS file_size_kb     integer,
  ADD COLUMN IF NOT EXISTS verified_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS notes            text;

-- Índice para alertas de vencimiento
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.documents(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- =============================================================
-- 5. FUNCIÓN — Calcular estado de documentos vencidos
--    Se puede llamar diariamente para actualizar doc_status
-- =============================================================

CREATE OR REPLACE FUNCTION public.refresh_document_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.documents
  SET doc_status = CASE
    WHEN expiry_date IS NULL                     THEN 'vigente'
    WHEN expiry_date < CURRENT_DATE              THEN 'vencido'
    WHEN expiry_date >= CURRENT_DATE             THEN 'vigente'
    ELSE 'pendiente'
  END
  WHERE doc_status != 'no_aplica';
END;
$$;

-- Vista athlete_cv_summary se crea en migración 20260106000001_athlete_cv_view.sql
-- separada para facilitar actualizaciones sin reruns completos.
