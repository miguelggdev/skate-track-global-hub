# SPEC-032 — Sprint 7: Features Complementarios

**Sprint:** 07  
**Agente:** AG-CLAUDE-FRONTEND + AG-CLAUDE-DB  
**Estado:** done  
**Fecha:** 2026-08-02  

---

## 1. Propósito

Completar las funcionalidades de alto valor que redondean el producto:
módulo médico con vacunas y tests físicos, mensajería en tiempo real,
firma digital de documentos, exportación a calendario ICS, y mejoras al portal de padres.

---

## 2. Features Implementadas

### 2.1 Importación masiva Excel → atletas (ya existía)
- `BulkImportDialog.tsx` — completo desde sprint anterior
- Soporte `.xlsx / .xls / .csv`, normalización de columnas en español, preview con validación Zod, insert por chunks de 50
- Plantilla descargable con atleta de ejemplo

### 2.2 Mensajería Realtime (upgrade desde polling)
- `useMessages.ts`: eliminado `refetchInterval: 30_000` en inbox y `15_000` en thread
- Reemplazado por `supabase.channel('messages-inbox:userId').on('postgres_changes', ...)` en `useInbox()`
- `useThread()` también suscripto a `INSERT` en `messages` para actualizar hilos en tiempo real
- Canal limpiado en `useEffect` cleanup (evita subscriptions huérfanas)

### 2.3 Módulo médico — Vacunas + Tests físicos
**Migración:** `20260802210000_sprint7_medical_vaccines_signatures.sql`

**Tabla `vaccine_records`:**
- athlete_id, vaccine_name, dose_number, vaccine_date, expiry_date, provider, lot_number, notes
- RLS: admin/coach pueden escribir; padres ven vacunas de sus hijos

**Tabla `physical_fitness_tests`:**
- Composición corporal: weight_kg, height_cm, body_fat_pct
- Cardiovascular: resting_hr, max_hr, vo2max, cooper_m
- Fuerza/Flex: leg_press_kg, bench_press_kg, plank_sec, flexibility_cm
- Velocidad: sprint_30m_sec
- RLS: admin/coach escriben; atleta y padres leen

**Nuevos componentes:**
- `VaccineRecordsTab.tsx` — lista vacunas con badge Vigente/Vencida, formulario inline
- `FitnessTestsTab.tsx` — muestra último test con tendencias ↑↓, formulario por grupos de métricas
- `AthleteMedicalDialog.tsx` — expandido de 3 a 5 tabs (+ Vacunas + Tests)

### 2.4 Firma digital de documentos
**Tabla `document_signatures`:**
- document_id (FK blanda), document_title, signer_user_id, signer_name, signer_role, signature_data (base64 PNG), signed_at
- RLS: cada firmante ve solo sus firmas; admin ve todas

**Nuevos componentes:**
- `SignatureCanvas.tsx` — canvas HTML5 con soporte mouse + touch, botón borrar
- `DocumentSignatureDialog.tsx` — modal con lista de firmas previas, campo nombre, canvas, confirmación
- `Documents.tsx` — nueva pestaña "Firma Digital" con 5 documentos del club firmables

### 2.5 Exportación a calendario (Google Calendar + ICS)
- `generateICS.ts` — ya existía con RFC 5545, usado por `TrainingCalendar.tsx`
- `icsExport.ts` — librería adicional con `googleCalendarUrl()` para links directos
- `TrainingCalendar.tsx` — corregido: `useToast` importado y `toast` inicializado
- Botón "Exportar" ya presente genera `.ics` con todas las sesiones visibles del mes

### 2.6 Portal de padres — mejoras
- **Estado médico:** nueva card que muestra restricciones activas/parciales del atleta (query a `medical_sessions`)
- **Mensajes del club:** card con link directo a `/mensajes`
- Íconos adicionales: `HeartPulse`, `MessageSquare`

---

## 3. Archivos Nuevos

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/20260802210000_sprint7_medical_vaccines_signatures.sql` | 3 nuevas tablas con RLS |
| `src/components/medical/VaccineRecordsTab.tsx` | Tab de vacunas con CRUD |
| `src/components/medical/FitnessTestsTab.tsx` | Tab de tests físicos con tendencias |
| `src/components/documents/SignatureCanvas.tsx` | Canvas HTML5 de firma |
| `src/components/documents/DocumentSignatureDialog.tsx` | Dialog de firma digital |
| `src/lib/icsExport.ts` | Utilidades ICS + Google Calendar URL |
| `specs/sprint-07/SPEC-032-sprint7-features.md` | Este spec |

## 4. Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useMessages.ts` | Realtime en inbox y thread; quita polling |
| `src/components/medical/AthleteMedicalDialog.tsx` | 5 tabs (vacunas + tests) |
| `src/pages/Documents.tsx` | 4ta pestaña: Firma Digital |
| `src/pages/ParentDashboard.tsx` | Cards: estado médico + mensajes |
| `src/pages/TrainingCalendar.tsx` | Importa y usa `useToast` |

---

## 5. Decisiones Técnicas

- **Firma digital canvas vs librerías:** Canvas HTML5 nativo sin dependencias. El resultado se almacena como PNG base64 en BD (texto). Para nivel legal, el siguiente paso sería integrar un proveedor como DocuSign o Firma Colombia, pero este MVP cubre la funcionalidad básica del club.
- **ICS sin dependencias externas:** Implementación manual RFC 5545 en `generateICS.ts`. Más ligero que `ics` npm package.
- **`physical_fitness_tests` sin FK a `training_sessions`:** Los tests físicos son independientes — pueden hacerse en cualquier fecha, no necesariamente ligados a una sesión de entrenamiento.
- **`document_signatures.document_id` es FK blanda:** Los documentos firmables son predefinidos por código (no en tabla BD), por lo que se usa el string del documento como `document_title`. `document_id` queda para futura integración con documentos reales en tabla `documents`.
