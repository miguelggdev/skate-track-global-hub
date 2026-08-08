# SPEC-034 — Sprint 9: Auditoría de Seguridad y Bug Fixes

**Sprint:** 09  
**Agente:** AG-CLAUDE-SECURITY + AG-CLAUDE-FRONTEND + AG-CLAUDE-DB  
**Status:** `done`
**Fecha:** 2026-08-05  

---

## 1. Propósito

Ronda de auditoría completa (4 agentes paralelos: seguridad, frontend, BD, specs gap) más aplicación de todos los hallazgos. Incluye 10 bugs del code review previo y ~20 hallazgos de la nueva auditoría.

---

## 2. Bugs del Code Review (10 fixes)

### Frontend

| # | Archivo | Bug | Fix |
|---|---------|-----|-----|
| 1 | `useAgentChat.ts` | Efecto con stale closure — al cambiar agente los mensajes antiguos se persistían sobre los nuevos | Añadido `messagesForAgent` state; guard `if (messagesForAgent !== agentId) return` |
| 2 | `useAgentChat.ts` | `[DONE]` no cortaba el while principal — consumía el stream completo innecesariamente | Flag `doneStreaming` rompe el outer while |
| 3 | `useAgentChat.ts` | `AbortError` en catch descartaba la burbuja parcial — mensaje del stream perdido | Filtrar burbuja parcial antes de return en rama AbortError |
| 4 | `useAgentChat.ts` | `localStorage` se escribía en cada render del stream — 30-60 writes por mensaje | Debounce de 1000ms en `persist` |
| 5 | `useNFC.ts` | `abortRef.current` se asignaba después de `reader.scan()` — race condition en cleanup | Asignación movida antes de `.scan()` |
| 6 | `TrainingCheckin.tsx` | `stopFn` capturado en closure — si NFC iniciaba después, cleanup llamaba a función obsoleta | `return () => stopScan()` directo, eliminado `stopFn` |
| 7 | `useAthletes.ts` | Coma en `search` rompía el filtro PostgREST `.or()` | Sanitizado: `search.trim().replace(/[%,]/g, ' ')` |
| 8 | `Checkin.tsx` | Sessions query con `enabled: !!token` exponía sesiones de entrenamiento a URLs arbitrarias | Cambiado a `enabled: !!athleteInfo && !athleteError` |
| 9 | `NFCTagManager.tsx` | `APP_URL = window.location.origin` al nivel del módulo — falla en SSR/tests | Movido dentro de la función componente |
| 10 | Nueva migración | `athlete_checkin()` RPC sin validación temporal | `20260805100000_checkin_temporal_guard.sql`: ventana ±4h sobre `scheduled_at` |

### Backend

| # | Archivo | Bug | Fix |
|---|---------|-----|-----|
| 11 | `athletes.py` | `current_user.get("role")` siempre devuelve "authenticated" — cualquier usuario podía importar atletas CSV | Reemplazado por `await _fetch_app_role_async(user_id)` con lookup real en BD |

---

## 3. Hallazgos de la Auditoría Round 2

### 3.1 Seguridad (migración `20260805200000_audit_round2_fixes.sql`)

| # | Hallazgo | Severidad | Fix |
|---|----------|-----------|-----|
| 1 | `handle_new_user` insertaba `profiles(full_name)` pero la tabla tiene `first_name`/`last_name` | CRITICAL | Corregido con columnas reales |
| 2 | Vista `athlete_cv_summary` JOINaba `coaches` por `c2.id = a.coach_id` — siempre NULL | HIGH | Fix a `c2.user_id = a.coach_id` |
| 3 | `get_athlete_by_nfc_uid` devolvía `checkin_token` — token expuesto innecesariamente | HIGH | Eliminado `checkin_token` del select, añadido role check |
| 4 | `document_signatures` FK en `ON DELETE CASCADE` — firma perdida si doc se borra | MEDIUM | Cambiado a `ON DELETE SET NULL` |
| 5 | Políticas coach en datos médicos usaban `athletes.coach_id` en lugar de `coach_athletes` junction | HIGH | Reescrito con subquery en `coach_athletes` |
| 6 | `parent_athletes` policy usaba `pa.parent_id` — columna no existe | CRITICAL | Corregido a `pa.parent_user_id` |
| 7 | `attendance_alerts` y `retention_campaigns` sin scoping por club | MEDIUM | Añadida condición `athlete_id IN (SELECT id FROM athletes WHERE club_id = ...)` |
| 8 | `financial_transactions` SELECT para padres usaba `parent_id` | HIGH | Corregido a `parent_user_id` |
| 9 | Columnas `created_at` sin NOT NULL en varias tablas | LOW | `NOT NULL DEFAULT now()` añadido |
| 10 | Índices duplicados y sin `IF NOT EXISTS` | LOW | `CREATE INDEX IF NOT EXISTS` en todos |

### 3.2 Frontend

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | `Athletes.tsx` sin manejo de estado error | Añadido `Alert` + botón retry |
| 2 | `CoachDashboard.tsx` hacía 7 queries en cada render | `staleTime: 5 * 60 * 1000` en KPI query |
| 3 | `useTrainingSessions.ts` calculaba `today` en build time | `today` movido dentro de `queryFn` |
| 4 | `AddAthleteDialog.tsx` usaba `useEffect` para derivar edad/categoría/nivel | Computado inline, eliminado `useEffect` |
| 5 | `Finance.tsx` — secciones de presupuesto y vencimientos hardcodeadas sin warning | Banners amber de "datos de ejemplo" |

---

## 4. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useAgentChat.ts` | 4 fixes: stale closure, DONE flag, AbortError, debounce |
| `src/hooks/useNFC.ts` | abortRef asignado antes de scan |
| `src/pages/TrainingCheckin.tsx` | Cleanup de NFC sin race condition |
| `src/hooks/useAthletes.ts` | Sanitización de search string |
| `src/pages/Checkin.tsx` | Sessions query habilitada solo con athleteInfo válido |
| `src/components/athletes/NFCTagManager.tsx` | APP_URL movido al scope de componente |
| `src/pages/Athletes.tsx` | Error handling con Alert + retry |
| `src/pages/CoachDashboard.tsx` | staleTime en KPI query |
| `src/hooks/useTrainingSessions.ts` | `today` computado en queryFn |
| `src/components/athletes/AddAthleteDialog.tsx` | Eliminado useEffect de derivación |
| `src/pages/Finance.tsx` | Banners amber en secciones hardcodeadas |
| `backend/api/routes/athletes.py` | Role check con `_fetch_app_role_async` |
| `supabase/migrations/20260805100000_checkin_temporal_guard.sql` | Validación temporal ±4h |
| `supabase/migrations/20260805200000_audit_round2_fixes.sql` | 12 fixes de seguridad y datos |
