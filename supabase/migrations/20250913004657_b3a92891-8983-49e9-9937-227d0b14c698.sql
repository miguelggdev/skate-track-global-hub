-- CRITICAL SECURITY FIX: Prevent privilege escalation vulnerability
-- Update profiles RLS policies to prevent users from changing their own roles

-- Drop existing policy that allows users to update their own profile (including role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new restrictive policies
CREATE POLICY "Users can update own profile basic info" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent role changes - role must remain the same
  OLD.role = NEW.role
);

-- Only admins and leaders can update user roles
CREATE POLICY "Admins and leaders can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- HIGH PRIORITY: Fix public data exposure
-- Update awards table to restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view awards" ON public.awards;
CREATE POLICY "Authenticated users can view awards" 
ON public.awards 
FOR SELECT 
TO authenticated
USING (true);

-- Update competitions table to allow limited public access
DROP POLICY IF EXISTS "Anyone can view competitions" ON public.competitions;
CREATE POLICY "Public can view basic competition info" 
ON public.competitions 
FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Authenticated users can view all competition details" 
ON public.competitions 
FOR SELECT 
TO authenticated
USING (true);

-- Update training sessions to restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view training sessions" ON public.training_sessions;
CREATE POLICY "Authenticated users can view training sessions" 
ON public.training_sessions 
FOR SELECT 
TO authenticated
USING (true);

-- MEDIUM PRIORITY: Fix database function security
-- Update existing functions to include proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_training_duration(start_time time without time zone, end_time time without time zone)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_training_week_start_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.week_start_date := (date_trunc('week', NEW."date"::timestamp)::date);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_edit_time_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow admins to edit anytime
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Check 48-hour limit for others
  IF TG_OP = 'UPDATE' AND OLD.created_at < (now() - INTERVAL '48 hours') THEN
    RAISE EXCEPTION 'Cannot edit attendance records older than 48 hours';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_attendance_kpis()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  athlete_record RECORD;
  kpi_month DATE;
BEGIN
  -- Determine which athlete and month to update
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    kpi_month := DATE_TRUNC('month', 
      (SELECT date FROM training_sessions WHERE id = NEW.training_session_id)
    );
    
    -- Update KPIs for the athlete
    INSERT INTO training_kpis (athlete_id, month, total_hours, attendance_percentage)
    SELECT 
      NEW.athlete_id,
      kpi_month,
      COALESCE(SUM(calculate_training_duration(ts.start_time, ts.end_time)), 0),
      CASE 
        WHEN COUNT(ta.id) > 0 THEN 
          (COUNT(CASE WHEN ta.attended THEN 1 END) * 100.0 / COUNT(ta.id))
        ELSE 0 
      END
    FROM training_attendance ta
    JOIN training_sessions ts ON ta.training_session_id = ts.id
    WHERE ta.athlete_id = NEW.athlete_id
      AND DATE_TRUNC('month', ts.date) = kpi_month
    ON CONFLICT (athlete_id, month) 
    DO UPDATE SET
      total_hours = EXCLUDED.total_hours,
      attendance_percentage = EXCLUDED.attendance_percentage,
      updated_at = now();
      
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;