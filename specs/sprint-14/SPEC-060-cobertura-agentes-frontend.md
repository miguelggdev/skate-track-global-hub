# SPEC-060 — Cobertura completa de agentes IA en el frontend
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 14
**Prioridad:** MEDIA

---

## Propósito
Exponer en la UI los 13 agentes IA del backend: los 3 nuevos del Sprint 13 (Seguridad AG-08, Operaciones AG-11, Legal AG-12) no tenían panel de chat, y varios agentes ya existentes (medicina, gym, ciclismo, marketing, resultados) tampoco estaban colocados en ningún dashboard.

## Acceptance Criteria
- [x] El tipo `AgentId` (frontend) incluye `security`, `operations` y `legal`, quedando 1:1 con el registry del backend.
- [x] Existe un catálogo central de presets (título, subtítulo, color, preguntas sugeridas) para los 13 agentes.
- [x] Cada agente sin UI queda colocado en al menos un dashboard según su rol.
- [x] Los agentes restringidos (admin/coach/leader: `admin, medical, finance, security, legal`) solo se muestran en dashboards de esos roles.
- [x] `npx tsc --noEmit` sin errores y `npm run build` exitoso.

## Cambios de Base de Datos
- Ninguno.

## Cambios de Backend
- Ninguno. Los agentes AG-08/11/12 ya estaban registrados y con control de acceso en `api/routes/agents.py` (Sprint 13).

## Cambios de Frontend
- **Nuevos:** `src/components/agents/agentCatalog.ts` (presets de los 13 agentes), `src/components/agents/AgentPanelsSection.tsx` (grilla reutilizable de paneles).
- **Modificados:** `src/hooks/useAgentChat.ts` (tipo `AgentId`), y los dashboards Admin, Leader, Coach y Athlete (insertan `AgentPanelsSection`).

## UI / Comportamiento Esperado
Cada dashboard muestra una sección "Más asistentes IA" con paneles colapsables (`DashboardAgentPanel`) de los agentes relevantes a su rol:
- **Admin / Leader:** operations, marketing, results, medical, security, legal
- **Coach:** operations, results, medical, gym, cycling
- **Athlete:** gym, cycling

## Notas de Implementación
- El acceso real a los agentes restringidos ya lo valida el backend (403 si el rol no es privilegiado); en el frontend simplemente no se ofrecen esos paneles a roles no privilegiados.
- El widget flotante `AgentChatWidget` sigue fijo en `skating` (no requiere cambios).

## Archivos a Crear/Modificar
- `src/hooks/useAgentChat.ts`
- `src/components/agents/agentCatalog.ts`
- `src/components/agents/AgentPanelsSection.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/LeaderDashboard.tsx`
- `src/pages/CoachDashboard.tsx`
- `src/pages/AthleteDashboard.tsx`
