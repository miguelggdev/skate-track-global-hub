# SPEC-038 — Agentes de negocio + Chat UI
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND + AG-CLAUDE-FRONTEND
**Sprint:** 04
**Prioridad:** ALTA

> **Backfill retroactivo** — documenta trabajo ya implementado y commiteado; se
> redacta a posteriori para cumplir la metodología SDD.

---

## Propósito
Completar los agentes de negocio (financiero, marketing, resultados) y conectar el frontend a los agentes IA mediante un widget de chat y paneles por rol.

## Entregado
- **Agentes backend:** `finance_agent.py` (AG-07), `marketing_agent.py` (AG-09), `results_agent.py` (AG-10).
- **Chat UI:** `src/components/agents/AgentChatWidget.tsx` (widget flotante "Experto en Patinaje"), `DashboardAgentPanel.tsx` (panel colapsable por dashboard), `RagChatWidget.tsx`.
- **Hook:** `src/hooks/useAgentChat.ts` — SSE streaming, persistencia en localStorage por agente, manejo de errores/abort.
- **Selección de agente por rol:** cada dashboard monta los paneles relevantes; agentes restringidos solo para roles privilegiados (validado en backend).

## Cambios de Backend
- `backend/agents/{finance,marketing,results}_agent.py` sobre `base_agent.py`.
- `backend/api/routes/agents.py` — endpoints `/api/agents/{id}/chat` y `/chat/stream`.

## Cambios de Frontend
- `src/components/agents/*`, `src/hooks/useAgentChat.ts`, integración en dashboards.

## Notas
- La cobertura completa de los 13 agentes en el frontend se cerró después en el Sprint 14 (SPEC-060).
