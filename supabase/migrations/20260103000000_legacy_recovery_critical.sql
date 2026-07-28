-- =============================================================
-- RECUPERACIÓN LEGACY — Tablas críticas extraídas de las 124
-- migraciones de Lovable, reescritas de forma limpia y correcta.
-- =============================================================

-- =============================================================
-- 1. SYSTEM SETTINGS — Configuración clave-valor del sistema
-- =============================================================

CREATE TABLE public.system_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   text NOT NULL UNIQUE,
  setting_value text,
  setting_type  text NOT NULL DEFAULT 'string'
                CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description   text,
  category      text NOT NULL DEFAULT 'general'
                CHECK (category IN ('general', 'payments', 'training', 'competitions', 'notifications', 'security')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category) VALUES
  ('max_athletes_per_coach',       '20',   'number',  'Máximo de atletas por entrenador',                'training'),
  ('session_duration_default',     '90',   'number',  'Duración por defecto de sesión (minutos)',        'training'),
  ('advance_payment_required',     'false','boolean', 'Requiere pago anticipado para inscripciones',    'payments'),
  ('payment_reminder_days',        '7',    'number',  'Días antes de vencimiento para recordatorio',    'payments'),
  ('overdue_threshold_days',       '30',   'number',  'Días de gracia antes de marcar como moroso',     'payments'),
  ('min_attendance_percentage',    '75',   'number',  'Asistencia mínima % para inscribir a competencia','competitions'),
  ('notifications_email_enabled',  'true', 'boolean', 'Enviar notificaciones por email',                'notifications'),
  ('notifications_sms_enabled',    'false','boolean', 'Enviar notificaciones por SMS',                  'notifications'),
  ('max_gallery_photos',           '5',    'number',  'Máximo de fotos en galería de atleta',           'general'),
  ('club_country',                 'Colombia','string','País del club',                                  'general'),
  ('club_city',                    '',     'string',  'Ciudad del club',                                'general'),
  ('federation_name',              'Fedepatin','string','Nombre de la federación',                       'general')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================
-- 2. COACHES — Entrenadores con licencia y especialización
-- =============================================================

CREATE TABLE public.coaches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number      text,
  certification_level text,
  specialization      text,
  years_experience    integer NOT NULL DEFAULT 0,
  bio                 text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Relación M:M entrenador ↔ atleta
CREATE TABLE public.coach_athletes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  athlete_id   uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  is_primary   boolean NOT NULL DEFAULT true,   -- entrenador principal vs asistente
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);

CREATE INDEX idx_coach_athletes_coach   ON public.coach_athletes(coach_id);
CREATE INDEX idx_coach_athletes_athlete ON public.coach_athletes(athlete_id);

-- =============================================================
-- 3. COMPETITION_EVENTS — Eventos dentro de una competencia
-- (ej: "500m CRI Juvenil Femenino", "3000m Fondo Mayores")
-- =============================================================

ALTER TYPE public.competition_type ADD VALUE IF NOT EXISTS 'regional';

CREATE TABLE public.competition_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  race_event_id   uuid REFERENCES public.race_events(id) ON DELETE SET NULL,
  event_name      text NOT NULL,
  category        athlete_category,
  gender          athlete_gender,
  scheduled_at    timestamptz,
  location        text,
  max_athletes    integer,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comp_events_competition ON public.competition_events(competition_id);

-- =============================================================
-- 4. COMPETITION_REGISTRATIONS — Inscripciones a eventos
-- =============================================================

CREATE TABLE public.competition_registrations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id   uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  event_id         uuid REFERENCES public.competition_events(id) ON DELETE SET NULL,
  athlete_id       uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  registered_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  registration_date timestamptz NOT NULL DEFAULT now(),
  payment_status   transaction_status NOT NULL DEFAULT 'pending',
  notes            text,
  UNIQUE (competition_id, event_id, athlete_id)
);

