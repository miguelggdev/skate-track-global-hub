-- Ensure unique constraint used by register_attendance/register_bulk_attendance exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'training_attendance'
      AND c.conname = 'training_attendance_session_athlete_unique'
  ) THEN
    ALTER TABLE public.training_attendance
    ADD CONSTRAINT training_attendance_session_athlete_unique
    UNIQUE (training_session_id, athlete_id);
  END IF;
END $$;