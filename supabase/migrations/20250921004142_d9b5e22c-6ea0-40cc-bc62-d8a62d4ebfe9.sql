-- 1) Deduplicate existing rows so the unique constraint can be created safely
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

-- 2) Create the unique constraint required by register_attendance/register_bulk_attendance if missing
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