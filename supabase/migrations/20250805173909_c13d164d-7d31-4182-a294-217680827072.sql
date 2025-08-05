-- Fix typo in update_attendance_kpis function 
CREATE OR REPLACE FUNCTION public.update_attendance_kpis()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;