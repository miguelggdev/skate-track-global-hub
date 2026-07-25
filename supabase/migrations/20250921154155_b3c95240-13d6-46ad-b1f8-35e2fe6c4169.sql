-- Create unique index for training_attendance to support ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_attendance_session_athlete 
ON training_attendance (training_session_id, athlete_id);

-- Fix register_attendance function to properly handle INSERT RETURNING
CREATE OR REPLACE FUNCTION public.register_attendance(
  p_training_session_id uuid, 
  p_athlete_id uuid, 
  p_attended boolean, 
  p_performance_rating integer DEFAULT NULL::integer, 
  p_notes text DEFAULT NULL::text
)
RETURNS training_attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_record training_attendance;
BEGIN
  INSERT INTO training_attendance (
    training_session_id, athlete_id, attended, performance_rating, notes
  ) VALUES (
    p_training_session_id, p_athlete_id, COALESCE(p_attended, false), p_performance_rating, p_notes
  )
  ON CONFLICT (training_session_id, athlete_id)
  DO UPDATE SET
    attended = COALESCE(EXCLUDED.attended, training_attendance.attended),
    performance_rating = EXCLUDED.performance_rating,
    notes = EXCLUDED.notes,
    created_at = COALESCE(training_attendance.created_at, now())
  RETURNING * INTO result_record;
  
  RETURN result_record;
END;
$$;