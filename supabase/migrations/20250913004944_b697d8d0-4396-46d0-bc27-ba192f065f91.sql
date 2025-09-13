-- Fix remaining database functions with proper search_path
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

CREATE OR REPLACE FUNCTION public.send_notification_to_athletes(sender_id_param uuid, title_param text, message_param text, notification_type_param text DEFAULT 'general'::text, related_entity_id_param uuid DEFAULT NULL::uuid, related_entity_type_param text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_count INTEGER := 0;
  athlete_id UUID;
BEGIN
  -- Check if sender has permission to send notifications
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = sender_id_param 
    AND role IN ('admin', 'coach', 'leader')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only coaches, admins and leaders can send notifications';
  END IF;

  -- Insert notification for each athlete
  FOR athlete_id IN 
    SELECT a.user_id 
    FROM athletes a 
    WHERE a.user_id IS NOT NULL
      AND a.status = 'active'
  LOOP
    INSERT INTO public.notifications (
      sender_id,
      recipient_id,
      title,
      message,
      notification_type,
      related_entity_id,
      related_entity_type
    ) VALUES (
      sender_id_param,
      athlete_id,
      title_param,
      message_param,
      notification_type_param,
      related_entity_id_param,
      related_entity_type_param
    );
    
    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the profile if it exists or create it if it doesn't
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'athlete')::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;
  
  RETURN NEW;
END;
$function$;