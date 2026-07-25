-- Ensure unique attendance per (training_session_id, athlete_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'training_attendance'
      AND c.conname = 'training_attendance_unique_session_athlete'
  ) THEN
    ALTER TABLE public.training_attendance
    ADD CONSTRAINT training_attendance_unique_session_athlete
    UNIQUE (training_session_id, athlete_id);
  END IF;
END $$;

-- Helpful index for queries by session
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'training_attendance' 
      AND indexname = 'idx_training_attendance_session') THEN
    CREATE INDEX idx_training_attendance_session
      ON public.training_attendance (training_session_id);
  END IF;
END $$;