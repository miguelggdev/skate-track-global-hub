
-- 1) Remove any existing duplicates, keep the earliest by created_at
WITH ranked AS (
  SELECT
    id,
    training_session_id,
    athlete_id,
    ROW_NUMBER() OVER (
      PARTITION BY training_session_id, athlete_id
      ORDER BY created_at ASC
    ) AS rn
  FROM public.training_attendance
)
DELETE FROM public.training_attendance t
USING ranked r
WHERE t.id = r.id
  AND r.rn > 1;

-- 2) Drop any existing unique constraints on (training_session_id, athlete_id)
ALTER TABLE public.training_attendance
  DROP CONSTRAINT IF EXISTS unique_attendance_per_session;

ALTER TABLE public.training_attendance
  DROP CONSTRAINT IF EXISTS training_attendance_training_session_id_athlete_id_key;

-- 3) Create a single canonical unique constraint
ALTER TABLE public.training_attendance
  ADD CONSTRAINT training_attendance_session_athlete_unique
  UNIQUE (training_session_id, athlete_id);
