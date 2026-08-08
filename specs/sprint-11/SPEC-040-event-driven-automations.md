# SPEC-040 — Automatizaciones event-driven (webhooks Supabase)
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND
**Sprint:** 11
**Prioridad:** ALTA

> **Backfill retroactivo** — documenta trabajo ya implementado y commiteado.

---

## Propósito
Conectar las automatizaciones event-driven con triggers reales de la base de datos (Supabase Database Webhooks), corregir `billing_tasks` y manejar Twilio graciosamente.

## Entregado
- `backend/api/routes/webhooks.py` — 6 endpoints POST validados con header `X-Webhook-Secret`:
  `attendance-change`, `payment-received`, `competition-result`, `medical-session`, `new-athlete`, `suspicious-access`.
- `config.py` — campo `webhook_secret`; `main.py` incluye el router `/api/webhooks`.
- `billing_tasks.py` — refactor a `celery_app.task` + `get_supabase()` (elimina `shared_task`/`create_client`).
- `whatsapp_tasks.py` — early-exit gracioso si Twilio no está configurado (no crashea el worker).
- `.env.example` / `.env.production.example` — documentada `WEBHOOK_SECRET`.

## Automatizaciones con trigger real
| AUTO | Tarea | Endpoint | Tabla |
|------|-------|----------|-------|
| AUTO-04 | handle_absence | attendance-change | training_attendance |
| AUTO-07 | generate_payment_receipt | payment-received | financial_transactions |
| AUTO-12 | post_competition_followup | competition-result | competition_results |
| AUTO-14 | injury_protocol | medical-session | medical_sessions |
| AUTO-20 | new_athlete_documents | new-athlete | athletes |
| AUTO-30 | check_suspicious_access | suspicious-access | audit_log |
| AUTO-24 | request_testimonial | (combinado con AUTO-12, +24h) | competition_results |

## Configuración manual
Supabase Dashboard → Database → Webhooks (ver `docs/DEPLOY_VPS.md`, Paso 6).

## Notas
- `_verify` tenía un bug (header ausente → 500 por `hmac.compare_digest(None, …)`), corregido después a 401.
