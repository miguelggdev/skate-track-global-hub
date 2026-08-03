-- =============================================================
-- Modelo completo de competencias — tablas confirmadas en el
-- análisis de requerimientos (SYSTEM_DESIGN.md)
--
-- Nuevas tablas: external_athletes, result_imports, relay_teams,
-- relay_team_members, relay_results, leagues, league_stages,
-- league_standings, point_tables, competition_resolutions
--
-- Tablas modificadas: competition_results (atletas externos,
-- dorsal, estado DSQ/DNS/DNF, diferencia, referencia a import)
-- =============================================================

-- =============================================================
-- 1. ATLETAS EXTERNOS (de otros clubes / países)
-- =============================================================

CREATE TABLE public.external_athletes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  club_name   text NOT NULL,
  category    athlete_category,
  gender      athlete_gender,
  country     text NOT NULL DEFAULT 'Colombia',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (full_name, club_name)
);

CREATE INDEX idx_external_athletes_club     ON public.external_athletes(club_name);
CREATE INDEX idx_external_athletes_category ON public.external_athletes(category);

ALTER TABLE public.external_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view external athletes" ON public.external_athletes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manages external athletes" ON public.external_athletes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

-- =============================================================
-- 2. TRAZABILIDAD DE IMPORTACIONES (OCR + validación admin)
-- =============================================================

CREATE TYPE public.import_status AS ENUM (
  'pending',    -- archivo subido, extracción en progreso
  'extracted',  -- IA extrajo los datos, pendiente revisión
  'validated',  -- admin revisó y confirmó
  'imported',   -- datos guardados en BD
  'failed'      -- error en extracción o importación
);

