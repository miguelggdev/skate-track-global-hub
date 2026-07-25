-- Fix security issues with existing function by setting proper search_path
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