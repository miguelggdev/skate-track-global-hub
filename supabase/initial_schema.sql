-- =============================================================
-- INITIAL SCHEMA — SpeedSkateTrack
-- =============================================================

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE public.user_role AS ENUM (
  'admin', 'leader', 'coach', 'delegate', 'finance', 'athlete'
);

CREATE TYPE public.athlete_category AS ENUM (
  'escuela', 'menores', 'transicion', 'prejuvenil', 'juvenil', 'mayores'
);

CREATE TYPE public.athlete_level AS ENUM (
  'escuela',
  'escuela_menores',
  'transicion',
  'pre_juvenil',
  'juvenil_primer_ano',
  'juvenil_segundo_ano',
  'juvenil_tercer_ano',
  'mayores',
  'mayores_unica'
);

CREATE TYPE public.athlete_gender AS ENUM ('masculino', 'femenino');

CREATE TYPE public.athlete_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TYPE public.transaction_type AS ENUM (
  'mensualidad', 'poliza_deportiva', 'anualidad', 'psicologia', 'otro'
);

CREATE TYPE public.transaction_status AS ENUM (
  'pending', 'paid', 'overdue', 'cancelled'
);

-- =============================================================
-- TABLES
-- =============================================================

-- User profiles (linked 1:1 to auth.users)
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  first_name    text NOT NULL DEFAULT '',
  last_name     text NOT NULL DEFAULT '',
  date_of_birth date,
  avatar_url    text,
  phone         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- User roles (one user can have multiple roles)
CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Athletes
CREATE TABLE public.athletes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  email             text,
  date_of_birth     date,
  gender            athlete_gender,
  category          athlete_category NOT NULL DEFAULT 'mayores',
  level             athlete_level NOT NULL DEFAULT 'mayores_unica',
  status            athlete_status NOT NULL DEFAULT 'active',
  performance_score numeric(5,2) NOT NULL DEFAULT 0,
  photo_url         text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Training sessions
CREATE TABLE public.training_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  coach_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  location         text,
  category         athlete_category,
  max_athletes     integer,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Attendance per session
CREATE TABLE public.attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  athlete_id  uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'present'
              CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes       text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, athlete_id)
);

-- Competitions
CREATE TABLE public.competitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  location     text,
  start_date   date NOT NULL,
  end_date     date,
  category     athlete_category,
  level        athlete_level,
  organized_by text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Competition results
CREATE TABLE public.competition_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  athlete_id     uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  event_name     text NOT NULL,
  position       integer,
  time_seconds   numeric(10,3),
  points         numeric(8,2),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, athlete_id, event_name)
);

-- Financial transactions
CREATE TABLE public.transactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  type       transaction_type NOT NULL,
  status     transaction_status NOT NULL DEFAULT 'pending',
  amount     numeric(10,2) NOT NULL,
  due_date   date,
  paid_at    timestamptz,
  notes      text,
  receipt_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Awards