CREATE TABLE public.result_imports (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid          REFERENCES public.competitions(id) ON DELETE SET NULL,
  file_url        text          NOT NULL,
  file_type       text          NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_name       text,
  imported_by     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          import_status NOT NULL DEFAULT 'pending',
  raw_extracted   jsonb,        -- JSON crudo extraído por Claude Vision
  validated_data  jsonb,        -- datos confirmados por admin
  rows_total      integer       NOT NULL DEFAULT 0,
  rows_imported   integer       NOT NULL DEFAULT 0,
  rows_skipped    integer       NOT NULL DEFAULT 0,
  error_log       jsonb,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX idx_result_imports_competition ON public.result_imports(competition_id);
CREATE INDEX idx_result_imports_status      ON public.result_imports(status);
CREATE INDEX idx_result_imports_importer    ON public.result_imports(imported_by);

ALTER TABLE public.result_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages result imports" ON public.result_imports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================================
-- 3. MODIFICAR competition_results PARA SOPORTAR:
--    - Atletas externos
--    - Dorsal por evento
--    - Estado DSQ/DNS/DNF
--    - Diferencia de tiempo con el líder
--    - Referencia al race_event (prueba)
--    - Trazabilidad de importación
-- =============================================================

-- Estado del resultado (normal, descalificado, no salió, no terminó)
CREATE TYPE public.result_status AS ENUM ('normal', 'dsq', 'dns', 'dnf');

-- athlete_id pasa a ser nullable (cuando el resultado es de atleta externo)
ALTER TABLE public.competition_results
  ALTER COLUMN athlete_id DROP NOT NULL;

ALTER TABLE public.competition_results
  ADD COLUMN IF NOT EXISTS external_athlete_id uuid
    REFERENCES public.external_athletes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS race_event_id        uuid
    REFERENCES public.race_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS result_import_id     uuid
    REFERENCES public.result_imports(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bib_number           text,
  ADD COLUMN IF NOT EXISTS time_diff_seconds    numeric(10,3),
  ADD COLUMN IF NOT EXISTS status               result_status NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz NOT NULL DEFAULT now();

-- Constraint: debe tener exactamente uno de athlete_id o external_athlete_id
ALTER TABLE public.competition_results
  ADD CONSTRAINT check_athlete_or_external
    CHECK (
      (athlete_id IS NOT NULL AND external_athlete_id IS NULL)
      OR
      (athlete_id IS NULL AND external_athlete_id IS NOT NULL)
    );

-- Actualizar índices
CREATE INDEX idx_comp_results_external   ON public.competition_results(external_athlete_id);
CREATE INDEX idx_comp_results_race_event ON public.competition_results(race_event_id);
CREATE INDEX idx_comp_results_status     ON public.competition_results(status);
CREATE INDEX idx_comp_results_import     ON public.competition_results(result_import_id);

-- =============================================================
-- 4. RELEVOS
-- =============================================================

CREATE TABLE public.relay_teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES public.competition_events(id) ON DELETE SET NULL,
  race_event_id   uuid REFERENCES public.race_events(id) ON DELETE SET NULL,
  team_name       text,           -- ej: "Club Rionegro A"
  club_name       text NOT NULL,
  category        athlete_category,
  gender          athlete_gender,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.relay_team_members (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relay_team_id        uuid NOT NULL REFERENCES public.relay_teams(id) ON DELETE CASCADE,
  athlete_id           uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  external_athlete_id  uuid REFERENCES public.external_athletes(id) ON DELETE SET NULL,
  leg_order            integer NOT NULL CHECK (leg_order BETWEEN 1 AND 6),
  CONSTRAINT check_relay_member
    CHECK (
      (athlete_id IS NOT NULL AND external_athlete_id IS NULL)
      OR
      (athlete_id IS NULL AND external_athlete_id IS NOT NULL)
    ),
  UNIQUE (relay_team_id, leg_order)
);

CREATE TABLE public.relay_results (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  relay_team_id  uuid          NOT NULL REFERENCES public.relay_teams(id) ON DELETE CASCADE,
  position       integer,
  time_seconds   numeric(10,3),
  time_diff_seconds numeric(10,3),
  points         integer,
  status         result_status NOT NULL DEFAULT 'normal',
  result_import_id uuid        REFERENCES public.result_imports(id) ON DELETE SET NULL,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_relay_teams_competition ON public.relay_teams(competition_id);
CREATE INDEX idx_relay_members_team      ON public.relay_team_members(relay_team_id);
CREATE INDEX idx_relay_members_athlete   ON public.relay_team_members(athlete_id);
CREATE INDEX idx_relay_results_team      ON public.relay_results(relay_team_id);

ALTER TABLE public.relay_teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_results      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view relay teams" ON public.relay_teams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages relay teams" ON public.relay_teams
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

CREATE POLICY "Authenticated view relay members" ON public.relay_team_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages relay members" ON public.relay_team_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

CREATE POLICY "Authenticated view relay results" ON public.relay_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages relay results" ON public.relay_results
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

-- =============================================================
-- 5. TABLAS DE PUNTOS (configurables por admin)
-- =============================================================

CREATE TABLE public.point_tables (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  competition_type competition_type,
  season_year      integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  points_config    jsonb NOT NULL DEFAULT '{}',
  -- Ejemplo: {"1": 34, "2": 21, "3": 13, "4": 8, "5": 5, "6": 3, "7": 2, "8": 1}
  is_active        boolean NOT NULL DEFAULT true,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, season_year)
);

-- Tabla de puntos estándar de Fedepatin/World Skate
INSERT INTO public.point_tables (name, season_year, points_config, is_active) VALUES
  ('Estándar WS 2025', 2025,
   '{"1":34,"2":21,"3":13,"4":8,"5":5,"6":3,"7":2,"8":1}',
   true),
  ('Liga Bogotá 2025', 2025,
   '{"1":40,"2":30,"3":20,"4":15,"5":10,"6":7,"7":5,"8":3,"9":2,"10":1}',
   true)
ON CONFLICT (name, season_year) DO NOTHING;

ALTER TABLE public.point_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view point tables" ON public.point_tables
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages point tables" ON public.point_tables
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================================
-- 6. LIGAS Y ESCALAFÓN
-- =============================================================

CREATE TABLE public.leagues (
  id          uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text            NOT NULL,
  organizer   text            NOT NULL DEFAULT 'Liga Bogotá',
  season_year integer         NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  categories  athlete_category[] NOT NULL DEFAULT '{}',
  point_table_id uuid         REFERENCES public.point_tables(id) ON DELETE SET NULL,
  start_date  date,
  end_date    date,
  is_active   boolean         NOT NULL DEFAULT true,
  created_by  uuid            REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz     NOT NULL DEFAULT now(),
  UNIQUE (name, season_year)
);

CREATE TABLE public.league_stages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id      uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  stage_number   integer NOT NULL,
  stage_name     text,
  weight_factor  numeric(4,2) NOT NULL DEFAULT 1.0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, competition_id),
  UNIQUE (league_id, stage_number)
);

