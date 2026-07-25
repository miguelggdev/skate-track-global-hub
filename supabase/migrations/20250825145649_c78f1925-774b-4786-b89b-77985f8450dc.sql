-- Clean up duplicate constraints on training_attendance table
-- First, drop any existing duplicate constraints if they exist
DO $$
BEGIN
  -- Drop duplicate constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'training_attendance'
      AND c.conname = 'training_attendance_session_athlete_unique'
  ) THEN
    ALTER TABLE public.training_attendance 
    DROP CONSTRAINT training_attendance_session_athlete_unique;
  END IF;
END $$;

-- Ensure we have the correct unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
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