-- =============================================================
-- EXPANSION COMPLETA DE REQUERIMIENTOS — SpeedSkateTrack
-- Cubre: modelo ER completo, documentos, equipamiento,
--        mensajería, evaluaciones, eventos especiales, carnets
-- =============================================================

-- =============================================================
-- PARTE 1: NUEVOS ENUMS
-- =============================================================

CREATE TYPE public.competition_type AS ENUM (
  'distrital', 'nacional', 'panamericano', 'maraton', 'internacional'
);

CREATE TYPE public.training_type AS ENUM (
  'regular', 'bicicleta', 'cortesia'
);

CREATE TYPE public.race_event_type AS ENUM (
  'contra_reloj', 'corta_distancia', 'medio_fondo', 'fondo',
  'maraton', 'puntos', 'eliminacion', 'combinada', 'relevos'
);

CREATE TYPE public.athlete_specialty AS ENUM ('fondista', 'velocista');

CREATE TYPE public.study_level AS ENUM (
  'primaria', 'secundaria', 'universidad', 'carrera_tecnica'
);

CREATE TYPE public.document_type AS ENUM (
  'certificado_medico', 'poliza_seguro', 'contrato',
  'autorizacion_imagen', 'autorizacion_menor',
  'carta_permiso_colegio', 'carnet_deportista',
  'planilla_inscripcion', 'recibo_pago', 'otro'
);

CREATE TYPE public.equipment_type AS ENUM (
  'patin', 'bicicleta', 'casco', 'chaleco', 'proteccion', 'uniforme', 'otro'
);

CREATE TYPE public.equipment_status AS ENUM (
  'available', 'assigned', 'maintenance', 'retired'
);

CREATE TYPE public.message_status AS ENUM ('sent', 'read', 'archived');

CREATE TYPE public.evaluation_status AS ENUM ('pending', 'completed', 'reviewed');

-- Agregar valores faltantes a ENUMs existentes
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'preclub';
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'adultos';
ALTER TYPE public.transaction_type  ADD VALUE IF NOT EXISTS 'prendas_deportivas';
ALTER TYPE public.transaction_type  ADD VALUE IF NOT EXISTS 'inscripcion_competencia';

-- =============================================================
-- PARTE 2: EXPANDIR TABLA athletes
-- (campos del modelo ER del club: médicos, familia, colegio)
-- =============================================================

ALTER TABLE public.athletes
  -- Identificación
  ADD COLUMN IF NOT EXISTS identification_number  text,
  ADD COLUMN IF NOT EXISTS identification_type    text DEFAULT 'tarjeta_identidad',

  -- Médico
  ADD COLUMN IF NOT EXISTS blood_type             text,
  ADD COLUMN IF NOT EXISTS eps                    text,
  ADD COLUMN IF NOT EXISTS accident_insurance     text,
  ADD COLUMN IF NOT EXISTS weight_kg              numeric(5,2),
  ADD COLUMN IF NOT EXISTS height_cm              numeric(5,2),
  ADD COLUMN IF NOT EXISTS imc                    numeric(5,2),
  ADD COLUMN IF NOT EXISTS allergies              text,
  ADD COLUMN IF NOT EXISTS fractures              text,
  ADD COLUMN IF NOT EXISTS surgeries              text,
  ADD COLUMN IF NOT EXISTS physical_limitations   text,
  ADD COLUMN IF NOT EXISTS lycra_size             text,

  -- Deportivo
  ADD COLUMN IF NOT EXISTS specialty              athlete_specialty,
  ADD COLUMN IF NOT EXISTS coach_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS personal_phone         text,

  -- Colegio
  ADD COLUMN IF NOT EXISTS school_name            text,
  ADD COLUMN IF NOT EXISTS school_grade           text,
  ADD COLUMN IF NOT EXISTS study_level            study_level,

  -- Ubicación
  ADD COLUMN IF NOT EXISTS city_of_birth          text,
  ADD COLUMN IF NOT EXISTS nationality            text DEFAULT 'colombiana',
  ADD COLUMN IF NOT EXISTS country                text DEFAULT 'Colombia',
  ADD COLUMN IF NOT EXISTS neighborhood           text,

  -- Familia (desnormalizado para acceso rápido)
  ADD COLUMN IF NOT EXISTS guardian_name          text,
  ADD COLUMN IF NOT EXISTS guardian_relationship  text DEFAULT 'padre',
  ADD COLUMN IF NOT EXISTS guardian_phone         text,
  ADD COLUMN IF NOT EXISTS guardian_email         text,
  ADD COLUMN IF NOT EXISTS guardian_name_2        text,
  ADD COLUMN IF NOT EXISTS guardian_relationship_2 text DEFAULT 'madre',
  ADD COLUMN IF NOT EXISTS guardian_phone_2       text;

