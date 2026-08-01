-- Migration: 20260730200000_parent_role.sql
-- Adds 'parent' role with parent_athletes linking table and RLS

-- 1. Extend ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'parent';

-- 2. Linking table: one parent can have multiple children
CREATE TABLE IF NOT EXISTS public.parent_athletes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id      uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_athletes_parent ON public.parent_athletes(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_athletes_athlete ON public.parent_athletes(athlete_id);

-- 3. RLS on parent_athletes
ALTER TABLE public.parent_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parent views own links" ON public.parent_athletes
  FOR SELECT USING (parent_user_id = auth.uid());

CREATE POLICY "Staff manages parent links" ON public.parent_athletes
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- 4. Parents can view their linked athletes
CREATE POLICY "Parent views linked athlete" ON public.athletes
  FOR SELECT USING (
    id IN (
      SELECT athlete_id FROM public.parent_athletes
      WHERE parent_user_id = auth.uid()
    )
  );

-- 5. Parents can view attendance of their linked athletes
CREATE POLICY "Parent views child attendance" ON public.attendance
  FOR SELECT USING (
    athlete_id IN (
      SELECT athlete_id FROM public.parent_athletes
      WHERE parent_user_id = auth.uid()
    )
  );

-- 6. Parents can view transactions (payments) of their linked athletes
CREATE POLICY "Parent views child transactions" ON public.transactions
  FOR SELECT USING (
    athlete_id IN (
      SELECT athlete_id FROM public.parent_athletes
      WHERE parent_user_id = auth.uid()
    )
  );

-- 7. Update handle_new_user to allow 'parent' role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_role        user_role;
  v_birth_date  date;
  v_age         integer;
  v_category    athlete_category;
  v_level       athlete_level;
  v_gender      athlete_gender;
  v_admin_count integer;
BEGIN
  SELECT COUNT(*) INTO v_admin_count
  FROM public.user_roles WHERE role = 'admin';

  IF v_admin_count = 0 THEN
    v_role := 'admin';
  ELSE
    v_role := CASE
      WHEN (NEW.raw_user_meta_data ->> 'role') IN ('leader', 'coach', 'delegate', 'finance', 'athlete', 'parent')
        THEN (NEW.raw_user_meta_data ->> 'role')::user_role
      ELSE 'athlete'::user_role
    END;
  END IF;

  v_birth_date := CASE
    WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
    ELSE NULL
  END;

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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create athlete record only when role is athlete
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
