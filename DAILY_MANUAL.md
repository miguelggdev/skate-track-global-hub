# DAILY_MANUAL.md — Manual de Trabajo Diario
## SpeedSkateTrack Hub — Guía Completa de Agentes y Skills

---

## CÓMO LEER ESTE MANUAL

Cada sección es un paso que ejecutas en orden, en cada sesión de trabajo.
No saltes pasos. El orden importa.

---

## PASO 1 — ABRIR LA SESIÓN CORRECTAMENTE

Al iniciar Claude Code en este proyecto, siempre di esto primero:

```
"Actúa como AG-CLAUDE-[ROL]. Hoy implementamos [SPEC-XXX o descripción].
Lee primero el WORK_PLAN.md y el spec correspondiente antes de escribir código."
```

**Roles disponibles según lo que vas a hacer:**

| Si vas a trabajar en... | Di esto |
|------------------------|---------|
| Base de datos, SQL, migraciones | `Actúa como AG-CLAUDE-DB` |
| Pantallas, componentes, UI | `Actúa como AG-CLAUDE-FRONTEND` |
| Agentes IA, Python, Celery | `Actúa como AG-CLAUDE-BACKEND` |
| Seguridad, RLS, auditoría | `Actúa como AG-CLAUDE-SECURITY` |
| Landing page, emails, textos | `Actúa como AG-CLAUDE-MARKETING` |
| No sé por dónde empezar | `¿Cuál es la siguiente tarea según WORK_PLAN.md?` |

---

## PASO 2 — REVISAR EL ESTADO DEL DÍA

Antes de escribir una sola línea de código, pregunta:

```
"¿Cuál es el estado actual del Sprint X según WORK_PLAN.md?
¿Qué specs están pendientes? ¿Con cuál empezamos hoy?"
```

Claude leerá el WORK_PLAN.md y te dirá exactamente qué sigue.

---

## PASO 3 — INVOCAR EL SKILL CORRECTO

Los skills son comandos especializados que le dan instrucciones específicas a Claude.
Se invocan escribiendo `/nombre-del-skill` seguido del contexto.

### SKILLS DISPONIBLES Y CUÁNDO USARLOS

---

### `/ui-ux-pro-max` — Diseño Profesional
**Cuándo:** Siempre que crees o modifiques una pantalla, componente o sección.

```
/ui-ux-pro-max dashboard del administrador
/ui-ux-pro-max formulario de registro de atleta
/ui-ux-pro-max cards de KPI
/ui-ux-pro-max navbar y sidebar
```

**Qué hace:**
- Audita la jerarquía visual, espaciado y contraste
- Aplica glassmorphism, micro-interacciones y animaciones
- Verifica responsive en 375px / 768px / 1280px
- Añade estados hover, focus, loading, error y vacío
- Asegura accesibilidad WCAG AA (contraste 4.5:1 mínimo)
- Modo oscuro completo

**Reglas de oro que aplica:**
1. Mobile first — empieza en 375px
2. Sin colores hardcodeados — solo tokens del design system
3. Consistencia sobre creatividad
4. Un cambio = un propósito visual

---

### `/design-system` — Sistema de Diseño Base
**Cuándo:** Al inicio del proyecto (Sprint 1) o cuando cambies la identidad visual.

```
/design-system
```

**Qué hace:**
- Define paleta de colores deportiva (azul/naranja profesional)
- Establece tipografía: heading bold + body legible
- Crea tokens de spacing, border-radius y shadows
- Configura CSS variables para modo claro y oscuro
- Agrega skeleton loaders y animaciones base

**Archivos que modifica:** `tailwind.config.ts`, `src/index.css`

---

### `/responsive-audit` — Auditoría Mobile
**Cuándo:** Después de crear cualquier pantalla nueva. Siempre antes de commit.

```
/responsive-audit
```

**Qué verifica:**
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (nunca solo desktop)
- Tablas en móvil → convertidas a cards o accordions
- Sidebar colapsible con overlay en móvil
- Bottom navigation para móvil (< 768px)
- Tipografía escalable: `text-sm md:text-base lg:text-lg`

---

### `/dashboard-upgrade [rol]` — Mejorar Dashboards
**Cuándo:** Al trabajar en cualquier dashboard de rol.

