-- Fix handle_new_user to avoid enum cast errors and ensure athletes are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role_value user_role;
  birth_date date;
  user_age integer;
  user_category athlete_category;
  user_level athlete_level;
  gender_val athlete_gender;
BEGIN
  -- Get the role from metadata, default to 'athlete' if not provided  
  user_role_value := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'athlete'::user_role);

  -- Insert into profiles with SECURITY DEFINER context (bypasses RLS)
  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END,
    user_role_value
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    role = EXCLUDED.role;

  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_value)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If the user is an athlete, create an athlete record
  IF user_role_value = 'athlete' THEN
    -- Get date of birth from metadata
    birth_date := CASE 
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END;
    
    -- Calculate age, category and level if birth date is provided
    IF birth_date IS NOT NULL THEN
      user_age := EXTRACT(YEAR FROM AGE(birth_date));
      
      -- Calculate category based on age
      user_category := CASE 
        WHEN user_age <= 6 THEN 'escuela'
        WHEN user_age <= 8 THEN 'menores'
        WHEN user_age <= 10 THEN 'transicion'
        WHEN user_age <= 12 THEN 'prejuvenil'
        WHEN user_age <= 17 THEN 'juvenil'
        ELSE 'mayores'
      END;
      
      -- Calculate level based on category and age
      user_level := CASE 
        WHEN user_category = 'escuela' THEN 'escuela'
        WHEN user_category = 'menores' THEN 'escuela_menores'
        WHEN user_category = 'transicion' THEN 'transicion'
        WHEN user_category = 'prejuvenil' THEN 'pre_juvenil'
        WHEN user_category = 'juvenil' AND user_age <= 14 THEN 'juvenil_primer_ano'
        WHEN user_category = 'juvenil' AND user_age <= 16 THEN 'juvenil_segundo_ano'
        WHEN user_category = 'juvenil' THEN 'juvenil_tercer_ano'
        ELSE 'mayores_unica'
      END;
    ELSE
      -- Default values if no birth date
      user_category := 'mayores';
      user_level := 'mayores_unica';
    END IF;

    -- Safely cast gender to enum; if invalid, keep NULL
    gender_val := NULL;
    IF NEW.raw_user_meta_data ->> 'gender' IS NOT NULL THEN
      BEGIN
        gender_val := (NEW.raw_user_meta_data ->> 'gender')::athlete_gender;
      EXCEPTION WHEN others THEN
        gender_val := NULL;
      END;
    END IF;
    
    -- Insert athlete record
    INSERT INTO public.athletes (
      user_id,
      first_name,
      last_name,
      email,
      date_of_birth,
      gender,
      category,
      level,
      status,
      performance_score
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email,
      birth_date,
      gender_val,
      user_category,
      user_level,
      'active',
      0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      date_of_birth = EXCLUDED.date_of_birth,
      gender = EXCLUDED.gender,
      category = EXCLUDED.category,
      level = EXCLUDED.level;
  END IF;
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Backfill: create athletes for existing auth users with role 'athlete' missing in athletes
WITH candidates AS (
  SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data ->> 'first_name', '') AS first_name,
    COALESCE(u.raw_user_meta_data ->> 'last_name', '') AS last_name,
    CASE 
      WHEN u.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
      THEN (u.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END AS birth_date
  FROM auth.users u
  WHERE COALESCE(u.raw_user_meta_data ->> 'role', 'athlete')::user_role = 'athlete'
), with_age AS (
  SELECT
    c.*,
    CASE WHEN c.birth_date IS NOT NULL THEN EXTRACT(YEAR FROM AGE(c.birth_date))::int ELSE NULL END AS user_age
  FROM candidates c
), with_cat AS (
  SELECT
    wa.*,
    CASE 
      WHEN wa.user_age IS NULL THEN 'mayores'::athlete_category
      WHEN wa.user_age <= 6 THEN 'escuela'::athlete_category
      WHEN wa.user_age <= 8 THEN 'menores'::athlete_category
      WHEN wa.user_age <= 10 THEN 'transicion'::athlete_category
      WHEN wa.user_age <= 12 THEN 'prejuvenil'::athlete_category
      WHEN wa.user_age <= 17 THEN 'juvenil'::athlete_category
      ELSE 'mayores'::athlete_category
    END AS user_category
  FROM with_age wa
), to_insert AS (
  SELECT
    wc.*,
    CASE 
      WHEN wc.user_category = 'escuela' THEN 'escuela'::athlete_level
      WHEN wc.user_category = 'menores' THEN 'escuela_menores'::athlete_level
      WHEN wc.user_category = 'transicion' THEN 'transicion'::athlete_level
      WHEN wc.user_category = 'prejuvenil' THEN 'pre_juvenil'::athlete_level
      WHEN wc.user_category = 'juvenil' AND wc.user_age <= 14 THEN 'juvenil_primer_ano'::athlete_level
      WHEN wc.user_category = 'juvenil' AND wc.user_age <= 16 THEN 'juvenil_segundo_ano'::athlete_level
      WHEN wc.user_category = 'juvenil' THEN 'juvenil_tercer_ano'::athlete_level
      ELSE 'mayores_unica'::athlete_level
    END AS user_level
  FROM with_cat wc
)
INSERT INTO public.athletes (
  user_id, first_name, last_name, email, date_of_birth, gender, category, level, status, performance_score
)
SELECT
  t.id,
  t.first_name,
  t.last_name,
  t.email,
  t.birth_date,
  NULL::athlete_gender,
  t.user_category,
  t.user_level,
  'active'::athlete_status,
  0
FROM to_insert t
LEFT JOIN public.athletes a ON a.user_id = t.id
WHERE a.user_id IS NULL;