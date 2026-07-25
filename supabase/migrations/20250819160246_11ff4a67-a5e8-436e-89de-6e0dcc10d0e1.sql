
-- 1) Remove exact duplicates, keep oldest by created_at (then by id)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY training_session_id, athlete_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.training_attendance
)
DELETE FROM public.training_attendance ta
USING ranked r
WHERE ta.id = r.id
  AND r.rn > 1;

-- 2) Remove orphan attendance rows (no existing session or athlete)
DELETE FROM public.training_attendance ta
WHERE NOT EXISTS (
  SELECT 1 FROM public.training_sessions ts WHERE ts.id = ta.training_session_id
)
OR NOT EXISTS (
  SELECT 1 FROM public.athletes a WHERE a.id = ta.athlete_id
);

-- 3) Ensure a unique index exists to support ON CONFLICT (training_session_id, athlete_id)
CREATE UNIQUE INDEX IF NOT EXISTS training_attendance_session_athlete_uidx
  ON public.training_attendance (training_session_id, athlete_id);

-- 4) Add foreign keys if they don't exist yet (with ON DELETE CASCADE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_attendance_training_session_fk'
  ) THEN
    ALTER TABLE public.training_attendance
      ADD CONSTRAINT training_attendance_training_session_fk
      FOREIGN KEY (training_session_id)
      REFERENCES public.training_sessions(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_attendance_athlete_fk'
  ) THEN
    ALTER TABLE public.training_attendance
      ADD CONSTRAINT training_attendance_athlete_fk
      FOREIGN KEY (athlete_id)
      REFERENCES public.athletes(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

-- 5) Attach trigger for 48h edit validation (admins bypass)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_edit_time_limit_attendance'
  ) THEN
    CREATE TRIGGER trg_validate_edit_time_limit_attendance
    BEFORE UPDATE ON public.training_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_edit_time_limit();
  END IF;
END
$$;

-- 6) Attach trigger to update KPIs when attendance changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_attendance_kpis'
  ) THEN
    CREATE TRIGGER trg_update_attendance_kpis
    AFTER INSERT OR UPDATE ON public.training_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_attendance_kpis();
  END IF;
END
$$;

-- 7) Keep training_sessions.updated_at fresh on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_training_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_training_sessions_updated_at
    BEFORE UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
