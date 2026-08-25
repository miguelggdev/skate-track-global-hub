-- =============================================================
-- Multi-tenant — Fase 4 (cierre). Ver plan en
-- ~/.claude/plans/linear-roaming-torvalds.md.
--
-- Cierra los 6 flujos de Storage rotos que quedaron documentados en
-- 20260824090000 (eran 5 documentados + 1 hallado después: FilesTab.tsx
-- usaba un 6to bucket, "athlete-documents", no listado en esa migración):
--   - PhotoUpload.tsx                      -> bucket real "avatars"
--   - LogoUpload.tsx                       -> bucket real "logos"
--   - athletes/dashboard/DocumentsTab.tsx  -> bucket nuevo "documents"
--   - competitions/ResultsImportModal.tsx  -> bucket nuevo "documents" (compartido)
--   - users/tabs/DocumentsTab.tsx          -> bucket nuevo "user-documents"
--   - athletes/dashboard/FilesTab.tsx      -> bucket nuevo "athlete-documents"
--
-- Convención de path: {club_id}/{user_id}/archivo (o {club_id}/{athlete_id}/...
-- para athlete-documents, o {club_id}/competition-results/... para el caso
-- de staff subiendo resultados de competencia dentro del bucket "documents").
--
-- Público vs privado: se decide según qué método usa el frontend HOY para
-- mostrar el archivo — getPublicUrl() exige bucket público (si no, 400);
-- createSignedUrl() funciona con bucket privado. No se reescribió la lógica
-- de visualización del frontend, solo se hizo que el bucket coincida con lo
-- que el código ya asume:
--   - avatars, logos, documents, user-documents -> PÚBLICOS (código usa
--     getPublicUrl). Mismo tradeoff ya aceptado para athlete-gallery: el
--     archivo es público solo si se conoce la ruta exacta (club_id/user_id/...,
--     no enumerable), nunca listado.
--   - athlete-documents -> PRIVADO (FilesTab.tsx ya usa createSignedUrl()
--     correctamente, con URLs de 60s de vigencia).
--
-- avatars/logos ya existían sin ningún caller apuntándoles (ver comentario
-- de 20260824090000) y sin límite de tamaño/mime configurado — se agregan
-- acá alineados a la validación que ya hace el frontend.
-- =============================================================

-- ── Buckets existentes: pasar a público + límites ──────────────────────────

UPDATE storage.buckets
SET public = true,
    file_size_limit = 2097152, -- 2MB, igual que valida PhotoUpload.tsx
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg']
WHERE id = 'avatars';

UPDATE storage.buckets
SET public = true,
    file_size_limit = 2097152, -- 2MB, igual que valida LogoUpload.tsx
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
WHERE id = 'logos';

-- ── Buckets nuevos ───────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents', 'documents', true, 10485760,
   ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('user-documents', 'user-documents', true, 10485760,
   ARRAY['application/pdf', 'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'image/jpeg', 'image/jpg', 'image/png']),
  ('athlete-documents', 'athlete-documents', false, 10485760,
   ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── avatars ──────────────────────────────────────────────────────────────
-- Dueño (auth.uid() = folder[2]) o staff del mismo club pueden escribir.

DROP POLICY IF EXISTS "Manage own club avatar" ON storage.objects;
CREATE POLICY "Manage own club avatar"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach')
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach')
    )
  );

-- ── logos ────────────────────────────────────────────────────────────────
-- Solo admin del club (coincide con el gate isAdmin de LogoUpload.tsx).

DROP POLICY IF EXISTS "Admin manage own club logo" ON storage.objects;
CREATE POLICY "Admin manage own club logo"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND has_role(auth.uid(), 'admin')
  );

-- ── documents ────────────────────────────────────────────────────────────
-- Dueño de su propia carpeta (documentos/firma personal) o staff del club
-- (cubre también competition-results, subido por staff a folder[2] fijo).

DROP POLICY IF EXISTS "Manage own club documents" ON storage.objects;
CREATE POLICY "Manage own club documents"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach')
    )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach')
    )
  );

-- ── user-documents ───────────────────────────────────────────────────────
-- Staff-only (EditUserDialog): admin/leader suben documentos sobre OTRO
-- usuario del mismo club.

DROP POLICY IF EXISTS "Staff manage own club user-documents" ON storage.objects;
CREATE POLICY "Staff manage own club user-documents"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  )
  WITH CHECK (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  );

-- ── athlete-documents (privado) ──────────────────────────────────────────
-- El propio atleta (folder[2] = su athletes.id) o staff del club.
-- Necesita SELECT explícito porque el bucket es privado y FilesTab.tsx usa
-- createSignedUrl(), que sí pasa por RLS.

DROP POLICY IF EXISTS "Athlete or staff manage own club athlete-documents" ON storage.objects;
CREATE POLICY "Athlete or staff manage own club athlete-documents"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'athlete-documents'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (
      EXISTS (
        SELECT 1 FROM public.athletes a
        WHERE a.id::text = (storage.foldername(name))[2] AND a.user_id = auth.uid()
      )
      OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach')
    )
  )
  WITH CHECK (
    bucket_id = 'athlete-documents'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (
      EXISTS (
        SELECT 1 FROM public.athletes a
        WHERE a.id::text = (storage.foldername(name))[2] AND a.user_id = auth.uid()
      )
      OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach')
    )
  );
