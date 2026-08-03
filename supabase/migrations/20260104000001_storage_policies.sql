-- =============================================================
-- SPEC-004 — Storage Bucket Policies
-- Los buckets (avatars, logos, receipts, documents) deben estar
-- creados en Supabase Dashboard → Storage antes de aplicar esto.
-- =============================================================

-- =============================================================
-- BUCKET: avatars (público — fotos de perfil)
-- =============================================================

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================
-- BUCKET: logos (público — logo del club, escudos de competencia)
-- =============================================================

CREATE POLICY "Public read logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "Admin leader upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  );

CREATE POLICY "Admin leader update logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  );

CREATE POLICY "Admin leader delete logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  );

-- =============================================================
-- BUCKET: receipts (privado — comprobantes de pago)
-- =============================================================

CREATE POLICY "Finance upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'finance')
      OR has_role(auth.uid(), 'leader')
    )
  );

CREATE POLICY "Finance read all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'finance')
      OR has_role(auth.uid(), 'leader')
    )
  );

CREATE POLICY "Finance update receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'finance')
      OR has_role(auth.uid(), 'leader')
    )
  );

CREATE POLICY "Finance delete receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'finance')
    )
  );

-- =============================================================
-- BUCKET: documents (privado — cartas permiso, carnets, pólizas)
-- =============================================================

-- Staff sube y lee cualquier documento
CREATE POLICY "Staff upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'leader')
      OR has_role(auth.uid(), 'delegate')
      OR has_role(auth.uid(), 'coach')
    )
  );

CREATE POLICY "Staff read all documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'leader')
      OR has_role(auth.uid(), 'delegate')
      OR has_role(auth.uid(), 'coach')
    )
  );

-- Atleta solo ve documentos dentro de su carpeta (documents/{user_id}/*)
CREATE POLICY "Athlete reads own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND has_role(auth.uid(), 'athlete')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Staff delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  );
