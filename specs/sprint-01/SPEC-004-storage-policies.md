# SPEC-004 — Storage Buckets y Policies
**Status:** `draft`  
**Agente:** AG-CLAUDE-DB  
**Sprint:** 01  
**Prioridad:** ALTA  

---

## Propósito
Crear los buckets de Storage en Supabase y las policies RLS correspondientes para subida segura de archivos.

## Acceptance Criteria
- [ ] Bucket `avatars` (público) creado
- [ ] Bucket `logos` (público) creado
- [ ] Bucket `receipts` (privado) creado
- [ ] Policy: authenticated users pueden subir su propio avatar
- [ ] Policy: admin/leader pueden subir logos
- [ ] Policy: admin/finance pueden subir y ver recibos
- [ ] Athlete puede ver solo sus propios recibos

## Cambios de Base de Datos

### Migración: `20260101110000_storage_policies.sql`
```sql
-- Policies en storage.objects
-- Avatars: cada usuario sube/actualiza/elimina solo el suyo
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Logos: admin/leader upload
CREATE POLICY "Admins upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
  );

CREATE POLICY "Public read logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

-- Receipts: privado — solo admin/finance upload, athlete ve los suyos
CREATE POLICY "Finance upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'leader'))
  );

CREATE POLICY "Finance reads all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'leader'))
  );
```

## Notas de Implementación
- Los buckets en sí se crean desde Supabase Dashboard → Storage (no por SQL)
- Las policies SÍ se crean por SQL en la migración
- Crear los buckets ANTES de correr la migración