CREATE TABLE public.league_standings (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id            uuid          NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  athlete_id           uuid          REFERENCES public.athletes(id) ON DELETE CASCADE,
  external_athlete_id  uuid          REFERENCES public.external_athletes(id) ON DELETE CASCADE,
  category             athlete_category NOT NULL,
  gender               athlete_gender,
  total_points         numeric(10,2) NOT NULL DEFAULT 0,
  position             integer,
  races_count          integer       NOT NULL DEFAULT 0,
  best_time_seconds    numeric(10,3),
  updated_at           timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT check_standing_athlete
    CHECK (
      (athlete_id IS NOT NULL AND external_athlete_id IS NULL)
      OR
      (athlete_id IS NULL AND external_athlete_id IS NOT NULL)
    ),
  UNIQUE (league_id, athlete_id),
  UNIQUE (league_id, external_athlete_id)
);

CREATE INDEX idx_league_stages_league       ON public.league_stages(league_id);
CREATE INDEX idx_league_stages_competition  ON public.league_stages(competition_id);
CREATE INDEX idx_league_standings_league    ON public.league_standings(league_id);
CREATE INDEX idx_league_standings_athlete   ON public.league_standings(athlete_id);
CREATE INDEX idx_league_standings_points    ON public.league_standings(total_points DESC);

ALTER TABLE public.leagues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_stages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view leagues" ON public.leagues
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages leagues" ON public.leagues
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Authenticated view league stages" ON public.league_stages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages league stages" ON public.league_stages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

CREATE POLICY "Authenticated view standings" ON public.league_standings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages standings" ON public.league_standings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

-- =============================================================
-- 7. RESOLUCIONES Y ACTAS OFICIALES
-- =============================================================

CREATE TYPE public.resolution_type AS ENUM (
  'resultado',    -- resultados oficiales
  'sancion',      -- sanciones a atletas o clubes
  'protesta',     -- resolución de protesta
  'acta',         -- acta de la competencia
  'inscripcion',  -- lista oficial de inscritos
  'otro'
);

CREATE TABLE public.competition_resolutions (
  id               uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id   uuid            NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  document_url     text            NOT NULL,
  resolution_number text,
  resolution_type  resolution_type NOT NULL DEFAULT 'resultado',
  issued_by        text,
  issued_at        date,
  notes            text,
  uploaded_by      uuid            REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX idx_resolutions_competition ON public.competition_resolutions(competition_id);
CREATE INDEX idx_resolutions_type        ON public.competition_resolutions(resolution_type);

ALTER TABLE public.competition_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view resolutions" ON public.competition_resolutions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages resolutions" ON public.competition_resolutions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'delegate'));

-- =============================================================
-- 8. FUNCIÓN UTILITARIA — Recalcular posición en league_standings
-- =============================================================

CREATE OR REPLACE FUNCTION public.recalculate_league_positions(p_league_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY category, gender
        ORDER BY total_points DESC, races_count DESC
      ) AS new_position
    FROM public.league_standings
    WHERE league_id = p_league_id
  )
  UPDATE public.league_standings ls
  SET position = ranked.new_position,
      updated_at = now()
  FROM ranked
  WHERE ls.id = ranked.id;
END;
$$;

-- =============================================================
-- 9. FUNCIÓN — Obtener puntos por posición de una tabla configurada
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_points_for_position(
  p_point_table_id uuid,
  p_position       integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_points integer;
BEGIN
  SELECT (points_config ->> p_position::text)::integer
  INTO v_points
  FROM public.point_tables
  WHERE id = p_point_table_id AND is_active = true;

  RETURN COALESCE(v_points, 0);
END;
$$;