CREATE INDEX idx_comp_reg_competition ON public.competition_registrations(competition_id);
CREATE INDEX idx_comp_reg_athlete     ON public.competition_registrations(athlete_id);

-- =============================================================
-- 5. MEDICAL_SESSIONS — Sesiones médicas y lesiones
-- =============================================================

CREATE TABLE public.medical_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  session_type  text NOT NULL CHECK (session_type IN ('lesion', 'control', 'psicologia', 'nutricion', 'fisioterapia', 'otro')),
  session_date  date NOT NULL DEFAULT CURRENT_DATE,
  provider_name text,
  diagnosis     text,
  treatment     text,
  notes         text,
  follow_up_date date,
  status        text NOT NULL DEFAULT 'completed' CHECK (status IN ('active', 'completed', 'follow_up')),
  recorded_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_sessions_athlete ON public.medical_sessions(athlete_id);

-- =============================================================
-- 6. ATHLETE_BODY_INFO — Datos médicos separados (mejor RLS)
-- =============================================================

CREATE TABLE public.athlete_body_info (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id          uuid UNIQUE NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  weight_kg           numeric(5,2),
  height_cm           numeric(5,2),
  imc                 numeric(5,2) GENERATED ALWAYS AS (
                        CASE WHEN height_cm > 0 THEN
                          weight_kg / ((height_cm / 100.0) * (height_cm / 100.0))
                        ELSE NULL END
                      ) STORED,
  blood_type          text,
  eps                 text,
  accident_insurance  text,
  allergies           text,
  surgeries           text,
  fractures           text,
  physical_limitations text,
  lycra_size          text,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 7. ATHLETE_FAMILY — Datos de familia separados
-- =============================================================

CREATE TABLE public.athlete_family (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id            uuid UNIQUE NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  father_name           text,
  father_phone          text,
  father_email          text,
  mother_name           text,
  mother_phone          text,
  mother_email          text,
  guardian_name         text,
  guardian_relationship text,
  guardian_phone        text,
  guardian_email        text,
  guardian_id_number    text,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 8. ATHLETE_STUDIES — Datos académicos separados
-- =============================================================

CREATE TABLE public.athlete_studies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      uuid UNIQUE NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  education_level study_level,
  current_grade   text,
  school_name     text,
  school_address  text,
  school_phone    text,
  school_email    text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 9. ATHLETE_EQUIPMENT — Equipo personal del atleta
-- =============================================================

CREATE TABLE public.athlete_equipment (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id          uuid UNIQUE NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  boot_brand          text,
  boot_size           text,
  frame_brand         text,
  frame_size          text,
  track_wheel_brand   text,
  track_wheel_diameter integer,
  road_wheel_brand    text,
  road_wheel_diameter integer,
  helmet_brand        text,
  helmet_size         text,
  other_equipment     text,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 10. ATHLETE_HISTORY — Historial deportivo
-- =============================================================

CREATE TABLE public.athlete_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       uuid UNIQUE NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  previous_club    text,
  years_experience integer DEFAULT 0,
  start_date       date,
  league_date      date,
  federation_date  date,
  is_in_league     boolean NOT NULL DEFAULT false,
  is_federated     boolean NOT NULL DEFAULT false,
  federation_number text,
  achievements_text text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 11. ATHLETE_GALLERY — Galería de fotos (máx 5)
-- =============================================================

CREATE TABLE public.athlete_gallery (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  image_url     text NOT NULL,
  caption       text,
  display_order integer NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 5),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, display_order)
);

-- =============================================================
-- 12. ATHLETE_SOCIALS — Redes sociales del atleta
-- =============================================================

CREATE TABLE public.athlete_socials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid UNIQUE NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  instagram  text,
  facebook   text,
  tiktok     text,
  whatsapp   text,
  youtube    text,
  twitter    text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id)
);

-- =============================================================
-- 13. TRAINING_KPIS — KPIs mensuales calculados
-- =============================================================

