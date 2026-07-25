
BEGIN;

-- 1) Remove any duplicate rows (keep the oldest id per (session, athlete))
WITH dups AS (
  SELECT
    training_session_id,
    athlete_id,
    MIN(id) AS keep_id,
    COUNT(*) AS ct
  FROM public.training_attendance
  GROUP BY 1,2
  HAVING COUNT(*) > 1
)
DELETE FROM public.training_attendance t
USING dups d
WHERE t.training_session_id = d.training_session_id
  AND t.athlete_id = d.athlete_id
  AND t.id <> d.keep_id;

-- 2) Ensure a single unique constraint exists on (training_session_id, athlete_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_attendance_session_athlete_unique'
      AND conrelid = 'public.training_attendance'::regclass
  ) THEN
    ALTER TABLE public.training_attendance
      DROP CONSTRAINT training_attendance_session_athlete_unique;
  END IF;
END $$;

ALTER TABLE public.training_attendance
  ADD CONSTRAINT training_attendance_session_athlete_unique
  UNIQUE (training_session_id, athlete_id);

COMMIT;
