# SpeedSkateTrack Hub — Manual descriptivo de la aplicación

**Última actualización:** 25-ago-2026. Producción: `https://track.arkanatech.tech` (frontend), `https://stride.arkanatech.tech` (backend), `https://split.arkanatech.tech/flower/` (monitor de Celery).

---

## 1. Qué es

Plataforma de gestión integral para clubs de patinaje de velocidad: atletas, entrenamientos, competencias, finanzas, documentos, equipamiento, comunicación con padres/atletas, y 13 agentes de IA que asisten en distintas áreas del club. Está construida como **SaaS multi-tenant**: un solo despliegue y una sola base de datos dan servicio a varios clubes de forma aislada.

**Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui, PWA (funciona offline/instalable).
- Backend: FastAPI (Python) + LangGraph (agentes IA) + Celery + Redis (tareas programadas/automatizaciones).
- Base de datos: Supabase Cloud (Postgres + Auth + Storage + Edge Functions/Deno + pgvector para RAG).
- Infra: VPS propio, Docker Compose, Traefik (reverse proxy + TLS automático).

---

## 2. Roles del sistema

Definidos en el enum `user_role` de Postgres:

| Rol | Alcance |
|---|---|
| `admin` | Control total del club: configuración, usuarios, finanzas, automatizaciones. |
| `leader` | Similar a admin en la mayoría de vistas; pensado para directivos del club. |
| `coach` | Entrenadores: planes de entrenamiento, asistencia, datos de sus atletas. |
| `delegate` | Rol operativo intermedio (competencias, reportes, pagos) sin acceso administrativo completo. |
| `finance` | Acceso al módulo financiero (transacciones, recibos, facturación). |
| `athlete` | Portal del deportista: su perfil, documentos, calendario, pagos. |
| `parent` | Igual que athlete pero para el padre/tutor de un menor. |

Un usuario tiene **un rol por club** (tabla `user_roles`, `UNIQUE(user_id, club_id, role)`). El modelo actual es **1 usuario = 1 club** — no hay selector de club en el frontend, el club se resuelve automáticamente por el usuario autenticado.

Aparte de estos roles "de club" existe un rol de plataforma completamente separado:

| Rol de plataforma | Alcance |
|---|---|
| `platform_admin` (tabla `platform_admins`, no `user_roles`) | **Superadmin**: no pertenece a ningún club, solo puede dar de alta/baja clubes desde `/superadmin`. |

---

## 3. Cómo ingresar a la app

### Usuario normal (admin, coach, atleta, etc.)
1. Ir a `https://track.arkanatech.tech/login`.
2. Ingresar email + contraseña de una cuenta ya creada. **No existe registro público de administradores** — ver sección 5.
3. Tras loguearse, cada rol aterriza en su dashboard (`/admin-dashboard`, `/coach-dashboard`, `/athlete-dashboard`, etc.) definido por `RoleBasedRedirect` en `src/App.tsx`.
4. "¿Olvidaste tu contraseña?" dispara recuperación por email (Supabase Auth).
5. Cuentas nuevas de staff (creadas por un admin desde `/usuarios`) requieren **verificación por email** antes de poder loguear (`email_confirm: false` en la Edge Function `create-user-admin`) — no hay 2FA/TOTP, se evaluó como sobre-alcance para el tamaño actual del proyecto.
6. Registro público de **atletas/padres** sigue existiendo en `/register` (resuelve el club por el dominio con el que se accede) — es la única cuenta que un usuario externo puede crearse solo.

### Superadmin (dueño de la plataforma)
1. Login normal en `/login` con la cuenta bootstrap (`miguelangelggarzon@gmail.com`).
2. Ir a `https://track.arkanatech.tech/superadmin` — protegido por `usePlatformAdmin()` (chequea `is_platform_admin()` vía RPC, no el rol de club). Si el usuario no es platform_admin, se redirige a `/app`; si no está autenticado, a `/login`.
3. Desde ahí: dar de alta clubes nuevos, activar/desactivar clubes existentes.

---

## 4. Multi-tenant: cómo se aísla cada club

**Decisión de diseño:** un solo proyecto Supabase, una sola base de datos, un solo despliegue de frontend/backend — **no** hay una base de datos ni un deploy por club.

