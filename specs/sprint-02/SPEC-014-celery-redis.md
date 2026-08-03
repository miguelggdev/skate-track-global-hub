# SPEC-014 — Celery + Redis: Cola de tareas asíncronas
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND
**Sprint:** 02

## Propósito
Setup base de Celery + Redis para ejecutar tareas en background: recordatorios de pago, notificaciones push, re-indexado de documentos. Las tareas específicas se agregan en Sprint 3.

## Acceptance Criteria
- [x] `tasks/celery_app.py` — Celery configurado con Redis broker
- [x] `tasks/schedules.py` — Beat schedule con placeholder para Sprint 3
- [x] Zona horaria: `America/Bogota`

## Archivos
- `backend/tasks/__init__.py`
- `backend/tasks/celery_app.py`
- `backend/tasks/schedules.py`
