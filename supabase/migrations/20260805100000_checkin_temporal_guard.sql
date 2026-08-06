-- ============================================================
-- Add temporal validation to athlete_checkin RPC
-- A QR/NFC check-in should only succeed for sessions that are
-- scheduled today (within ±4 hours to handle timezone drift).
-- ============================================================

CREATE OR REPLACE FUNCTION public.athlete_checkin(
  p_token      UUID,
  p_session_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_athlete_id    UUID;
  v_athlete_name  TEXT;
  v_session_at    TIMESTAMPTZ;
BEGIN
  -- Find athlete by token
  SELECT id, trim(first_name || ' ' || COALESCE(last_name, ''))
  INTO   v_athlete_id, v_athlete_name
  FROM   public.athletes
  WHERE  checkin_token = p_token
    AND  status = 'active';

  IF v_athlete_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Atleta no encontrado o inactivo');
  END IF;

  -- Verify session exists and is scheduled within ±4 hours of now
  SELECT scheduled_at
  INTO   v_session_at
  FROM   public.training_sessions
  WHERE  id = p_session_id;

  IF v_session_at IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sesión no encontrada');
  END IF;

  IF v_session_at < (now() - INTERVAL '4 hours') OR
     v_session_at > (now() + INTERVAL '4 hours') THEN
    RETURN json_build_object('success', false, 'error', 'El código QR no corresponde a una sesión activa de hoy');
  END IF;

  -- Record attendance
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
