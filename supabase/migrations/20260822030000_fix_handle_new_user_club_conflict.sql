-- =============================================================
-- Fix urgente: handle_new_user() (versión vigente, de
-- 20260805200000_audit_round2_fixes.sql) hace
--   INSERT INTO public.user_roles (user_id, role) ... ON CONFLICT (user_id, role)
-- pero 20260822000000_multitenant_foundation.sql eliminó esa constraint
-- única y la reemplazó por (user_id, club_id, role). Como el ON CONFLICT
-- ya no coincide con ninguna constraint existente, TODO registro de
-- usuario nuevo falla con:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--
-- Se reproduce la función completa (CREATE OR REPLACE reemplaza el
-- cuerpo entero) cambiando solo la cláusula ON CONFLICT. club_id no se
-- manda explícito en el INSERT — toma el DEFAULT public.default_club_id()
-- agregado en 20260822020000_user_roles_club_id_default.sql.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role        user_role;
  v_birth_date  date;
  v_age         integer;
  v_category    athlete_category;
  v_level       athlete_level;
  v_gender      athlete_gender;
  v_admin_count integer;
  v_requested   text;
  v_first_name  text;
  v_last_name   text;
  v_full_name   text;
BEGIN
  -- Resolve first_name / last_name from meta (supports both split and
  -- legacy full_name formats sent by external OAuth providers).
  v_first_name := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ' ', 1),
    ''
  );
  v_last_name := COALESCE(
    NEW.raw_user_meta_data ->> 'last_name',
    CASE
      WHEN (NEW.raw_user_meta_data ->> 'full_name') IS NOT NULL
           AND position(' ' IN (NEW.raw_user_meta_data ->> 'full_name')) > 0
      THEN substring(
             NEW.raw_user_meta_data ->> 'full_name'
             FROM position(' ' IN (NEW.raw_user_meta_data ->> 'full_name')) + 1
           )
      ELSE ''
    END,
    ''
  );

  -- Determine role (first user becomes admin; privileged roles require elevation)
  SELECT COUNT(*) INTO v_admin_count
  FROM public.user_roles WHERE role = 'admin';

  IF v_admin_count = 0 THEN
    v_role := 'admin';
  ELSE
    v_requested := NEW.raw_user_meta_data ->> 'role';
    v_role := CASE
      WHEN v_requested IN ('athlete', 'parent') THEN v_requested::user_role
      ELSE 'athlete'::user_role
    END;
  END IF;

  -- Resolve date_of_birth
  v_birth_date := CASE
    WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
    ELSE NULL
  END;

  -- Upsert into profiles using correct columns (no full_name, no avatar_url)
  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_birth_date
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    first_name    = EXCLUDED.first_name,
    last_name     = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    updated_at    = now();

  -- FIX: ON CONFLICT actualizado a (user_id, club_id, role) — la
  -- constraint vigente desde la Fase 0 del plan multi-tenant. club_id
  -- toma el DEFAULT (club actual) al no venir en la lista de columnas.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, club_id, role) DO NOTHING;

  -- Auto-create athlete record for 'athlete' role
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
      v_first_name,
      v_last_name,
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
EXCEPTION
  WHEN unique_violation THEN
    -- Expected conflict (ON CONFLICT handles it, but belt-and-suspenders)
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;
