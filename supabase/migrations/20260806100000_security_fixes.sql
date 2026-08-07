-- Sprint 13 security fixes:
-- 1. set_athlete_nfc_tag — add role check (admin or coach only)
-- 2. athlete_checkin — restrict from anon to authenticated
-- 3. knowledge_documents + document_chunks — restrict SELECT to staff roles

-- ── 1. set_athlete_nfc_tag role check ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_athlete_nfc_tag(
  p_athlete_id UUID,
  p_tag_uid    TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  -- Only admin or coach can assign/remove NFC tags
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach')) THEN
    RETURN json_build_object('success', false, 'error', 'Permiso denegado');
  END IF;

  IF p_tag_uid IS NULL THEN
    UPDATE public.athletes SET nfc_tag_uid = NULL WHERE id = p_athlete_id;
  ELSE
    -- Check for duplicate tag
    IF EXISTS (
      SELECT 1 FROM public.athletes
      WHERE nfc_tag_uid = p_tag_uid AND id <> p_athlete_id
    ) THEN
      RETURN json_build_object('success', false, 'error', 'NFC UID ya está asignado a otro atleta');
    END IF;
    UPDATE public.athletes SET nfc_tag_uid = p_tag_uid WHERE id = p_athlete_id;
  END IF;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant stays the same (authenticated), role check is now internal
GRANT EXECUTE ON FUNCTION public.set_athlete_nfc_tag(UUID, TEXT) TO authenticated;

-- ── 2. athlete_checkin — restrict to authenticated only ───────────────────────

REVOKE EXECUTE ON FUNCTION public.athlete_checkin(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.athlete_checkin(UUID, UUID) TO authenticated;

-- get_athlete_by_checkin_token stays callable by anon (needed for QR display before login)
-- No change needed there.

-- ── 3. knowledge_documents — restrict SELECT to staff roles ──────────────────

DROP POLICY IF EXISTS "authenticated_read_knowledge_documents" ON public.knowledge_documents;

CREATE POLICY "staff_read_knowledge_documents"
  ON public.knowledge_documents FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')    OR
    has_role(auth.uid(), 'leader')   OR
    has_role(auth.uid(), 'coach')    OR
    has_role(auth.uid(), 'delegate') OR
    has_role(auth.uid(), 'finance')
  );

-- ── 4. document_chunks — restrict SELECT to staff roles ──────────────────────

DROP POLICY IF EXISTS "authenticated_read_chunks" ON public.document_chunks;

CREATE POLICY "staff_read_chunks"
  ON public.document_chunks FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')    OR
    has_role(auth.uid(), 'leader')   OR
    has_role(auth.uid(), 'coach')    OR
    has_role(auth.uid(), 'delegate') OR
    has_role(auth.uid(), 'finance')
  );