-- Índice para búsqueda por entrenador
CREATE INDEX IF NOT EXISTS idx_athletes_coach_id ON public.athletes(coach_id);

-- =============================================================
-- PARTE 3: EXPANDIR tabla competitions
-- =============================================================

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS competition_type      competition_type NOT NULL DEFAULT 'distrital',
  ADD COLUMN IF NOT EXISTS responsible_coach_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registration_deadline date,
  ADD COLUMN IF NOT EXISTS max_athletes_per_event integer,
  ADD COLUMN IF NOT EXISTS federation_code       text,
  ADD COLUMN IF NOT EXISTS notes                 text;

-- =============================================================
-- PARTE 4: EXPANDIR tabla training_sessions
-- =============================================================

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS training_type    training_type NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS kilometers       numeric(8,2),
  ADD COLUMN IF NOT EXISTS exercises        jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS intensity        text CHECK (intensity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS notes_coach      text;

-- =============================================================
-- PARTE 5: EXPANDIR tabla transactions
-- =============================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payer_name       text,
  ADD COLUMN IF NOT EXISTS receipt_number   text,
  ADD COLUMN IF NOT EXISTS received_by_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS period_month     integer CHECK (period_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS period_year      integer;

-- =============================================================
-- PARTE 6: PRUEBAS (tipos de carrera / eventos)
-- =============================================================

CREATE TABLE public.race_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  event_type  race_event_type NOT NULL,
  distance_m  integer,
  description text,
  category    athlete_category,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Pruebas estándar del patinaje colombiano
INSERT INTO public.race_events (name, event_type, distance_m, description) VALUES
  ('300m Contra Reloj',       'contra_reloj',    300,   'Salida individual contra el tiempo'),
  ('500m Contra Reloj',       'contra_reloj',    500,   'Salida individual contra el tiempo'),
  ('1000m Contra Reloj',      'contra_reloj',    1000,  'Salida individual contra el tiempo'),
  ('Corta Distancia',         'corta_distancia', 200,   'Carrera corta en pelotón'),
  ('500m Medio Fondo',        'medio_fondo',     500,   'Carrera de medio fondo'),
  ('1000m Medio Fondo',       'medio_fondo',     1000,  'Carrera de medio fondo'),
  ('3000m Fondo',             'fondo',           3000,  'Carrera de fondo'),
  ('5000m Fondo',             'fondo',           5000,  'Carrera de fondo'),
  ('10000m Fondo',            'fondo',           10000, 'Carrera de fondo'),
  ('Maratón',                 'maraton',         42195, 'Distancia maratón'),
  ('Carrera por Puntos',      'puntos',          NULL,  'Asignación de puntos por sprint'),
  ('Eliminación',             'eliminacion',     NULL,  'El último es eliminado por vuelta'),
  ('Prueba Combinada',        'combinada',       NULL,  'Combinación de pruebas'),
  ('Relevos por Equipos',     'relevos',         NULL,  'Relevo entre atletas del mismo club')
ON CONFLICT DO NOTHING;

-- =============================================================
-- PARTE 7: TIEMPOS DE PRUEBA (resultados cronometrados)
-- =============================================================

CREATE TABLE public.time_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  race_event_id   uuid NOT NULL REFERENCES public.race_events(id) ON DELETE CASCADE,
  competition_id  uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  session_id      uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  time_ms         integer NOT NULL,               -- tiempo en milisegundos
  time_formatted  text,                           -- "1:23.456" calculado
  position        integer,
  is_personal_best boolean NOT NULL DEFAULT false,
  is_club_record  boolean NOT NULL DEFAULT false,
  conditions      text,                           -- condiciones de pista
  recorded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  notes           text
);

CREATE INDEX idx_time_records_athlete     ON public.time_records(athlete_id);
CREATE INDEX idx_time_records_race_event  ON public.time_records(race_event_id);
CREATE INDEX idx_time_records_competition ON public.time_records(competition_id);

-- Trigger para marcar récord personal automáticamente
CREATE OR REPLACE FUNCTION public.check_personal_best()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_prev_best integer;
BEGIN
  SELECT MIN(time_ms) INTO v_prev_best
  FROM public.time_records
  WHERE athlete_id = NEW.athlete_id AND race_event_id = NEW.race_event_id
    AND id <> NEW.id;
  IF v_prev_best IS NULL OR NEW.time_ms < v_prev_best THEN
    NEW.is_personal_best := true;
    UPDATE public.time_records
    SET is_personal_best = false
    WHERE athlete_id = NEW.athlete_id AND race_event_id = NEW.race_event_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_personal_best
  BEFORE INSERT ON public.time_records
  FOR EACH ROW EXECUTE FUNCTION public.check_personal_best();

-- =============================================================
-- PARTE 8: EQUIPAMIENTO
-- =============================================================

CREATE TABLE public.equipment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  equipment_type  equipment_type NOT NULL,
  brand           text,
  model           text,
  serial_number   text,
  -- Específico para patines
  skate_size      text,
  chassis_size    text,
  wheel_diameter  integer,            -- mm
  -- Estado
  status          equipment_status NOT NULL DEFAULT 'available',
  condition_notes text,
  purchase_date   date,
  purchase_value  numeric(10,2),
  -- Asignación
  assigned_to     uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  assigned_at     timestamptz,
  -- Mantenimiento
  last_maintenance_at date,
  next_maintenance_at date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.equipment_maintenance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  maintenance_type text NOT NULL,         -- 'preventivo', 'correctivo', 'reemplazo_piezas'
  description     text NOT NULL,
  parts_replaced  text,
  cost            numeric(10,2),
  performed_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_maintenance date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipment_assigned_to    ON public.equipment(assigned_to);
CREATE INDEX idx_equipment_maintenance_eq ON public.equipment_maintenance(equipment_id);

-- =============================================================
-- PARTE 9: CLASES DE CORTESÍA
-- =============================================================

CREATE TABLE public.courtesy_classes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date          date NOT NULL DEFAULT CURRENT_DATE,
  person_name         text NOT NULL,
  phone               text,
  email               text,
  address             text,
  age                 integer,
  guardian_name       text,          -- si es menor
  skating_experience_years integer DEFAULT 0,
  responsible_coach_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  outcome             text CHECK (outcome IN ('enrolled', 'pending', 'not_interested', 'no_show')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- PARTE 10: DOCUMENTOS
-- =============================================================

CREATE TABLE public.documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      uuid REFERENCES public.athletes(id) ON DELETE CASCADE,
  competition_id  uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  document_type   document_type NOT NULL,
  title           text NOT NULL,
  file_url        text,
  file_name       text,
  generated_pdf   boolean NOT NULL DEFAULT false,  -- si fue generado por el sistema
  expires_at      date,
  issued_at       date DEFAULT CURRENT_DATE,
  issued_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_signed       boolean NOT NULL DEFAULT false,
  signed_at       timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_athlete    ON public.documents(athlete_id);
CREATE INDEX idx_documents_type       ON public.documents(document_type);
CREATE INDEX idx_documents_expires    ON public.documents(expires_at);

-- =============================================================
-- PARTE 11: PLANTILLAS DE DOCUMENTOS
-- (para generar cartas, carnets, planillas automáticamente)
-- =============================================================

CREATE TABLE public.document_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  document_type document_type NOT NULL,
  template_html text NOT NULL,          -- HTML con placeholders {{nombre}}, etc.
  description   text,
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- PARTE 12: EVALUACIONES DE DEPORTISTAS
-- =============================================================

CREATE TABLE public.evaluations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  evaluation_type text NOT NULL CHECK (evaluation_type IN ('fisica', 'tecnica', 'psicologica', 'nutricional', 'general')),
  status          evaluation_status NOT NULL DEFAULT 'pending',
  -- Métricas físicas en el momento de la evaluación
  weight_kg       numeric(5,2),
  height_cm       numeric(5,2),
  imc             numeric(5,2),
  -- Puntuaciones (1-10)
  technique_score numeric(4,2),
  strength_score  numeric(4,2),
  endurance_score numeric(4,2),
  speed_score     numeric(4,2),
  overall_score   numeric(4,2),
  -- Texto
  strengths       text,
  areas_to_improve text,
  goals           text,
  coach_notes     text,
  athlete_notes   text,    -- autoevaluación del atleta
  next_eval_date  date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluations_athlete ON public.evaluations(athlete_id);
CREATE INDEX idx_evaluations_date    ON public.evaluations(evaluation_date);

-- =============================================================
-- PARTE 13: MENSAJERÍA INTERNA
-- =============================================================

CREATE TABLE public.messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,        -- NULL = broadcast
  to_role       user_role,                                                -- si es para un rol completo
  subject       text NOT NULL,
  body          text NOT NULL,
  status        message_status NOT NULL DEFAULT 'sent',
  read_at       timestamptz,
  parent_id     uuid REFERENCES public.messages(id) ON DELETE SET NULL,  -- para hilos
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_from    ON public.messages(from_user_id);
CREATE INDEX idx_messages_to      ON public.messages(to_user_id);
CREATE INDEX idx_messages_status  ON public.messages(status);

-- =============================================================
-- PARTE 14: EVENTOS ESPECIALES
-- (ceremonias, campamentos, encuentros)
-- =============================================================

CREATE TABLE public.special_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  event_type      text NOT NULL CHECK (event_type IN ('ceremonia', 'campamento', 'encuentro', 'muestra', 'otro')),
  start_date      timestamptz NOT NULL,
  end_date        timestamptz,
  location        text,
  max_participants integer,
  organized_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.special_event_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.special_events(id) ON DELETE CASCADE,
  athlete_id      uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  confirmed       boolean NOT NULL DEFAULT false,
  attended        boolean,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, athlete_id)
);

