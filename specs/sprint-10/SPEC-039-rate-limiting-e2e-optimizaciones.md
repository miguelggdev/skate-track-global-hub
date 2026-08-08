# SPEC-039 — Rate limiting + Tests E2E + Optimizaciones
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND + AG-CLAUDE-FRONTEND
**Sprint:** 10
**Prioridad:** ALTA

> **Backfill retroactivo** — documenta trabajo ya implementado y commiteado.

---

## Propósito
Cerrar gaps de seguridad en el backend (rate limiting), estabilizar los tests E2E y aplicar optimizaciones de bundle.

## Entregado
- **Rate limiting FastAPI** (`slowapi`): 30/min en chat, 20/min en stream.
- **Tests E2E:** 102 tests autenticados hacen SKIP graciosamente sin credenciales; `tests/e2e/helpers/auth.ts` con `login()` que retorna boolean y flag `HAS_E2E_CREDENTIALS`.
- **Bundle:** `import()` dinámico de `xlsx`/`jspdf` en `Reports.tsx` (carga al hacer click).
- **NFC fallback** para iOS/desktop en `TrainingCheckin.tsx`.

## Archivos clave
- `backend/api/limiter.py`, `backend/api/routes/agents.py`
- `tests/e2e/helpers/auth.ts`, `src/pages/Reports.tsx`, `src/pages/TrainingCheckin.tsx`

## Notas
- El rate limiting tenía un bug de nombrado de parámetro (`http_request` vs `request` que exige slowapi), corregido posteriormente junto con la cobertura de tests del backend.
