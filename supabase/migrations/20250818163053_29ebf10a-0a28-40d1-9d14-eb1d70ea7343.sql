-- Fix the role system to prevent infinite recursion and implement proper user roles

-- 1. Create the user_roles table using the existing user_role enum
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- 2. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create security definer function to get user role (prevents recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'leader' THEN 2
      WHEN 'coach' THEN 3
      WHEN 'delegate' THEN 4
      WHEN 'finance' THEN 5
      WHEN 'athlete' THEN 6
    END
  LIMIT 1
$$;

-- 5. Migrate existing roles from profiles to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role
FROM public.profiles p
WHERE p.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Update profiles table to remove role column and simplify RLS
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 7. Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view profiles for management" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 8. Create simple, non-recursive policies for profiles
CREATE POLICY "Users can manage own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'coach') OR
  public.has_role(auth.uid(), 'leader') OR
  public.has_role(auth.uid(), 'delegate')
);

-- 9. Create policies for user_roles table
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. Update other table policies to use the new role system
-- Athletes table
DROP POLICY IF EXISTS "Coaches and admins can manage athletes" ON public.athletes;
DROP POLICY IF EXISTS "Staff can view all athletes" ON public.athletes;

CREATE POLICY "Admins and coaches can manage athletes"
ON public.athletes
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'coach') OR
  public.has_role(auth.uid(), 'leader')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'coach') OR
  public.has_role(auth.uid(), 'leader')
);

CREATE POLICY "Staff can view athletes"
ON public.athletes
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'coach') OR
  public.has_role(auth.uid(), 'leader') OR
  public.has_role(auth.uid(), 'delegate')
);

-- 11. Update club_settings policies
DROP POLICY IF EXISTS "Admins can create club settings" ON public.club_settings;
DROP POLICY IF EXISTS "Admins can update club settings" ON public.club_settings;
DROP POLICY IF EXISTS "Admins can view club settings" ON public.club_settings;

CREATE POLICY "Admins can manage club settings"
ON public.club_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'leader'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'leader'));

-- 12. Update handle_new_user function to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role_value user_role;
  birth_date date;
  user_age integer;
  user_category athlete_category;
  user_level athlete_level;
BEGIN
  -- Get the role from metadata, default to 'athlete' if not provided  
  user_role_value := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'athlete'::user_role);

  -- Insert into profiles with SECURITY DEFINER context (bypasses RLS)
  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
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
    date_of_birth = EXCLUDED.date_of_birth;

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