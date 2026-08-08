# SPEC-042 — Panel de automatizaciones + 3 agentes IA + tests Python
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND + AG-CLAUDE-FRONTEND + AG-CLAUDE-DB
**Sprint:** 13
**Prioridad:** ALTA

> **Backfill retroactivo** — documenta trabajo ya implementado y commiteado.

---

## Propósito
Panel de control de automatizaciones (toggle + parámetros), los 3 agentes IA faltantes, rate limiting en RAG, assertion de CORS al startup y tests unitarios de Python.

## Entregado

### Agentes IA
- `backend/agents/security_agent.py` (AG-08), `operations_agent.py` (AG-11), `legal_agent.py` (AG-12).
- `agents.py`: AG-08/11/12 registrados; AG-08 y AG-12 en `_RESTRICTED_AGENTS`.

### Base de datos
- `20260806000000_automation_config.sql` — tabla `automation_config` (RLS admin/leader), seeded con 38 filas (AUTO-01..37).

### Backend
- `tasks/helpers.py` — `get_automation_config()` con caché 5 min + invalidación; `_DEFAULT_AUTOMATION_PARAMS` (38); `task_wrapper` con check `enabled`.
- 38 tareas refactorizadas en 9 archivos (check enabled + params desde `custom_params`).
- `api/routes/automations.py` — `GET /api/automations`, `PATCH /{id}`, `GET /logs`.
- `main.py` — router `/api/automations` + assertion CORS/webhook_secret en startup de producción.
- `rag.py` — rate limiting (upload 5/min, query 20/min).

### Frontend
- `src/pages/AutomationsPage.tsx` — ruta `/automatizaciones` (admin/leader), tabs de config + historial; nav item.

### Tests Python
- `backend/tests/` (conftest, test_helpers, test_webhooks, test_tasks) + `pytest.ini`.

## Notas
- La cobertura de tests se amplió después (agents/automations/rag) junto con `requirements-dev.txt` y la corrección de 2 bugs de producción (rate limiting slowapi, `_verify`).