```
/dashboard-upgrade admin
/dashboard-upgrade coach
/dashboard-upgrade athlete
/dashboard-upgrade finance
/dashboard-upgrade leader
```

**Qué hace por dashboard:**
- **Admin:** 8 KPIs con sparklines, panel de alertas, agenda del día, chat AG-01
- **Coach:** Datos reales de BD, semáforo de carga, chat AG-02, generador IA
- **Atleta:** Progreso de tiempos, chats AG-02/AG-04/AG-05, calendario personal
- **Finance:** KPIs reales, gráfica ingresos vs egresos, chat AG-07

---

### `/security-hardening` — Seguridad Completa
**Cuándo:** Al finalizar cada sprint. Obligatorio antes de deploy.

```
/security-hardening
```

**Qué cubre (OWASP Top 10):**
- Rate limiting en Edge Functions (60 req/min general, 5 req/5min auth)
- Tabla `security_audit_log` con triggers en tablas sensibles
- Validación Zod en todos los formularios
- Headers de seguridad en Edge Functions (CSP, X-Frame-Options, etc.)
- CORS estricto (nunca `*` en producción)
- Panel de auditoría solo para admin

---

### `/rls-policy [tabla]` — Políticas RLS
**Cuándo:** Cada vez que creas una tabla nueva. Antes de hacer cualquier query.

```
/rls-policy athletes
/rls-policy transactions
/rls-policy training_sessions
```

**Qué hace:**
- Activa RLS en la tabla
- Crea políticas por rol (admin, coach, athlete, finance, leader)
- Usa `has_role(auth.uid(), 'admin')` — nunca texto plano
- Verifica que ningún rol tenga más acceso del necesario

---

### `/agent-create [nombre]` — Crear Agente LangGraph
**Cuándo:** Al implementar cada uno de los 14 agentes IA (Sprint 2-4).

```
/agent-create admin       → AG-01
/agent-create skating     → AG-02
/agent-create nutrition   → AG-04
/agent-create gym         → AG-05
/agent-create medical     → AG-06
/agent-create finance     → AG-07
/agent-create marketing   → AG-09
/agent-create results     → AG-10
/agent-create support     → AG-14
```

**Qué crea:**
- `backend/agents/[nombre]_agent.py` — grafo LangGraph con nodos
- `backend/agents/tools/[nombre]_tools.py` — herramientas del agente
- Ruta WebSocket en `backend/main.py`
- Hook React `src/hooks/use[Nombre]Agent.ts`

---

### `/chat-widget [agente]` — Widget de Chat IA
**Cuándo:** Al integrar cada agente en el frontend (Sprint 4).

```
/chat-widget admin
/chat-widget coach
/chat-widget nutrition
/chat-widget support
```

**Qué crea:**
- Botón flotante glassmorphism en esquina inferior derecha
- Panel con streaming de respuestas token por token
- Historial guardado en `support_tickets`
- Responsive: pantalla completa en móvil

---

### `/notification-system` — Notificaciones Realtime
**Cuándo:** Al implementar las automatizaciones (Sprint 5).

```
/notification-system
```

**Qué crea:**
- Hook `useNotifications` con Supabase Realtime
- Campana en TopNavigation con badge de conteo
- Toasts por prioridad (normal/alta/urgente)
- Centro de notificaciones completo
- Anti-spam: máximo 1 por categoría por hora

---

### `/rag-pipeline` — Sistema RAG con pgvector
**Cuándo:** Al implementar el backend de agentes (Sprint 2).

```
/rag-pipeline
```

**Qué crea:**
- Generación de embeddings con Claude API
- Búsqueda vectorial en `knowledge_base` con pgvector
- Función `retrieve_context(query)` para todos los agentes

---

### `/pgvector-setup` — Configurar pgvector
**Cuándo:** Antes de `/rag-pipeline` (requiere extensión activa en Supabase).

```
/pgvector-setup
```

---

### `/audit-log` — Audit Log de Operaciones
**Cuándo:** Sprint 1, después de tener las tablas principales.

```
/audit-log
```

**Qué crea:**
- Tabla `audit_log` con registro de INSERT/UPDATE/DELETE
- Triggers automáticos en tablas: athletes, transactions, user_roles

---

### `/security-review` — Revisión Rápida de Seguridad
**Cuándo:** Después de cualquier cambio de permisos o antes de push importante.

```
/security-review
```

---