### 4.1 Aislamiento por `club_id` + RLS de dos capas
- Toda tabla de negocio ("Grupo A", ~46 tablas: atletas, entrenamientos, finanzas, documentos, etc.) tiene una columna `club_id` (`NOT NULL`, con índice).
- Las tablas "hija" que cuelgan de otra (ej. `training_attendance` de `training_sessions`, o `competition_results` de `competitions`) **heredan** el aislamiento vía una policy que resuelve el `club_id` a través de la tabla padre — no llevan columna `club_id` propia.
- Cada tabla tiene una policy **RESTRICTIVE** llamada `tenant_isolation` que exige `club_id = get_user_club_id(auth.uid())`. Al ser RESTRICTIVE (no PERMISSIVE), se combina con **AND** sobre las policies de rol ya existentes — nunca las reemplaza ni compite con ellas por OR.
- `get_user_club_id(auth.uid())` es un lookup a la tabla `user_roles` (no un claim del JWT — el Auth Hook de Supabase que permitiría eso requiere plan Team/Enterprise, no disponible).
- Un trigger (`set_club_id_from_current_user()`) asigna automáticamente el `club_id` correcto en cada `INSERT`, para que el frontend nunca tenga que enviarlo a mano. Si la fila la crea el backend con `service_role` (sin `auth.uid()`), cae al club por defecto (`default_club_id()`) — motivo por el cual **el backend siempre debe filtrar `club_id` explícitamente**, ver 4.3.

### 4.2 Storage (archivos)
Los buckets de Supabase Storage usan la misma convención: `{club_id}/{user_id_o_athlete_id}/archivo`. Buckets activos:

| Bucket | Uso | Público |
|---|---|---|
| `athlete-gallery` | Fotos de galería de atletas | Sí (ruta no adivinable) |
| `avatars` | Fotos de perfil de usuario | Sí |
| `logos` | Logo del club | Sí |
| `documents` | Documentos/firma digital de atletas, resultados de competencia subidos por staff | Sí |
| `user-documents` | Documentos de staff (CV, contrato) subidos por un admin | Sí |
| `athlete-documents` | Checklist fijo de documentos del atleta (cédula, EPS, pólizas) | **No** (URLs firmadas, 60s) |
| `receipts` | Comprobantes de pago | **No** (solo admin/finance/leader del club) |
| `whatsapp-motivational` | Imágenes para automatización de WhatsApp | Sí (contenido no sensible, compartido) |

Cada bucket tiene policies RLS que exigen que el primer segmento de la ruta coincida con `get_user_club_id(auth.uid())`.

### 4.3 Backend (`service_role`, ignora RLS por completo)
El backend (Celery, FastAPI, agentes LangGraph) usa la `service_role` key de Supabase, que **no pasa por RLS** — la responsabilidad de no mezclar datos entre clubes recae 100% en el código Python, filtrando `.eq("club_id", club_id)` en cada query.

- **Celery** (`backend/tasks/`): cada tarea programada se separa en `tareas.X.nombre_dispatch` (la dispara Celery Beat, y reparte un `.delay(club_id)` por cada club activo vía `get_active_club_ids()`) + `tareas.X.nombre(club_id)` (la tarea real, filtra todo por ese club). 37 automatizaciones (`AUTO-01` a `AUTO-37`) repartidas en 9 módulos — ver sección 6.
- **Agentes LangGraph** (`backend/agents/`) y **rutas FastAPI** (`backend/api/routes/`): el `club_id` del usuario se resuelve una vez por request (`_fetch_role_and_club_async` en `backend/api/deps.py`, lookup a `user_roles`) y se guarda en un `ContextVar` (`current_club_id`, en `backend/agents/base_agent.py`) que cada tool/función de agente lee para filtrar sus queries.

### 4.4 Dominio propio por club
Cada club puede tener su propio dominio (`clubs.custom_domain`) apuntando al mismo contenedor — Traefik enruta todos los dominios al mismo servicio; el club se resuelve por el **usuario autenticado**, nunca por el hostname (excepto en `/register`, que sí usa el hostname para saber a qué club afiliar un registro público de atleta).

---

## 5. Onboarding y Offboarding de clubes (Superadmin)

Implementado a pedido explícito del usuario, reemplaza el mecanismo viejo de invitación pública (`admin_invite_token`, ya eliminado de la base de datos).

### Alta de un club nuevo (`/superadmin`)
1. El Superadmin completa un formulario: nombre del club, dominio/subdominio personalizado, dirección, ciudad, país, teléfono fijo, teléfono móvil, y los datos del primer usuario **Administrador** (nombre, email).
2. Esto invoca la Edge Function `superadmin-onboard-club` (`supabase/functions/superadmin-onboard-club/`), que:
   - Valida que quien llama sea realmente `platform_admin` (RPC `is_platform_admin`).
   - Crea la fila en `clubs`.
   - Invita al admin por email (`auth.admin.inviteUserByEmail`) — el usuario recibe un correo con un link para **fijar su propia contraseña**, nunca se genera ni se muestra una temporal.
   - Corrige un detalle no obvio de Supabase: el trigger `handle_new_user()` se dispara automáticamente en cuanto se crea el usuario, antes de que la función pueda marcarlo como `admin` — por eso la función, después del invite, borra la fila espuria de `athletes` y el rol erróneo que el trigger creó por defecto, e inserta el `user_roles` correcto (`admin`, club correspondiente).
