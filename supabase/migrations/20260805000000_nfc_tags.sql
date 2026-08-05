-- ============================================================
-- NFC tag management for helmet-based athlete identification
-- ============================================================

-- Add NFC tag UID column to athletes
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS nfc_tag_uid TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_athletes_nfc_tag_uid
  ON public.athletes(nfc_tag_uid)
  WHERE nfc_tag_uid IS NOT NULL;

-- RPC: look up athlete by NFC tag UID (authenticated coaches)
CREATE OR REPLACE FUNCTION public.get_athlete_by_nfc_uid(p_uid TEXT)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id',             a.id,
    'first_name',     a.first_name,
    'last_name',      a.last_name,
    'category',       a.category,
    'level',          a.level,
    'checkin_token',  a.checkin_token,
    'sessions_count', (
      SELECT COUNT(*)::int
      FROM training_attendance ta
      WHERE ta.athlete_id = a.id AND ta.attended = true
    ),
    'last_session_at', (
      SELECT ts.scheduled_at
      FROM training_attendance ta
      JOIN training_sessions ts ON ta.training_session_id = ts.id
      WHERE ta.athlete_id = a.id AND ta.attended = true
      ORDER BY ts.scheduled_at DESC
      LIMIT 1
    )
  )
  FROM public.athletes a
  WHERE a.nfc_tag_uid = p_uid
    AND a.status = 'active'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_athlete_by_nfc_uid(TEXT) TO authenticated;

-- RPC: record attendance by NFC UID (coaches only)
CREATE OR REPLACE FUNCTION public.athlete_checkin_by_nfc(
  p_uid        TEXT,
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
  WHERE  nfc_tag_uid = p_uid AND status = 'active';

  IF v_athlete_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Tag NFC no registrado en el sistema');
  END IF;

  INSERT INTO public.training_attendance
    (training_session_id, athlete_id, attended, check_in_time)
  VALUES
    (p_session_id, v_athlete_id, true, now())
  ON CONFLICT (training_session_id, athlete_id)
  DO UPDATE SET attended = true, check_in_time = now();

  RETURN json_build_object(
    'success',      true,
    'athlete_name', v_athlete_name,
    'athlete_id',   v_athlete_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.athlete_checkin_by_nfc(TEXT, UUID) TO authenticated;

-- RPC: associate or remove NFC tag UID from an athlete (admin/coach)
CREATE OR REPLACE FUNCTION public.set_athlete_nfc_tag(
  p_athlete_id UUID,
  p_tag_uid    TEXT   -- pass NULL to remove the tag
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_tag_uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.athletes
    WHERE nfc_tag_uid = p_tag_uid AND id != p_athlete_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Este tag ya está asignado a otro deportista');
  END IF;

  UPDATE public.athletes
     SET nfc_tag_uid = p_tag_uid
   WHERE id = p_athlete_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_athlete_nfc_tag(UUID, TEXT) TO authenticated;
