-- ============================================================
-- Security audit fixes — 2026-08-03
-- ============================================================

-- ── D-1: document_signatures — eliminar DELETE de la policy ────────────────
-- Las firmas legales (contratos, autorizaciones de imagen de menores)
-- no deben poder borrarse por el firmante una vez registradas.

DROP POLICY IF EXISTS "Signers manage own signatures" ON public.document_signatures;

CREATE POLICY "Signers view own signatures" ON public.document_signatures
  FOR SELECT TO authenticated
  USING (signer_user_id = auth.uid());

CREATE POLICY "Signers insert own signature" ON public.document_signatures
  FOR INSERT TO authenticated
  WITH CHECK (signer_user_id = auth.uid());

-- UPDATE también queda prohibido — la corrección de errores debe hacerla service_role


-- ── D-2: handle_new_user — no silenciar excepciones genéricas ───────────────
-- El EXCEPTION genérico dejaba usuarios sin perfil/rol (estado fantasma).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'athlete')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Conflicto esperado (ON CONFLICT ya maneja esto, pero por si acaso)
    RETURN NEW;
  WHEN OTHERS THEN
    -- Re-lanzar: es mejor fallar el signup que dejar un usuario huérfano
    RAISE;
END;
$$;


-- ── D-3: signature_data — límite de tamaño (máx 512 KB en base64) ──────────
-- Sin límite, cualquier usuario autenticado podía saturar el almacenamiento.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_signature_data_size'
  ) THEN
    ALTER TABLE public.document_signatures
      ADD CONSTRAINT chk_signature_data_size
      CHECK (octet_length(signature_data) <= 524288);
  END IF;
END;
$$;


-- ── D-4: athlete_international_competitions — trigger updated_at ────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_athlete_intl_comps_updated_at'
  ) THEN
    CREATE TRIGGER trg_athlete_intl_comps_updated_at
      BEFORE UPDATE ON public.athlete_international_competitions
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;


-- ── D-5: coach_athletes — único entrenador principal por atleta ─────────────

CREATE UNIQUE INDEX IF NOT EXISTS uq_one_primary_coach_per_athlete
  ON public.coach_athletes (athlete_id)
  WHERE is_primary = true;


-- ── D-6: athlete_gallery — restringir a staff + propio atleta + padres ───────
-- Antes: cualquier usuario autenticado (USING true) veía fotos de todos los atletas.

DROP POLICY IF EXISTS "Authenticated view gallery" ON public.athlete_gallery;

CREATE POLICY "Staff or related view gallery" ON public.athlete_gallery
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'coach')
    OR has_role(auth.uid(), 'leader')
    OR athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
    OR athlete_id IN (
      SELECT athlete_id FROM public.parent_athletes WHERE parent_user_id = auth.uid()
    )
  );


-- ── D-7: athletes — identificación única por número + tipo ─────────────────
-- Evita dos atletas con el mismo número de documento.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_athletes_identification'
  ) THEN
    ALTER TABLE public.athletes
      ADD CONSTRAINT uq_athletes_identification
      UNIQUE NULLS NOT DISTINCT (identification_number, identification_type);
  END IF;
END;
$$;


-- ── D-8: search_path en funciones vectoriales ───────────────────────────────
-- El search_path con comillas creaba un schema literal "public, extensions"
-- en lugar de dos schemas separados.

DO $$
BEGIN
  -- Solo re-crear si la función existe
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_knowledge_base') THEN
    ALTER FUNCTION public.search_knowledge_base
      SET search_path = public, extensions;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'match_document_chunks') THEN
    ALTER FUNCTION public.match_document_chunks
      SET search_path = public, extensions;
  END IF;
END;
$$;
