-- 1) Deduplicate existing rows so a unique constraint can be created safely
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY training_session_id, athlete_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.training_attendance
)
DELETE FROM public.training_attendance ta
USING ranked r
WHERE ta.id = r.id
  AND r.rn > 1;

-- 2) Ensure there is exactly one UNIQUE constraint on (training_session_id, athlete_id)
DO $$
DECLARE
  tbl_oid oid;
  colnums int[];
  con RECORD;
BEGIN
  SELECT 'public.training_attendance'::regclass::oid INTO tbl_oid;
  -- Column numbers for (training_session_id, athlete_id)
  SELECT ARRAY[
    (SELECT attnum FROM pg_attribute WHERE attrelid = tbl_oid AND attname = 'training_session_id'),
    (SELECT attnum FROM pg_attribute WHERE attrelid = tbl_oid AND attname = 'athlete_id')
  ] INTO colnums;

  -- Create the desired constraint if missing
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = tbl_oid
      AND c.contype = 'u'
      AND c.conkey = colnums
  ) THEN
    EXECUTE 'ALTER TABLE public.training_attendance
             ADD CONSTRAINT training_attendance_session_athlete_unique
             UNIQUE (training_session_id, athlete_id)';
  END IF;

  -- Drop any other UNIQUE constraints on the same column set, except our target name
  FOR con IN 
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = tbl_oid
      AND c.contype = 'u'
      AND c.conkey = colnums
      AND c.conname <> 'training_attendance_session_athlete_unique'
  LOOP
    EXECUTE format('ALTER TABLE public.training_attendance DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

-- 3) Update RPC function to use column-based conflict target to avoid name coupling
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

-- 4) Update bulk RPC similarly
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