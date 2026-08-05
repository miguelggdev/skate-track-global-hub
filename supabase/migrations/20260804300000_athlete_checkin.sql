-- ============================================================
-- Check-in por QR para asistencia a entrenamientos
-- ============================================================

-- Add checkin_token to athletes
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS checkin_token UUID UNIQUE DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_athletes_checkin_token
  ON public.athletes(checkin_token);

-- Populate existing rows that might have NULL tokens
UPDATE public.athletes
  SET checkin_token = gen_random_uuid()
  WHERE checkin_token IS NULL;

-- Add check_in_time to training_attendance if not exists
ALTER TABLE public.training_attendance
  ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;

-- Unique constraint for upsert (training_session_id, athlete_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_attendance_session_athlete'
  ) THEN
    ALTER TABLE public.training_attendance
      ADD CONSTRAINT uq_attendance_session_athlete
      UNIQUE (training_session_id, athlete_id);
  END IF;
END;
$$;

-- RPC: athlete_checkin — callable by anon (athlete shows QR, system records attendance)
CREATE OR REPLACE FUNCTION public.athlete_checkin(
  p_token  UUID,
  p_session_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_athlete_id   UUID;
  v_athlete_name TEXT;
BEGIN
  SELECT id, trim(first_name || ' ' || COALESCE(last_name, ''))
  INTO   v_athlete_id, v_athlete_name
  FROM   public.athletes
  WHERE  checkin_token = p_token
    AND  status = 'active';

  IF v_athlete_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Atleta no encontrado o inactivo');
  END IF;

  -- Verify session exists
  IF NOT EXISTS (SELECT 1 FROM public.training_sessions WHERE id = p_session_id) THEN
    RETURN json_build_object('success', false, 'error', 'Sesión no encontrada');
  END IF;

  INSERT INTO public.training_attendance (training_session_id, athlete_id, attended, check_in_time)
  VALUES (p_session_id, v_athlete_id, true, now())
  ON CONFLICT (training_session_id, athlete_id)
  DO UPDATE SET attended = true, check_in_time = now();

  RETURN json_build_object('success', true, 'athlete_name', v_athlete_name, 'athlete_id', v_athlete_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.athlete_checkin(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.athlete_checkin(UUID, UUID) TO anon, authenticated;

-- RPC: get_athlete_by_checkin_token — for public profile display
CREATE OR REPLACE FUNCTION public.get_athlete_by_checkin_token(p_token UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id',         a.id,
    'first_name', a.first_name,
    'last_name',  a.last_name,
    'category',   a.category,
    'level',      a.level
  )
  FROM public.athletes a
  WHERE a.checkin_token = p_token AND a.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_athlete_by_checkin_token(UUID) TO anon, authenticated;
