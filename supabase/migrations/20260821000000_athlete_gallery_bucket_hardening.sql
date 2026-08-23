-- =============================================================
-- SPEC-QUALITY (audit) — Hardening bucket "athlete-gallery"
-- El bucket se creó manualmente en el Dashboard (useAthleteGallery.ts lo
-- usa desde Sprint temprano) pero nunca quedó con file_size_limit,
-- allowed_mime_types ni políticas RLS versionadas en una migración.
-- Esta migración lo deja en el mismo estándar que "avatars"
-- (supabase/migrations/20260104000001_storage_policies.sql):
-- público de lectura, escritura solo en la carpeta {auth.uid()}/*.
-- =============================================================

-- Crea el bucket si no existe, o actualiza límites si ya existía manual.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'athlete-gallery',
  'athlete-gallery',
  true,
  5242880,  -- 5 MB por imagen (coincide con el uso real: fotos JPEG de perfil deportivo)
  ARRAY['image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública (getPublicUrl() se usa en el frontend para mostrar las fotos)
CREATE POLICY "Public read athlete gallery"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'athlete-gallery');

-- Solo el dueño de la carpeta ({userId}/...) puede subir sus propias fotos
CREATE POLICY "Users upload own athlete gallery photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own athlete gallery photo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own athlete gallery photo"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'athlete-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff (admin/leader/coach) también puede gestionar fotos de cualquier
-- atleta — replica el patrón ya usado en el bucket "documents".
CREATE POLICY "Staff manage any athlete gallery photo"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'athlete-gallery'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach'))
  )
  WITH CHECK (
    bucket_id = 'athlete-gallery'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader') OR has_role(auth.uid(), 'coach'))
  );