3. El nuevo admin recibe el correo, fija su contraseña, y ya puede loguear en `/login` — su club queda resuelto automáticamente.

### Baja/reactivación de un club (Offboarding)
- El panel `/superadmin` lista todos los clubes con un switch **Activo/Inactivo** (`clubs.is_active`).
- Al desactivar un club: `useCurrentClub()` expone `is_active`, y `App.tsx` (tanto `ProtectedRoute` como `RoleBasedRedirect`) intercepta a **cualquier** usuario de ese club y le muestra `<SuspendedAccountScreen />` — una pantalla de "Cuenta Suspendida" de pantalla completa con solo un botón de cerrar sesión. No se borran datos (soft delete): al reactivar el switch, el club vuelve a funcionar exactamente igual.

---

## 6. Automatizaciones (Celery)

37 automatizaciones (`AUTO-01`–`AUTO-37`) repartidas en 9 módulos de `backend/tasks/`, todas ejecutadas por Celery Beat según `backend/tasks/schedules.py` y filtradas por club (ver 4.3). Se administran desde `/automatizaciones` en el frontend (activar/desactivar, ver historial de corridas) — la ruta backend es `backend/api/routes/automations.py`.

| Módulo | Qué automatiza (ejemplos) |
|---|---|
| `marketing_tasks.py` | Campañas de retención, encuestas de satisfacción, solicitud de testimonios |
| `calendar_tasks.py` | Recordatorios de entrenamiento, alertas de inasistencia |
| `finance_tasks.py` | Reportes financieros diarios |
| `athlete_tasks.py` | Seguimiento de historial deportivo/médico |
| `admin_tasks.py` | Tareas administrativas generales (documentos, equipamiento, alertas) |
| `security_tasks.py` | Auditoría de accesos, backups, bloqueo de IPs |
| `billing_tasks.py` | Facturación mensual automática |
| `whatsapp_tasks.py` | Frases motivacionales y mensajes por WhatsApp |
| `reporting_tasks.py` | Reportes operativos y predicciones de rendimiento |

Monitoreo de workers/beat: `https://split.arkanatech.tech/flower/` (pide autenticación).

---

## 7. Agentes de IA (13, LangGraph + Claude)

Chat conversacional por cada área del club, accesible desde `/agentes` (galería en vivo) o widgets embebidos en cada dashboard. Backend: `backend/agents/*.py`, registrados en `backend/api/routes/agents.py`; catálogo/UI: `src/components/agents/agentCatalog.ts`.

| Código | Agente | Especialidad |
|---|---|---|
| AG-01 | Administrador | Preguntas libres sobre cualquier dato del club |
| AG-02 | Entrenador (Patinaje) | Técnica, periodización, estrategia de carrera |
| AG-03 | Ciclismo | Entrenamiento cruzado con bicicleta |
| AG-04 | Nutricionista | Alimentación e hidratación para rendimiento |
| AG-05 | Preparador físico | Fuerza, pliometría, prevención de lesiones |
| AG-06 | Medicina deportiva | Lesiones, salud, retorno al deporte |
| AG-07 | Financiero | Ingresos, egresos, pagos pendientes, metas |
| AG-08 | Seguridad | Auditoría de accesos, permisos, alertas |
| AG-09 | Marketing | Contenido de redes, comunicados |
| AG-10 | Resultados | Rankings, historial, análisis de rendimiento |
| AG-11 | Operaciones | Sesiones, equipamiento, capacidad, resumen del día |
| AG-12 | Legal y cumplimiento | Consentimientos, seguros, documentos, normativa FCP |
| AG-13 | Psicología deportiva | Motivación, concentración, bienestar mental |

Cada agente es un grafo LangGraph (`create_react_agent`) con sus propias *tools* (funciones Python que consultan Supabase), filtradas por rol (`current_user_role`) y por club (`current_club_id`, ver 4.3). Además existe un sistema RAG (`backend/agents/skating_rag/`, pgvector) para responder con la base de conocimiento del club (reglamentos, documentos cargados) — panel en `/base-conocimiento`.

---

## 8. Seguridad — funciones clave de Postgres

Usadas en las policies RLS de todo el esquema:

