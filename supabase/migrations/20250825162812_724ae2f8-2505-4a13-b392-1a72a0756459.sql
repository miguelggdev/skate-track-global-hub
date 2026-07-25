-- Fix the last function security issue
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