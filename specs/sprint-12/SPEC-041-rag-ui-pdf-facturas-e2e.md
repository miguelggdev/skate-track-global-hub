# SPEC-041 — RAG UI + PDF de facturas + seed E2E + guía de deploy
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND + AG-CLAUDE-FRONTEND
**Sprint:** 12
**Prioridad:** ALTA

> **Backfill retroactivo** — documenta trabajo ya implementado y commiteado.

---

## Propósito
Dar UI a la base de conocimiento RAG, adjuntar PDF a las facturas, crear el seed de usuarios E2E y actualizar la guía de deploy.

## Entregado
- **RAG UI:** `src/pages/KnowledgeBase.tsx` (drag & drop, lista, borrado con confirmación); ruta `/knowledge-base` protegida admin/leader; nav item.
- **RAG backend:** `backend/api/routes/rag.py` — `POST /api/rag/upload` (PDF/TXT → pgvector, 10 MB, admin/leader), `DELETE /api/rag/documents/{id}` (CASCADE chunks).
- **PDF facturas:** `billing_tasks.py` genera PDF con `reportlab` (`_generate_invoice_pdf`) y lo adjunta al email; `requirements.txt` += `reportlab`.
- **Seed E2E:** `scripts/seed-e2e-users.mjs` (crea admin/coach/parent vía Supabase Admin API).
- **Deploy:** `docs/DEPLOY_VPS.md` actualizado (pasos manuales, webhooks, DNS).
- **`CreateTrainingDialog`** migrado a Zod.

## Archivos clave
- `src/pages/KnowledgeBase.tsx`, `backend/api/routes/rag.py`, `backend/tasks/billing_tasks.py`, `scripts/seed-e2e-users.mjs`.

## Pendiente manual
- Ejecutar `node scripts/seed-e2e-users.mjs` + vars `E2E_*` en `.env.test`.
