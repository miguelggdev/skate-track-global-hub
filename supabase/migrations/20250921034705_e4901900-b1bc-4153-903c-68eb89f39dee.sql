-- Fix the update_attendance_kpis trigger function to handle INSERT result properly
CREATE OR REPLACE FUNCTION public.update_attendance_kpis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  kpi_month DATE;
  kpi_result RECORD;
BEGIN
  -- Determine which athlete and month to update
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    kpi_month := DATE_TRUNC('month', 
      (SELECT date FROM training_sessions WHERE id = NEW.training_session_id)
    );
    
    -- Update KPIs for the athlete - capture the result
    SELECT 
      NEW.athlete_id as athlete_id,
      kpi_month as month,
      COALESCE(SUM(calculate_training_duration(ts.start_time, ts.end_time)), 0) as total_hours,
      CASE 
        WHEN COUNT(ta.id) > 0 THEN 
          (COUNT(CASE WHEN ta.attended THEN 1 END) * 100.0 / COUNT(ta.id))
        ELSE 0 
      END as attendance_percentage
    INTO kpi_result
    FROM training_attendance ta
    JOIN training_sessions ts ON ta.training_session_id = ts.id
    WHERE ta.athlete_id = NEW.athlete_id
      AND DATE_TRUNC('month', ts.date) = kpi_month;
    
    -- Insert or update the KPI record
    INSERT INTO training_kpis (athlete_id, month, total_hours, attendance_percentage)
    VALUES (kpi_result.athlete_id, kpi_result.month, kpi_result.total_hours, kpi_result.attendance_percentage)
    ON CONFLICT (athlete_id, month) 
    DO UPDATE SET
      total_hours = EXCLUDED.total_hours,
      attendance_percentage = EXCLUDED.attendance_percentage,
      updated_at = now();
      
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;