CREATE TABLE public.awards (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id     uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  award_date     date NOT NULL DEFAULT CURRENT_DATE,
  medal_type     text CHECK (medal_type IN ('gold', 'silver', 'bronze', 'special')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  message    text NOT NULL,
  type       text NOT NULL DEFAULT 'info'
             CHECK (type IN ('info', 'warning', 'success', 'error')),
  read       boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Club settings (single row)
CREATE TABLE public.club_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name       text NOT NULL DEFAULT 'Club de Patinaje',
  logo_url        text,
  primary_color   text DEFAULT '#1a1a2e',
  secondary_color text DEFAULT '#16213e',
  contact_email   text,
  contact_phone   text,
  address         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_user_roles_user_id          ON public.user_roles(user_id);
CREATE INDEX idx_athletes_user_id            ON public.athletes(user_id);
CREATE INDEX idx_athletes_category_status    ON public.athletes(category, status);
CREATE INDEX idx_training_sessions_date      ON public.training_sessions(scheduled_at);
CREATE INDEX idx_attendance_session          ON public.attendance(session_id);
CREATE INDEX idx_attendance_athlete          ON public.attendance(athlete_id);
CREATE INDEX idx_comp_results_competition    ON public.competition_results(competition_id);
CREATE INDEX idx_comp_results_athlete        ON public.competition_results(athlete_id);
CREATE INDEX idx_transactions_athlete        ON public.transactions(athlete_id);
CREATE INDEX idx_transactions_status         ON public.transactions(status);
CREATE INDEX idx_notifications_user_read     ON public.notifications(user_id, read);

-- =============================================================
-- SECURITY FUNCTIONS
-- =============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin'    THEN 1
    WHEN 'leader'   THEN 2
    WHEN 'coach'    THEN 3
    WHEN 'delegate' THEN 4
    WHEN 'finance'  THEN 5
    WHEN 'athlete'  THEN 6
  END
  LIMIT 1
$$;

-- Helper to auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Trigger function: auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_role       user_role;
  v_birth_date date;
  v_age        integer;
  v_category   athlete_category;
  v_level      athlete_level;
  v_gender     athlete_gender;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    'athlete'::user_role
  );

  v_birth_date := CASE
    WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
    ELSE NULL
  END;

  -- Create profile
  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    v_birth_date
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    first_name    = EXCLUDED.first_name,
    last_name     = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    updated_at    = now();

  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create athlete record when role is athlete
  IF v_role = 'athlete' THEN
    IF v_birth_date IS NOT NULL THEN
      v_age := EXTRACT(YEAR FROM AGE(v_birth_date))::integer;
      v_category := CASE
        WHEN v_age <= 6  THEN 'escuela'
        WHEN v_age <= 8  THEN 'menores'
        WHEN v_age <= 10 THEN 'transicion'
        WHEN v_age <= 12 THEN 'prejuvenil'
        WHEN v_age <= 17 THEN 'juvenil'
        ELSE 'mayores'
      END::athlete_category;
      v_level := CASE
        WHEN v_age <= 6  THEN 'escuela'
        WHEN v_age <= 8  THEN 'escuela_menores'
        WHEN v_age <= 10 THEN 'transicion'
        WHEN v_age <= 12 THEN 'pre_juvenil'
        WHEN v_age <= 14 THEN 'juvenil_primer_ano'
        WHEN v_age <= 16 THEN 'juvenil_segundo_ano'
        WHEN v_age <= 17 THEN 'juvenil_tercer_ano'
        ELSE 'mayores_unica'
      END::athlete_level;
    ELSE
      v_category := 'mayores';
      v_level    := 'mayores_unica';
    END IF;

    BEGIN
      v_gender := (NEW.raw_user_meta_data ->> 'gender')::athlete_gender;
    EXCEPTION WHEN others THEN
      v_gender := NULL;
    END;

    INSERT INTO public.athletes (
      user_id, first_name, last_name, email,
      date_of_birth, gender, category, level, status, performance_score
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email,
      v_birth_date, v_gender, v_category, v_level, 'active', 0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      first_name    = EXCLUDED.first_name,
      last_name     = EXCLUDED.last_name,
      email         = EXCLUDED.email,
      date_of_birth = EXCLUDED.date_of_birth,
      gender        = EXCLUDED.gender,
      category      = EXCLUDED.category,
      level         = EXCLUDED.level,
      updated_at    = now();
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE LOG 'handle_new_user error for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- =============================================================
-- TRIGGERS
-- =============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_club_settings_updated_at
  BEFORE UPDATE ON public.club_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_settings     ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Own profile full access" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- user_roles
CREATE POLICY "View own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- athletes
CREATE POLICY "Athlete views own record" ON public.athletes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Staff views all athletes" ON public.athletes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));

CREATE POLICY "Staff manages athletes" ON public.athletes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
              has_role(auth.uid(), 'leader'));

-- training_sessions
CREATE POLICY "Authenticated view sessions" ON public.training_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manages sessions" ON public.training_sessions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
              has_role(auth.uid(), 'leader'));

-- attendance
CREATE POLICY "Athlete views own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff manages attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
              has_role(auth.uid(), 'leader'));

-- competitions
CREATE POLICY "Authenticated view competitions" ON public.competitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manages competitions" ON public.competitions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR
         has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR
              has_role(auth.uid(), 'delegate'));

-- competition_results
CREATE POLICY "Authenticated view results" ON public.competition_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manages results" ON public.competition_results
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
              has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'delegate'));

-- transactions
CREATE POLICY "Athlete views own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Finance manages transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR
         has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR
              has_role(auth.uid(), 'leader'));

-- awards
CREATE POLICY "Authenticated view awards" ON public.awards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manages awards" ON public.awards
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
         has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
              has_role(auth.uid(), 'leader'));

-- notifications
CREATE POLICY "View own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff sends notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') OR
              has_role(auth.uid(), 'leader'));

-- club_settings
CREATE POLICY "Authenticated view club settings" ON public.club_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage club settings" ON public.club_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));
