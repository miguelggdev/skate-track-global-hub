-- RPC: register_attendance without relying on unique constraints
CREATE OR REPLACE FUNCTION public.register_attendance(
  p_training_session_id uuid,
  p_athlete_id uuid,
  p_attended boolean,
  p_performance_rating integer DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.training_attendance
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row training_attendance%ROWTYPE;
BEGIN
  -- Prevent concurrent duplicates for the same (session, athlete)
  PERFORM pg_advisory_xact_lock(hashtext(p_training_session_id::text), hashtext(p_athlete_id::text));

  -- Try update first
  UPDATE training_attendance
  SET attended = COALESCE(p_attended, attended),
      performance_rating = p_performance_rating,
      notes = p_notes
  WHERE training_session_id = p_training_session_id
    AND athlete_id = p_athlete_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    INSERT INTO training_attendance (
      training_session_id, athlete_id, attended, performance_rating, notes
    ) VALUES (
      p_training_session_id, p_athlete_id, COALESCE(p_attended, false), p_performance_rating, p_notes
    ) RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

-- RPC: bulk register using jsonb array, iterating and calling register_attendance
CREATE OR REPLACE FUNCTION public.register_bulk_attendance(rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
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
    PERFORM public.register_attendance(
      (r->>'training_session_id')::uuid,
      (r->>'athlete_id')::uuid,
      COALESCE((r->>'attended')::boolean, false),
      NULLIF(r->>'performance_rating','')::integer,
      r->>'notes'
    );
    cnt := cnt + 1;
  END LOOP;

  RETURN cnt;
END;
$$;