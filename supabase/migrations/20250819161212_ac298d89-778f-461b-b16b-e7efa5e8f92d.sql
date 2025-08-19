
BEGIN;

-- 1) Drop the duplicate unique index; keep the canonical one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'training_attendance' 
      AND indexname = 'training_attendance_session_athlete_unique'
  ) THEN
    DROP INDEX IF EXISTS public.training_attendance_session_athlete_unique;
  END IF;
END $$;

-- 2) Drop duplicate foreign keys; keep the standard *_id_fkey ones
ALTER TABLE public.training_attendance
  DROP CONSTRAINT IF EXISTS training_attendance_training_session_fk,
  DROP CONSTRAINT IF EXISTS training_attendance_athlete_fk;

-- 3) Remove duplicate triggers on training_attendance
-- Keep: trg_validate_edit_time_limit_attendance, trg_update_attendance_kpis
DROP TRIGGER IF EXISTS validate_attendance_edit_time ON public.training_attendance;
DROP TRIGGER IF EXISTS update_attendance_kpis_trigger ON public.training_attendance;

-- 4) Ensure canonical triggers exist on training_attendance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_validate_edit_time_limit_attendance' 
      AND tgrelid = 'public.training_attendance'::regclass
  ) THEN
    CREATE TRIGGER trg_validate_edit_time_limit_attendance
    BEFORE UPDATE ON public.training_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_edit_time_limit();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_update_attendance_kpis' 
      AND tgrelid = 'public.training_attendance'::regclass
  ) THEN
    CREATE TRIGGER trg_update_attendance_kpis
    AFTER INSERT OR UPDATE ON public.training_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_attendance_kpis();
  END IF;
END $$;

-- 5) Clean duplicate updated_at trigger on training_sessions
-- Keep: trg_training_sessions_updated_at
DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON public.training_sessions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_training_sessions_updated_at' 
      AND tgrelid = 'public.training_sessions'::regclass
  ) THEN
    CREATE TRIGGER trg_training_sessions_updated_at
    BEFORE UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

COMMIT;
