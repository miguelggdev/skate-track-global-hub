-- Apply only function updates (constraint already exists)

-- Update RPC function to use column-based conflict target
CREATE OR REPLACE FUNCTION public.register_attendance(
  p_training_session_id uuid,
  p_athlete_id uuid,
  p_attended boolean,
  p_performance_rating integer DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS training_attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  RETURNING *;
END;
$$;

-- Update bulk RPC similarly
CREATE OR REPLACE FUNCTION public.register_bulk_attendance(rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r jsonb;
  cnt int := 0;
BEGIN
  IF rows IS NULL OR jsonb_typeof(rows) <> 'array' THEN
    RETURN 0;
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(rows)
  LOOP
    INSERT INTO training_attendance (
      training_session_id, athlete_id, attended, performance_rating, notes
    ) VALUES (
      (r->>'training_session_id')::uuid,
      (r->>'athlete_id')::uuid,
      COALESCE((r->>'attended')::boolean, false),
      NULLIF(r->>'performance_rating','')::integer,
      NULLIF(r->>'notes','')
    )
    ON CONFLICT (training_session_id, athlete_id)
    DO UPDATE SET
      attended = COALESCE(EXCLUDED.attended, training_attendance.attended),
      performance_rating = EXCLUDED.performance_rating,
      notes = EXCLUDED.notes,
      created_at = COALESCE(training_attendance.created_at, now());

    cnt := cnt + 1;
  END LOOP;

  RETURN cnt;
END;
$$;