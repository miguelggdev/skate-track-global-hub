# SPEC-031 — Dashboards v2 + Mobile + PWA + Realtime + Agent Panels

**Sprint:** 06  
**Agente:** AG-CLAUDE-FRONTEND  
**Estado:** done  
**Fecha:** 2026-08-02  

---

## 1. Propósito

Elevar la experiencia del club a una app nativa-like con:
- Soporte PWA (instalable en Android / iOS)
- Notificaciones en tiempo real vía Supabase Realtime (reemplaza polling 30s)
- Panel de chat IA embebido inline en cada dashboard por rol
- Mejoras de responsividad mobile (safe-area, touch-action, iOS scrolling)

---

## 2. Acceptance Criteria

### 2.1 PWA
- [x] `public/manifest.json` con name, short_name, icons, shortcuts, display: standalone
- [x] `public/sw.js` service worker con estrategia cache-first para estáticos y network-first para navegación
- [x] `index.html` con meta tags de manifest, theme-color, apple-mobile-web-app-*
- [x] Registro automático del SW en `index.html` con detección de soporte

### 2.2 Notificaciones Realtime
- [x] `useNotifications.ts` suscribe a `postgres_changes` en tabla `notifications` filtrado por `user_id`
- [x] Al recibir cualquier cambio se invalida `['notifications', user.id]` vía QueryClient
- [x] Eliminado `refetchInterval: 30_000` (ya no polling)
- [x] Canal se limpia en el `useEffect` cleanup

### 2.3 DashboardAgentPanel
- [x] Componente collapsible: header clickable expande/colapsa
- [x] Usa `useAgentChat(agentId)` internamente
- [x] Preguntas sugeridas cuando no hay mensajes
- [x] Burbujas user/assistant con `text-xs`
- [x] Input con soporte Enter, botón "Limpiar"
- [x] Props: `agentId`, `title`, `subtitle`, `accentColor`, `suggestedQuestions`, `defaultExpanded`, `className`

### 2.4 Paneles IA en Dashboards
| Dashboard | Agente | accentColor |
|-----------|--------|-------------|
| AdminDashboard | AG-01 admin | from-orange-500 to-amber-500 |
| CoachDashboard | AG-02 skating + AG-13 psychology | blue / violet |
| LeaderDashboard | AG-01 admin | from-orange-500 to-amber-500 |
| AthleteDashboard | AG-02 skating + AG-04 nutrition + AG-13 psychology | blue / green / violet |
| FinanceDashboard | AG-07 finance | from-emerald-500 to-teal-500 |

### 2.5 Mobile / CSS
- [x] `safe-area-inset-*` aplicados a `body` con `@supports`
- [x] `touch-action: manipulation` en botones y links (evita zoom doble tap)
- [x] `-webkit-overflow-scrolling: touch` para scroll momentum en iOS
- [x] `-webkit-text-size-adjust: 100%` para evitar zoom en cambio de orientación

---

## 3. Archivos Modificados

### Nuevos
- `public/manifest.json`
- `public/sw.js`
- `src/components/agents/DashboardAgentPanel.tsx`
- `specs/sprint-06/SPEC-031-dashboards-v2.md`

### Actualizados
- `index.html` — PWA meta tags + SW registration
- `src/index.css` — mobile safe-area, touch-action, iOS scrolling
- `src/hooks/useNotifications.ts` — Realtime subscription (remove polling)
- `src/pages/AdminDashboard.tsx` — AG-01 panel
- `src/pages/CoachDashboard.tsx` — AG-02 + AG-13 panels (2-col grid)
- `src/pages/LeaderDashboard.tsx` — AG-01 panel
- `src/pages/AthleteDashboard.tsx` — AG-02 + AG-04 + AG-13 panels (3-col grid)
- `src/pages/FinanceDashboard.tsx` — AG-07 panel

---

## 4. Decisiones Técnicas

- **DashboardAgentPanel vs AgentChatWidget (FAB):** Panel inline para dashboards (siempre visible en contexto), FAB flotante se mantiene como acceso global en otras páginas. No se duplica lógica — ambos consumen `useAgentChat`.
- **Cache-first para estáticos:** El SW usa network-first para HTML (siempre sirve la versión más reciente del app shell), pero cache-first para JS/CSS/imágenes (assets con hash en Vite son inmutables).
- **Supabase Realtime vs polling:** El canal `postgres_changes` reacciona en <200ms vs 30s polling; además elimina una query periódica en todos los clientes activos.

---

## 5. Dependencias

- Sprint 5 completado: tablas `notifications`, `agent_activity_log` existentes (necesarias para AG-01 audit)
- `useAgentChat` hook existente en `src/hooks/useAgentChat.ts`
- `AgentId` type definido en `src/components/agents/AgentChatWidget.tsx` o types centralizados