| Función | Qué hace |
|---|---|
| `has_role(user_id, role)` | ¿Este usuario tiene este rol (en cualquiera de sus clubes)? |
| `get_user_role(user_id)` | Rol de mayor jerarquía del usuario |
| `get_user_club_id(user_id)` | Club al que pertenece el usuario — base de todo el aislamiento multi-tenant |
| `same_club(club_id)` | ¿Ese `club_id` es el mismo del usuario actual? |
| `is_platform_admin(user_id)` | ¿Es Superadmin? (tabla `platform_admins`, independiente de `user_roles`) |
| `get_club_by_domain(domain)` | Resuelve un club por `custom_domain` (usado en `/register`) |
| `default_club_id()` | Club de fallback para inserts sin contexto de usuario (backend `service_role`) |

Todas las funciones sensibles llevan `SECURITY DEFINER SET search_path = 'public'` (evita *search_path hijacking*). Todas las tablas tienen RLS activo (`FORCE ROW LEVEL SECURITY` en las de Grupo A).

---

## 9. Skills, comandos y MCP usados en este proyecto

### Skills instaladas (`.claude/skills/`, vía `npx skills add`, registro en `skills-lock.json`)
- `vercel-composition-patterns` — patrones de composición de componentes React (Vercel Labs).
- `vercel-react-best-practices` — buenas prácticas React/TS (Vercel Labs).

### Comandos personalizados (`.claude/commands/`, invocables con `/nombre`)
Documentan y automatizan tareas recurrentes del proyecto: `/agent-create`, `/audit-log`, `/bulk-import`, `/chat-widget`, `/colombia-skating-reference` (base de conocimiento FCP/World Skate), `/competition-import`, `/cycling-crosstraining`, `/dashboard-upgrade`, `/design-system`, `/gym-routine-gen`, `/notification-system`, `/nutrition-plan-gen`, `/pgvector-setup`, `/rag-pipeline`, `/responsive-audit`, `/rls-policy`, `/security-hardening`, `/skating-expert`, `/training-plan-gen`, `/ui-ux-pro-max`, `/web-design-guidelines`.

### MCP servers usados en las sesiones de desarrollo
- **Supabase MCP** (`mcp__supabase__*`): ejecutar SQL, listar tablas/migraciones/extensiones, generar tipos TypeScript, ver logs y *advisors* de seguridad/performance, gestionar Edge Functions.
- **Playwright MCP** (`mcp__playwright__*`): navegación real con Chromium para verificar cada deploy/migración de RLS en producción — imprescindible porque varios bugs graves (bundle roto, recursión RLS) eran invisibles para `curl`/tests de solo-status-HTTP. Ver `scripts/smoke-visual.mjs` como herramienta complementaria de solo-lectura.

Estos MCP se configuran a nivel de sesión/usuario de Claude Code, no están versionados como `.mcp.json` en este repo.

---

## 10. Deploy y entornos

| Entorno | Detalle |
|---|---|
| Frontend | Vercel/VPS propio (Docker) — build `npm run build`, sirve `dist/` con nginx detrás de Traefik |
| Backend | VPS propio (Docker Compose): `backend` (FastAPI), `celery_worker`, `celery_beat`, `flower`, `redis` |
| Base de datos | Supabase Cloud (no self-hosted) |
| Landing page | GitHub Pages, repo separado (`speedskatetrack-landing`) |

Flujo de deploy: commit + push a `dev` en local → SSH al VPS → `git pull origin dev && ./deploy.sh init`. El VPS aloja además otros proyectos ajenos (`djauto-*`, `scale_plan-*`, un Supabase self-hosted de otro proyecto) — los contenedores de este proyecto son únicamente los que empiezan con `skatetrack-*`.

---

## 11. Estado actual (25-ago-2026)

Multi-tenant: **Fases 0 a 7 completas** (fundación, `club_id` + RLS en ~46 tablas, herencia en tablas hija, Storage, backend Celery + LangGraph + FastAPI con filtro de club, Superadmin/onboarding/offboarding, migración completa fuera de `club_settings`).

Pendiente, no bloqueante:
- Dar de alta un 2do club real vía `/superadmin` y correr el checklist completo de `docs/SMOKE_TESTS.md` con 2 clubes simultáneos, como aceptación final del multi-tenant.
- El formulario de "Configuración del Club" (`ClubConfig.tsx`) tiene secciones (redes sociales, staff médico, plantillas de reporte, timezone/idioma) que nunca tuvieron una columna real en base de datos — visibles en el formulario pero no persisten. No es un bug introducido recientemente; es una funcionalidad que nunca se terminó de construir.
- `ANTHROPIC_API_KEY` en producción sigue en placeholder — el chat de agentes/RAG responde 401 hasta que se configure la key real.
- Dominio DNS de la landing page (`speedskatetrack.arkanatech.tech`, GitHub Pages) sin resolver — no relacionado con el VPS.
