-- =============================================================
-- Multi-tenant — Fase 4: Storage. Ver plan completo en
-- ~/.claude/plans/linear-roaming-torvalds.md.
--
-- Alcance de esta migración — SOLO los 2 buckets con flujo de subida
-- funcional hoy en el frontend (verificado archivo por archivo):
--   - athlete-gallery: src/hooks/useAthleteGallery.ts
--   - receipts:        src/components/finance/TransactionReceiptGenerator.tsx
--
-- Hallazgo IMPORTANTE fuera de alcance de esta migración, documentado
-- para decisión del usuario (no se toca acá): 4 flujos de subida del
-- frontend apuntan a buckets que NO EXISTEN en Supabase Storage —
--   - PhotoUpload.tsx           -> bucket "profiles" (no existe; el real es "avatars")
--   - LogoUpload.tsx            -> bucket "club-logos" (no existe; el real es "logos")
--   - athletes/dashboard/DocumentsTab.tsx -> bucket "documents" (no existe)
--   - competitions/ResultsImportModal.tsx -> bucket "documents" (no existe)
--   - users/tabs/DocumentsTab.tsx -> bucket "user-documents" (no existe)
-- Cada uno de esos falla con "bucket not found" en cuanto alguien intenta
-- subir un archivo — son bugs preexistentes, no causados por esta sesión,
-- y no relacionados con multi-tenant (existirían igual con 1 solo club).
-- Los buckets "avatars" y "logos" SÍ existen pero no tienen ningún caller
-- real apuntándoles todavía — sus policies (de 20260104000001) quedan
-- como están, no se tocan, hasta que se decida el bucket real a usar.
--
-- Cambio de convención: {user_id}/archivo -> {club_id}/{user_id}/archivo.
-- Las policies viejas de user_id-only se reemplazan.
-- =============================================================

-- ── athlete-gallery ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users upload own athlete gallery photo" ON storage.objects;
DROP POLICY IF EXISTS "Users update own athlete gallery photo" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own athlete gallery photo" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage any athlete gallery photo" ON storage.objects;

CREATE POLICY "Users upload own athlete gallery photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users update own athlete gallery photo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users delete own athlete gallery photo"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Staff manage own club athlete gallery photo"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach'))
  )
  WITH CHECK (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach'))
  );

-- "Public read athlete gallery" se deja como está (SELECT sin filtro) — el
-- bucket es público a propósito (getPublicUrl en el frontend) y el nombre
-- de archivo ya no es adivinable sin conocer el club_id + user_id reales.

-- ── receipts ─────────────────────────────────────────────────────────────
-- Antes: solo chequeaba el ROL (admin/finance/leader), sin ningún filtro de
-- carpeta — con 2+ clubes, finance del Club A podía leer/escribir recibos
-- del Club B. Ahora exige además que el primer segmento de la ruta sea el
-- club_id del usuario.

DROP POLICY IF EXISTS "Finance upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance read all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance delete receipts" ON storage.objects;

CREATE POLICY "Finance upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'leader'))
  );

CREATE POLICY "Finance read own club receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'leader'))
  );

CREATE POLICY "Finance update own club receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'leader'))
  );

CREATE POLICY "Finance delete own club receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = public.get_user_club_id(auth.uid())::text
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'))
  );