CREATE TABLE public.training_kpis (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id                   uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_id                     uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
  period_month                 date NOT NULL,          -- primer día del mes
  total_sessions               integer NOT NULL DEFAULT 0,
  sessions_attended            integer NOT NULL DEFAULT 0,
  attendance_percentage        numeric(5,2) NOT NULL DEFAULT 0,
  total_hours                  numeric(6,2) NOT NULL DEFAULT 0,
  total_kilometers             numeric(8,2) NOT NULL DEFAULT 0,
  training_type_distribution   jsonb NOT NULL DEFAULT '{}',
  avg_performance_score        numeric(5,2),
  calculated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, period_month)
);

CREATE INDEX idx_training_kpis_athlete ON public.training_kpis(athlete_id);
CREATE INDEX idx_training_kpis_period  ON public.training_kpis(period_month);

-- =============================================================
-- 14. COLUMNAS FALTANTES en athletes
-- =============================================================

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS short_term_goals   text,
  ADD COLUMN IF NOT EXISTS long_term_goals    text,
  ADD COLUMN IF NOT EXISTS personal_values    text;

-- =============================================================
-- 15. RLS EN TODAS LAS TABLAS NUEVAS
-- =============================================================

ALTER TABLE public.system_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_athletes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_body_info       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_family          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_studies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_equipment       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_gallery         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_socials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_kpis           ENABLE ROW LEVEL SECURITY;

-- system_settings: solo admin/leader lee, solo admin escribe
CREATE POLICY "Staff reads settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Admin manages settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- coaches: autenticados ven, admin/leader gestionan
CREATE POLICY "Authenticated view coaches" ON public.coaches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages coaches" ON public.coaches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- coach_athletes
CREATE POLICY "Authenticated view coach athletes" ON public.coach_athletes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages coach athletes" ON public.coach_athletes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- competition_events
CREATE POLICY "Authenticated view comp events" ON public.competition_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manages comp events" ON public.competition_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));

-- competition_registrations
CREATE POLICY "Athlete views own registrations" ON public.competition_registrations
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff views all registrations" ON public.competition_registrations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));
CREATE POLICY "Staff manages registrations" ON public.competition_registrations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));

-- medical_sessions: atleta ve las suyas, coach/admin gestiona (datos sensibles)
CREATE POLICY "Athlete views own medical" ON public.medical_sessions
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff views medical" ON public.medical_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Staff manages medical" ON public.medical_sessions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- athlete_body_info: datos médicos — atleta ve los suyos, solo admin/coach accede
CREATE POLICY "Athlete views own body info" ON public.athlete_body_info
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff views body info" ON public.athlete_body_info
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Staff manages body info" ON public.athlete_body_info
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- athlete_family: atleta ve los suyos, admin/coach/leader accede
CREATE POLICY "Athlete views own family" ON public.athlete_family
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff manages family" ON public.athlete_family
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- athlete_studies
CREATE POLICY "Athlete views own studies" ON public.athlete_studies
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff manages studies" ON public.athlete_studies
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- athlete_equipment: atleta ve el suyo, coach/admin gestiona
CREATE POLICY "Athlete views own equipment" ON public.athlete_equipment
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff manages athlete equipment" ON public.athlete_equipment
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

-- athlete_history, gallery, socials: atleta ve los suyos, staff gestiona
CREATE POLICY "Athlete views own history" ON public.athlete_history
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff manages history" ON public.athlete_history
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Authenticated view gallery" ON public.athlete_gallery
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manages gallery" ON public.athlete_gallery
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Authenticated view socials" ON public.athlete_socials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Athlete manages own socials" ON public.athlete_socials
  FOR ALL TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()))
  WITH CHECK (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

-- training_kpis: atleta ve los suyos, coach/admin ve todos
CREATE POLICY "Athlete views own kpis" ON public.training_kpis
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
CREATE POLICY "Staff views all kpis" ON public.training_kpis
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));
CREATE POLICY "Staff manages kpis" ON public.training_kpis
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'leader'));
