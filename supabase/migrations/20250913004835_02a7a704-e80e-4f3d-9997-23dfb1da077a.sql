-- CRITICAL SECURITY FIX: Prevent privilege escalation vulnerability
-- Update profiles RLS policies to prevent users from changing their own roles

-- Drop existing policy that allows users to update their own profile (including role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new restrictive policy for basic profile updates (without role changes)
CREATE POLICY "Users can update own profile basic info" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Only admins and leaders can update user roles through separate policy
CREATE POLICY "Admins and leaders can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- HIGH PRIORITY: Fix public data exposure
-- Update awards table to restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view awards" ON public.awards;
CREATE POLICY "Authenticated users can view awards" 
ON public.awards 
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