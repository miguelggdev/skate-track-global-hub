-- =============================================================
-- HOTFIX — Multi-tenant Fase 4. La migración anterior
-- (20260825010000) agregó policies RESTRICTIVE-por-intención en
-- logos/documents/avatars con filtro club_id, pero eran PERMISSIVE
-- (igual que el resto del proyecto) y coexistían con policies
-- LEGACY de SPEC-004 (20260104000001) que nunca se habían borrado y
-- que NO tienen ningún filtro de club — solo chequean el rol.
--
-- Como son PERMISSIVE, se combinan por OR: cualquier admin/leader/
-- coach/delegate de CUALQUIER club podía escribir o borrar el logo
-- o los documentos de OTRO club. Mismo patrón exacto del incidente
-- de la Fase 3 (20260824060000) — política vieja "cualquiera" gana
-- por OR sobre la nueva política con scoping.
--
-- Las policies de "avatars"/"documents" con foldername[1]=auth.uid()
-- (convención vieja, antes de anteponer club_id) quedan inofensivas
-- bajo la convención nueva (nunca matchean, club_id != auth.uid()),
-- pero se borran igual por claridad — están muertas.
-- =============================================================

DROP POLICY IF EXISTS "Admin leader delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin leader update logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin leader upload logos" ON storage.objects;

DROP POLICY IF EXISTS "Staff delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff read all documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Athlete reads own documents" ON storage.objects;

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
