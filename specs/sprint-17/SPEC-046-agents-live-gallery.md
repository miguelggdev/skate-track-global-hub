# SPEC-046 — Galería de agentes IA en vivo
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND + AG-CLAUDE-DB
**Sprint:** 17
**Prioridad:** MEDIA

---

## Propósito
Dar una vista visual donde se ven los 13 agentes IA del club "trabajando", con animaciones y estado en tiempo real basado en su actividad real (`agent_activity_log`).

## Acceptance Criteria
- [x] Página `/agentes` (admin/leader) con los 13 agentes como tarjetas animadas.
- [x] Cada tarjeta: avatar (emoji) + color del catálogo, título, código AG-XX y estado.
- [x] Estado **idle** con animación de "respiración"; estado **trabajando** con glow/anillo pulsante y "Trabajando…".
- [x] Estado en vivo: al insertarse una fila en `agent_activity_log` (una automatización corre), la tarjeta del agente se anima vía **Supabase Realtime**; se limpia sola tras unos segundos.
- [x] Última actividad por agente (hora relativa + ✅/❌/⏭) leída de `agent_activity_log`.
- [x] `npx tsc --noEmit` (0 errores) + `npm run build` OK.

## Cambios de Base de Datos
`20260808000000_agent_activity_realtime.sql`:
- Política SELECT en `agent_activity_log` también para `leader` (ya existía para `admin`).
- Tabla añadida a la publicación `supabase_realtime` (idempotente) para eventos INSERT en vivo.

## Cambios de Frontend
- **Nuevos:** `src/pages/AgentsLive.tsx`, `src/components/agents/AgentsGallery.tsx` (framer-motion),
  `src/components/agents/agentMeta.ts` (código AG-XX + emoji, y reverse map), `src/hooks/useAgentActivity.ts`.
- **Modificados:** `src/App.tsx` (ruta `/agentes` protegida admin/leader), `src/components/layout/DashboardLayout.tsx` (nav "Agentes en vivo" + rutas permitidas).

## Notas de Implementación
- La actividad la escriben las tareas Celery (`log_activity` → `agent_activity_log`), así que el
  "trabajando en vivo" refleja automatizaciones reales; sin backend/Celery corriendo, se ve el histórico + idle.
- La carga inicial usa **PostgREST directo** (con el JWT del usuario, respeta RLS) porque
  `agent_activity_log` aún no está en los tipos generados (`types.ts`, UTF-16) y no se quiso tocar ese archivo ni usar `any`.
- Realtime usa `supabase.channel(...postgres_changes...)` (el `table` es string, sin restricción de tipos).
- Mapeo agente→código en `agentMeta.ts` (admin=AG-01 … psychology=AG-13).

## Archivos
- `supabase/migrations/20260808000000_agent_activity_realtime.sql`
- `src/pages/AgentsLive.tsx`, `src/components/agents/{AgentsGallery.tsx,agentMeta.ts}`, `src/hooks/useAgentActivity.ts`
- `src/App.tsx`, `src/components/layout/DashboardLayout.tsx`