### `/bulk-import` — Importación Masiva
**Cuándo:** Al implementar importación de atletas por Excel (Sprint 7).

```
/bulk-import athletes
```

---

### `/skating-expert` — Experto en Patinaje
**Cuándo:** Al poblar el knowledge base de los agentes deportivos.

```
/skating-expert
```

---

### `/competition-import` — Importar Resultados
**Cuándo:** Al implementar el Agente de Resultados (AG-10) (Sprint 4).

```
/competition-import
```

---

## PASO 4 — FLUJO DE IMPLEMENTACIÓN (con cada spec)

```
1. Claude lee el SPEC-XXX completo
2. Claude lista los archivos que va a tocar (confirmas antes de continuar)
3. Claude implementa
4. Claude invoca /ui-ux-pro-max si hay UI
5. Claude invoca /responsive-audit si hay pantallas
6. Claude verifica: npx tsc --noEmit
7. Claude verifica: npm run build
8. Claude hace el commit con formato estándar
```

---

## PASO 5 — DISEÑO: ESTÁNDARES OBLIGATORIOS

Estos estándares se aplican en TODA pantalla del proyecto.
El skill `/ui-ux-pro-max` los ejecuta automáticamente.

### Paleta de Colores (tokens CSS)
```css
--color-primary: oklch(65% 0.22 250);    /* Azul deportivo */
--color-accent:  oklch(70% 0.19 40);     /* Naranja energía */
--color-surface: oklch(12% 0.01 250);    /* Fondo oscuro */
--color-surface-raised: oklch(16% 0.01 250);
--color-border:  oklch(25% 0.01 250);
--color-text:    oklch(95% 0 0);
--color-text-muted: oklch(60% 0 0);
```

### Tipografía
```css
/* Título principal */
.heading-display { font-size: clamp(2rem, 5vw, 4rem); font-weight: 900; letter-spacing: -0.03em; }
/* Título sección */
.heading-1 { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 800; letter-spacing: -0.02em; }
/* Cuerpo */
.body-lg { font-size: 1.125rem; line-height: 1.7; }
/* Etiquetas */
.label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
```

### Cards
```tsx
<div className="relative rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm
  p-6 overflow-hidden transition-all duration-300
  hover:border-white/15 hover:bg-white/6 hover:-translate-y-1
  hover:shadow-xl hover:shadow-black/30 group">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent
    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
</div>
```

### Botones
```tsx
/* Primario */
<button className="relative px-6 py-3 rounded-xl font-bold text-white overflow-hidden
  bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30
  hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]
  transition-all duration-200">

/* Secundario */
<button className="px-6 py-3 rounded-xl font-semibold text-slate-300
  border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5
  transition-all duration-200">
```

### Animaciones (Framer Motion)
```tsx
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } } };
```

### Badges de Estado
```tsx
const statusStyles = {
  active:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  warning:   'bg-amber-500/15   text-amber-400   border border-amber-500/25',
  error:     'bg-red-500/15     text-red-400     border border-red-500/25',
  info:      'bg-blue-500/15    text-blue-400    border border-blue-500/25',
};
```

### Checklist UI antes de cada commit
- [ ] Mobile 375px — se ve bien, sin scroll horizontal
- [ ] Tablet 768px — layout correcto
- [ ] Desktop 1280px — aprovecha el espacio
- [ ] Hover, focus, disabled implementados
- [ ] Sin colores hardcodeados
- [ ] Contraste WCAG AA (4.5:1 mínimo)
- [ ] aria-labels en iconos
- [ ] Skeleton loaders mientras carga

---

## PASO 6 — SEGURIDAD: CHECKLIST POR FEATURE

Antes de hacer commit de cualquier feature que toque datos:

- [ ] La tabla tiene RLS activo (`/rls-policy`)
- [ ] No hay acceso sin autenticación donde no debe haberlo
- [ ] Los inputs tienen validación Zod
- [ ] No hay `console.log` con datos de usuarios
- [ ] Las Edge Functions tienen rate limiting
- [ ] Los datos de menores solo los ven sus entrenadores y admins
- [ ] El audit_log registra cambios en datos sensibles

---

## PASO 7 — COMMIT DIARIO (OBLIGATORIO)

Al final de cada sesión, sin excepción:

