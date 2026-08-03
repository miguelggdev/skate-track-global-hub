# SPEC-015 — SSE Streaming: Respuestas de agentes en tiempo real
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND
**Sprint:** 02

## Propósito
Agregar endpoint de streaming (Server-Sent Events) para que el frontend reciba tokens del agente en tiempo real, evitando esperar la respuesta completa.

## Acceptance Criteria
- [x] `POST /api/agents/{agent_id}/chat/stream` — retorna `text/event-stream`
- [x] Formato: `data: {"token": "..."}\n\n` y `data: [DONE]\n\n`
- [x] `SkatingAgent` tiene `stream_chat()` con tokens reales de Claude
- [x] `AdminAgent` hace fallback a respuesta completa (tool calls no se transmiten)
- [x] CORS configurado para SSE

## Archivos
- `backend/api/routes/agents.py` (modificado)
- `backend/agents/skating_agent.py` (modificado — agrega `stream_chat`)
