-- Update the handle_new_user function to create athlete records for users with athlete role
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role_value text;
  birth_date date;
  user_age integer;
  user_category athlete_category;
  user_level athlete_level;
BEGIN
  -- Get the role from metadata, default to 'athlete' if not provided  
  user_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'athlete');
  
  -- Ensure the role value is valid
  IF user_role_value NOT IN ('admin', 'coach', 'athlete', 'delegate', 'leader', 'finance') THEN
    user_role_value := 'athlete';
  END IF;

  -- Insert into profiles with SECURITY DEFINER context (bypasses RLS)
  INSERT INTO public.profiles (id, email, first_name, last_name, role, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    user_role_value::user_role,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    date_of_birth = EXCLUDED.date_of_birth;

  -- If the user is an athlete, create an athlete record
  IF user_role_value = 'athlete' THEN
    -- Get date of birth and calculate age/category/level
    birth_date := CASE 
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END;
    
    -- Calculate age if birth date is provided
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
    
    -- Insert athlete record
    INSERT INTO public.athletes (
      user_id,
      first_name,
      last_name,
      email,
      date_of_birth,
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