-- =============================================================
-- PARTE 15: RLS PARA TODAS LAS TABLAS NUEVAS
-- =============================================================

ALTER TABLE public.race_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courtesy_classes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_event_participants ENABLE ROW LEVEL SECURITY;

-- race_events: todos los autenticados pueden ver, solo admin/coach crean
CREATE POLICY "Authenticated view race events" ON public.race_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage race events" ON public.race_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- time_records: atleta ve los suyos, staff ve todos
CREATE POLICY "Athlete views own times" ON public.time_records
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff views all times" ON public.time_records
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));
CREATE POLICY "Staff manages times" ON public.time_records
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- equipment: staff ve y gestiona todo
CREATE POLICY "Staff views equipment" ON public.equipment
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Admin manages equipment" ON public.equipment
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- equipment_maintenance
CREATE POLICY "Staff views maintenance" ON public.equipment_maintenance
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Staff manages maintenance" ON public.equipment_maintenance
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- courtesy_classes: solo staff
CREATE POLICY "Staff manages courtesy classes" ON public.courtesy_classes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- documents: atleta ve los suyos, staff ve todos
CREATE POLICY "Athlete views own docs" ON public.documents
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff views all docs" ON public.documents
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Staff manages docs" ON public.documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- document_templates: todos autenticados ven, solo admin gestiona
CREATE POLICY "Authenticated view templates" ON public.document_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages templates" ON public.document_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- evaluations: atleta ve las suyas, coach ve las de sus atletas, admin ve todo
CREATE POLICY "Athlete views own evaluations" ON public.evaluations
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Coach views athlete evaluations" ON public.evaluations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Coach manages evaluations" ON public.evaluations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- messages: solo ve los que son para ti o los que enviaste
CREATE POLICY "View own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR
         (to_role IS NOT NULL AND has_role(auth.uid(), to_role)));
CREATE POLICY "Send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Update own received messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (to_user_id = auth.uid()) WITH CHECK (to_user_id = auth.uid());

-- special_events: autenticados ven, staff gestiona
CREATE POLICY "Authenticated view events" ON public.special_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manages special events" ON public.special_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Authenticated view event participants" ON public.special_event_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manages event participants" ON public.special_event_participants
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- =============================================================
-- PARTE 16: TRIGGERS updated_at PARA NUEVAS TABLAS
-- =============================================================

CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_special_events_updated_at
  BEFORE UPDATE ON public.special_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