```bash
# 1. Verificar TypeScript
npx tsc --noEmit

# 2. Verificar build
npm run build

# 3. Commit
git add [archivos específicos — nunca git add -A ciego]
git commit -m "[AG-CLAUDE-ROL][SPEC-XXX] descripción de lo implementado"

# 4. Push
git push origin dev
```

**Formato del mensaje de commit:**
```
[AG-CLAUDE-FRONTEND][SPEC-002] Conectar frontend al schema nuevo

- Regenerar types de Supabase con nuevo schema
- Eliminar referencias a profiles.role (ahora en user_roles)
- Actualizar hook useAuth para leer roles de user_roles table

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## PASO 8 — VERIFICAR EN LOCAL

Después del commit, siempre prueba en el navegador:

```bash
npm run dev
# Abrir http://localhost:5173
```

**Qué verificar manualmente:**
- [ ] Login funciona (crea perfil y asigna rol)
- [ ] La pantalla trabajada hoy se ve bien en móvil (F12 → responsive mode)
- [ ] No hay errores en la consola del navegador
- [ ] Los datos reales aparecen (no mocks hardcodeados)

---

## REFERENCIA RÁPIDA — ¿QUÉ HAGO HOY?

| Situación | Acción |
|-----------|--------|
| Primer día → | `¿Cuál es la primera tarea del Sprint 1?` |
| Quiero una pantalla nueva → | `AG-CLAUDE-FRONTEND` + `/ui-ux-pro-max` + `/responsive-audit` |
| Quiero una tabla nueva → | `AG-CLAUDE-DB` + `/rls-policy [tabla]` |
| Quiero un agente IA → | `AG-CLAUDE-BACKEND` + `/agent-create [nombre]` |
| Quiero integrar chat IA en UI → | `AG-CLAUDE-FRONTEND` + `/chat-widget [agente]` |
| Quiero revisar seguridad → | `AG-CLAUDE-SECURITY` + `/security-hardening` |
| Antes de deploy → | `AG-CLAUDE-SECURITY` + `/security-hardening` + `/responsive-audit` |
| Algo se ve feo → | `/ui-ux-pro-max [componente]` |
| Tabla sin permisos → | `/rls-policy [tabla]` |
| Quiero notificaciones → | `/notification-system` |

---

## ORDEN DE SPRINTS (resumen ejecutivo)

```
SPRINT 1 (ahora)     → DB limpia + frontend conectado + seguridad base
SPRINT 2 (sem 3-4)   → FastAPI + LangGraph + AG-01 (Admin) + AG-02 (Coach)
SPRINT 3 (sem 5-6)   → AG-04 (Nutrición) + AG-05 (Gym) + AG-06 (Médico)
SPRINT 4 (sem 7-8)   → AG-07 (Finanzas) + AG-09 (Marketing) + Chat UI
SPRINT 5 (sem 9-10)  → 35 automatizaciones Celery
SPRINT 6 (sem 11-12) → Dashboards mejorados + mobile + diseño pro
SPRINT 7 (sem 13-14) → Médico + Portal padres + Mensajería + Importación
SPRINT 8 (sem 15-16) → Testing + Seguridad final + Deploy producción
```

---

## SESIÓN TIPO — Ejemplo de una tarde de trabajo

```
14:00 — Abro Claude Code
       → "Actúa como AG-CLAUDE-FRONTEND, implementa SPEC-002"

14:05 — Claude lee SPEC-002 y lista archivos a tocar
       → Confirmo: "adelante"

14:10 → 15:30 — Claude implementa:
       • Regenera types de Supabase
       • Sanea profiles.role del frontend
       • Actualiza useAuth hook
       → Invoca /ui-ux-pro-max en los componentes tocados
       → Invoca /responsive-audit

15:30 — Claude verifica: npx tsc --noEmit → 0 errores
15:35 — Claude verifica: npm run build → build OK
15:40 — Commit: [AG-CLAUDE-FRONTEND][SPEC-002] ...
15:45 — Push a origin/dev

15:50 — Yo abro http://localhost:5173 y pruebo:
       → Login: funciona ✓
       → Dashboard admin: datos reales ✓
       → Móvil (375px): se ve bien ✓

16:00 — Sesión completa. WORK_PLAN.md actualizado.
```

---

*Manual creado: Julio 2026 — Sprint 1 activo*
*Actualizar este archivo si cambian los skills o el workflow*
