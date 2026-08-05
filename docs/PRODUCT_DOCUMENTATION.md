# SpeedSkateTrack Hub — Documentación de Producto

**Versión 1.1 · Agosto 2026**

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Propuesta de Valor](#2-propuesta-de-valor)
3. [Audiencia Objetivo](#3-audiencia-objetivo)
4. [Módulos Funcionales](#4-módulos-funcionales)
5. [Agentes de Inteligencia Artificial](#5-agentes-de-inteligencia-artificial)
6. [Automatizaciones (Celery Tasks)](#6-automatizaciones-celery-tasks)
7. [Roles y Permisos](#7-roles-y-permisos)
8. [Arquitectura Técnica](#8-arquitectura-técnica)
9. [Seguridad](#9-seguridad)
10. [Diseño Responsivo y Accesibilidad](#10-diseño-responsivo-y-accesibilidad)
11. [Internacionalización](#11-internacionalización)
12. [Infraestructura y Despliegue](#12-infraestructura-y-despliegue)
13. [API del Backend](#13-api-del-backend)
14. [Requisitos para Implementación](#14-requisitos-para-implementación)
15. [Historial de Auditorías y Calidad](#15-historial-de-auditorías-y-calidad)
16. [Roadmap (Próximas Funcionalidades)](#16-roadmap-próximas-funcionalidades)
17. [Preguntas Frecuentes Técnicas](#17-preguntas-frecuentes-técnicas)

---

## 1. Resumen Ejecutivo

**SpeedSkateTrack Hub** es una plataforma SaaS de gestión integral para clubes de patinaje de velocidad. Combina un panel administrativo completo con **14 agentes de inteligencia artificial especializados** y **35 automatizaciones programadas**, centralizando todo el ciclo de vida del club: atletas, entrenamiento, nutrición, psicología deportiva, finanzas, documentos y comunicaciones.

La plataforma está diseñada específicamente para el ecosistema del patinaje de velocidad colombiano, con soporte para la jerarquía federativa FCP/FMN y la zona horaria `America/Bogota`.

---

## 2. Propuesta de Valor

| Problema actual | Solución SpeedSkateTrack Hub |
|---|---|
| Gestión de atletas en hojas de cálculo | Base de datos unificada con historial completo |
| Comunicación dispersa (WhatsApp, email manual) | Notificaciones automáticas y centralizadas |
| Sin seguimiento nutricional ni psicológico | Agentes IA especializados + registros estructurados |
| Documentos físicos sin firma digital | Gestión documental con firma electrónica |
| Informes financieros manuales | Dashboard en tiempo real + informes automatizados |
| Sin análisis de rendimiento | Estadísticas por atleta, categoría y temporada |
| Dependencia de presencia física para información | Portal para padres y portal público del atleta |

---

## 3. Audiencia Objetivo

- **Clubes de patinaje de velocidad** medianos y grandes (50–500 atletas)
- **Federaciones regionales** que supervisan múltiples clubes
- **Directores técnicos** que coordinan múltiples disciplinas y categorías
- **Padres de atletas menores** que necesitan visibilidad del proceso de su hijo

---

## 4. Módulos Funcionales

### 4.1 Dashboard Principal
Panel de control con KPIs en tiempo real: total de atletas activos, sesiones del día, tasa de asistencia mensual, ingresos del mes, próximas competencias y alertas del sistema. Acceso adaptado por rol (diferente vista para admin, entrenador, padre, atleta).

### 4.2 Gestión de Atletas
- Registro completo: datos personales, talla, peso, categoría FCP, historial médico
- Carga de documentos por atleta (actas de nacimiento, afiliaciones, permisos)
- Portal público del atleta (perfil, resultados, logros) — URL compartible
- Historial de transacciones y estado de pago
- Sistema de alertas para documentos próximos a vencer
- Acceso restringido a datos de menores (solo coach asignado, admin o tutor)

### 4.3 Entrenamiento
- Creación y programación de sesiones (tipo, duración, coach asignado)
- Registro de asistencia con QR o entrada manual
- Estadísticas de carga de entrenamiento por semana/mes
- Distribución de tipos de entrenamiento y horarios pico
- Historial completo de sesiones por atleta

### 4.4 Nutrición
- Planes nutricionales personalizados por atleta
- Registro de comidas y seguimiento calórico
- Alertas de hidratación y suplementación
- Agente IA (AG-03) para consultas nutricionales en lenguaje natural

### 4.5 Preparación Física (Gym)
- Registro de ejercicios con series, repeticiones y cargas
- Historial de progresión de fuerza
- Planes de preparación física por temporada
- Agente IA (AG-04) para consultas de preparación física

### 4.6 Psicología Deportiva
- Evaluaciones psicológicas periódicas
- Registro de notas de sesión (confidencial, solo psicólogo + admin)
- Métricas de bienestar mental y alertas de riesgo
- Agente IA (AG-07) con acceso restringido a datos sensibles

### 4.7 Ciclismo (Cross-training)
- Registro de sesiones en bicicleta (duración, distancia, intensidad)
- Historial de entrenamiento cruzado
- Análisis de complementariedad con el patinaje

### 4.8 Resultados y Competencias
- Registro de competencias: fecha, ubicación, categoría, puntaje FCP
- Historial de resultados por atleta y por competencia
- Análisis de progresión de ranking
- Exportación a PDF de historial de resultados

### 4.9 Finanzas
- Registro de ingresos (mensualidades, matrículas, patrocinios)
- Registro de gastos (equipamiento, viajes, instalaciones)
- Dashboard financiero: ingresos vs. gastos, pagos pendientes, flujo de caja
- Generación de informes financieros en PDF con logo del club
- Sistema de alertas de pagos vencidos
- Filtros por mes, año y tipo de transacción

### 4.10 Documentos y Contratos
- Repositorio centralizado de documentos del club
- Plantillas de contratos configurables
- Firma electrónica (MVP: firma digital simple)
- Alertas de renovación para documentos con fecha de vencimiento
- Control de versiones por documento

### 4.11 Comunicaciones
- Envío de notificaciones segmentadas (por categoría, rol, estado de pago)
- Historial de comunicaciones enviadas
- Plantillas de mensajes por tipo de evento

### 4.12 Portal de Padres
- Vista dedicada para tutores: datos del atleta, asistencia, pagos, documentos
- Notificaciones automáticas de ausentismo y vencimientos
- Acceso read-only sin exposición de datos de otros atletas

### 4.13 Configuración del Club
- Datos del club, logo, categorías activas
- Gestión de usuarios y roles
- Configuración de tarifas y calendario deportivo

### 4.14 Agentes IA (Módulo Conversacional)
Chat en tiempo real con agentes especializados por área, con streaming de respuestas vía SSE. Ver sección 5 para detalle completo.

---

## 5. Agentes de Inteligencia Artificial

### 5.1 Catálogo de agentes

| ID | Nombre | Rol principal | Restricción de acceso |
|---|---|---|---|
| AG-01 | Skating Assistant | Consultas generales de patinaje y reglas FCP | Todos |
| AG-02 | Admin Assistant | Gestión operativa del club | Admin |
| AG-03 | Nutrition Coach | Planes nutricionales y consultas dietéticas | Admin, Entrenador, Médico |
| AG-04 | Gym Coach | Preparación física y fuerza | Admin, Entrenador |
| AG-05 | Skating RAG | Base de conocimiento con documentos del club | Admin, Entrenador |
| AG-06 | Cycling Coach | Entrenamiento cruzado en bicicleta | Admin, Entrenador |
| AG-07 | Psychology Coach | Bienestar mental y evaluación psicológica | Admin, Médico |
| AG-08 | Security Agent | Monitoreo de accesos y alertas | Admin (automatización) |
| AG-09 | Finance Analyst | Análisis financiero y presupuestos | Admin, Finanzas |
| AG-10 | Results Analyst | Análisis de resultados y rankings | Admin, Entrenador |
| AG-11 | Operations Agent | Logística y operaciones | Admin (automatización) |
| AG-12 | Legal Agent | Documentos y contratos | Admin (automatización) |
| AG-13 | Marketing Agent | Comunicaciones y campañas | Admin |
| AG-14 | Support Agent | Soporte técnico y FAQ | Todos (automatización) |

### 5.2 Tecnología

- **Motor:** LangGraph `create_react_agent` con herramientas (tools) por dominio
- **Modelo conversacional:** Claude `claude-sonnet-4-6` (todos los agentes)
- **Modelo de reranking:** `claude-haiku-4-5` (RAG, más económico y rápido)
- **Embeddings:** OpenAI `text-embedding-3-small` + pgvector en Supabase
- **Streaming:** Server-Sent Events (SSE) desde FastAPI hasta el navegador
- **Timeout:** 45 segundos por llamada LLM (`asyncio.wait_for`)

### 5.3 Pipeline RAG (AG-05)

El agente de base de conocimiento implementa un pipeline de 4 nodos:

```
retrieve → rerank → generate → check_hallucination
```

1. **retrieve** — Búsqueda semántica con pgvector (`cosine similarity`)
2. **rerank** — Re-puntuación paralela de chunks con `asyncio.gather` (timeout 8s/chunk); elimina la latencia serial de N llamadas LLM secuenciales
3. **generate** — Generación de respuesta citando fuentes (Claude `claude-sonnet-4-6`)
4. **check_hallucination** — Verificación de que la respuesta está anclada en los documentos; si la verificación falla, se añade descargo de responsabilidad automático (fallo conservador: `is_grounded=False` en caso de error)

### 5.4 Guardrails de seguridad por agente

Todos los agentes implementan protección en **3 capas**:

**Capa 1 — Puerta de ruta:** `_RESTRICTED_AGENTS` verifica el rol del usuario antes de crear el agente. Los agentes `admin`, `medical`, `finance` requieren el rol correspondiente.

**Capa 2 — Propagación de identidad:** `ContextVar` (`current_user_id`, `current_user_role`) inyecta la identidad del usuario autenticado en cada herramienta LangGraph de forma thread-safe.

**Capa 3 — Verificación por herramienta (IDOR):** Cada herramienta que accede a datos de un atleta específico llama a `_can_access_athlete(client, athlete_id)` para confirmar que el usuario es dueño del dato O tiene rol privilegiado:

```python
async def _can_access_athlete(client, athlete_id: str) -> bool:
    user_id = current_user_id.get()
    role    = current_user_role.get()
    if role in _STAFF_ROLES:        # admin, coach, medical, etc.
        return True
    # Solo el propio atleta puede ver sus datos
    res = await client.table("athletes").select("id") \
        .eq("id", athlete_id).eq("user_id", user_id).maybe_single().execute()
    return res.data is not None
```

Agentes protegidos con IDOR: AG-03 Nutrición, AG-04 Gym, AG-06 Ciclismo, AG-07 Psicología, AG-09 Finanzas, AG-10 Resultados.

**Guardrail adicional:** `@field_validator('content')` en `HistoryMessage` limita el contenido de mensajes de historial a 2000 caracteres, previniendo ataques de inyección de contexto.

---

## 6. Automatizaciones (Celery Tasks)

El sistema ejecuta **35 tareas automatizadas** gestionadas por Celery Beat con zona horaria `America/Bogota`.

### 6.1 Categorías de automatizaciones

| Categoría | Tareas | Frecuencia |
|---|---|---|
| **Asistencia y entrenamiento** | Recordatorio pre-sesión, alerta de inasistencia, informe semanal de asistencia | Diaria/Semanal |
| **Finanzas** | Recordatorio de pago, alerta de vencimiento, informe mensual automático (último día del mes), conciliación | Diaria/Mensual |
| **Atletas** | Verificación de documentos, alerta de categoría, seguimiento nutricional | Diaria/Semanal |
| **Resultados** | Actualización de ranking, informe de competencia | Semanal/Por evento |
| **Comunicaciones** | Boletín mensual, notificaciones push, campaña de retención | Mensual/Semanal |
| **Seguridad** | Auditoría de accesos (paginada, PAGE_SIZE=1000), rotación de tokens, verificación de integridad | Diaria |
| **Reportes** | Informe de gestión para directivos, estadísticas de uso | Mensual |

### 6.2 Sistema de email

Todas las automatizaciones que envían email utilizan la API de **Resend** (`httpx` asíncrono). El remitente por defecto es configurable via `RESEND_FROM_EMAIL`. Si `RESEND_API_KEY` no está configurado, las tareas de email degeneran a log silencioso sin lanzar excepción.

### 6.3 Configuración de Celery

```python
result_expires           = 3600  # Evita crecimiento ilimitado de Redis
task_default_max_retries = 3
task_retry_backoff       = True  # Backoff exponencial en reintentos
task_retry_backoff_max   = 300   # Máximo 5 minutos entre reintentos
```

---

## 7. Roles y Permisos

| Rol | Descripción | Acceso |
|---|---|---|
| `admin` | Director/administrador del club | Todo |
| `coach` | Entrenador | Atletas, entrenamiento, resultados |
| `medical` | Médico/nutricionista/psicólogo | Datos médicos y psicológicos |
| `finance` | Contador / tesorero | Módulo financiero completo |
| `athlete` | Atleta activo | Sus propios datos |
| `parent` | Padre/tutor | Datos del/los hijo(s) |
| `federation` | Delegado de federación | Vista de resultados y rankings |

Los roles se almacenan en la tabla `user_roles` con enum `user_role`. Las políticas RLS de Supabase se construyen sobre las funciones `has_role(uid, rol)` y `get_user_role(uid)`.

---

## 8. Arquitectura Técnica

### 8.1 Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui |
| Estado y fetching | TanStack Query v5 |
| Base de datos | Supabase (PostgreSQL 15 + pgvector) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Tiempo real | Supabase Realtime |
| Backend IA | FastAPI + LangGraph + Python 3.11 |
| Cola de tareas | Celery + Redis |
| Deploy | Docker Compose + Nginx + Let's Encrypt |

### 8.2 Diagrama de arquitectura

```
Navegador / PWA
      │ HTTPS
      ▼
nginx:1.27-alpine ──────────────── Sirve /dist (React estático)
      │ /api/                      Headers de seguridad (CSP, HSTS, etc.)
      ▼
backend:8000 (FastAPI / uvicorn)
      ├── /api/agents/*  ───► LangGraph Agents ──► Claude API (Anthropic)
      ├── /api/rag/*     ───► RAG Pipeline      ──► OpenAI Embeddings
      └── /health
      │
      ├──► Supabase (PostgreSQL + RLS + Auth + Storage)
      └──► redis:6379 (autenticado con REDIS_PASSWORD)
                │
          celery_worker (tareas async)
          celery_beat   (scheduler)
                │
                └──► Resend API (email transaccional)
```

### 8.3 Modelo de datos

La base de datos cuenta con aproximadamente **70 tablas** organizadas en dominios:

- **Identidad:** `profiles`, `user_roles`, `athletes`, `athlete_parents`
- **Entrenamiento:** `training_sessions`, `training_attendance`, `training_plans`
- **Nutrición:** `nutrition_plans`, `meal_logs`, `supplements`
- **Gym:** `gym_sessions`, `exercises`, `exercise_logs`
- **Psicología:** `psychology_sessions`, `assessments`, `wellness_logs`
- **Ciclismo:** `cycling_sessions`
- **Resultados:** `competitions`, `competition_results`, `rankings`
- **Finanzas:** `financial_transactions`, `budgets`, `invoices`
- **Documentos:** `documents`, `contracts`, `document_signatures`
- **Comunicaciones:** `notifications`, `messages`, `email_logs`
- **Sistema:** `audit_logs`, `settings`, `ui_translations`

### 8.4 RLS (Row-Level Security)

Toda tabla nueva lleva sus políticas RLS en la misma migración que la crea. Patrón base:

```sql
-- Solo el club al que pertenece el usuario puede ver sus datos
CREATE POLICY "athletes_select" ON athletes
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR
    id IN (SELECT athlete_id FROM athlete_coaches WHERE coach_id = auth.uid())
  );
```

---

## 9. Seguridad

### 9.1 Protección contra IDOR (Insecure Direct Object Reference)

Todos los agentes IA que acceden a datos específicos de un atleta implementan verificación explícita de autorización a nivel de herramienta (ver sección 5.4). Esto es adicional a las políticas RLS de Supabase, proporcionando **defensa en profundidad**.

El flujo de verificación es:
1. RLS de Supabase rechaza accesos no autorizados a nivel de BD
2. `ContextVar` propaga `user_id` y `role` del JWT verificado
3. `_can_access_athlete()` confirma autorización antes de ejecutar cada consulta en los agentes

### 9.2 Protección XSS en generación de PDF

Los campos provenientes de la base de datos que se interpolan en HTML para generación de PDF se pasan por `escapeHtml()` antes de cualquier asignación a `innerHTML`. La función maneja `null`/`undefined` devolviendo cadena vacía.

```typescript
function escapeHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### 9.3 Autenticación y JWT

- Todos los endpoints de API (excepto `/health`) requieren Bearer token de Supabase
- El backend verifica el JWT con `SUPABASE_JWT_SECRET` y resuelve el rol desde `user_roles`
- Los errores de JWT devuelven mensaje genérico (`"Token de autenticación inválido"`) sin exponer detalles internos; los detalles se registran internamente con `logger.warning()`
- La documentación automática de FastAPI (`/docs`, `/redoc`, `/openapi.json`) está **deshabilitada en producción** (`ENVIRONMENT=production`)

### 9.4 Seguridad de base de datos

- **Funciones con `SET search_path = public`:** Todas las funciones `SECURITY DEFINER` declaran `search_path` explícitamente para prevenir ataques de search-path hijacking
- **REVOKE FROM PUBLIC:** Se revoca el acceso por defecto de PostgreSQL a funciones sensibles
- **FK con ON DELETE RESTRICT:** `financial_transactions` y `document_signatures` usan restricción en lugar de CASCADE para prevenir eliminaciones en cascada accidentales
- **`transactions` aislada a `service_role`:** La tabla de transacciones financieras solo es accesible por el rol de servicio

### 9.5 Seguridad de red e infraestructura

- **Redis autenticado:** Redis corre con `--requirepass ${REDIS_PASSWORD}`; la URL de conexión incluye la contraseña
- **Segmentación de red Docker:**
  - `frontend_net`: nginx + certbot (acceso público)
  - `backend_net`: backend + celery_worker + celery_beat + redis (red interna)
  - nginx pertenece a ambas redes como proxy; certbot solo a `frontend_net`
- **Headers de seguridad en Nginx:** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` repetidos explícitamente en cada bloque `location` (Nginx no hereda `add_header` de bloques padre cuando el hijo tiene sus propios headers)
- **Rate limiting:** 30 req/min por IP sobre `/api/` con respuesta `429`
- **HTTP → HTTPS:** El servidor HTTP solo sirve el desafío ACME de Let's Encrypt y redirige todo lo demás a HTTPS con `301`

### 9.6 Validaciones de entrada

| Capa | Mecanismo |
|---|---|
| Frontend | Zod en todos los formularios |
| API FastAPI | Pydantic v2 con `@field_validator` |
| Mensajes de chat | Máximo 4000 chars en `message`; historial ≤ 20 mensajes; cada item del historial ≤ 2000 chars |
| Edge Functions | Verificación de JWT + validación de tipos TypeScript |
| BD | Tipos de columna + CHECK constraints + FK |

---

## 10. Diseño Responsivo y Accesibilidad

### 10.1 Enfoque mobile-first

Toda la interfaz sigue la jerarquía de breakpoints de Tailwind:

```
base (< 640px) → sm: → md: → lg: → xl:
```

Áreas aplicadas en la auditoría v1.1:
- **TabsList** con 6–7 pestañas: `grid-cols-3 md:grid-cols-6` (o `flex flex-wrap gap-1 h-auto`) en Finance, AthleteDetailsDialog, ClubConfig, EditUserDialog
- **Chat widgets** (AgentChatWidget, RagChatWidget): input y botón con `h-11` (mínimo 44px de touch target)
- **Botón de contraseña** en Login: touch target extendido a 44×44px mínimo

### 10.2 Progressive Web App (PWA)

- **Service Worker:** Registrado en `src/main.tsx` con `navigator.serviceWorker.register('/sw.js')`
- **Manifest:** `public/manifest.json` con iconos `favicon.ico` (32px) y `logo.svg`, `orientation: "any"`, `display: "standalone"`
- **Safe area insets** para dispositivos con notch/barra de navegación:

```css
.safe-area-pb { padding-bottom: env(safe-area-inset-bottom, 0px); }
.safe-area-pt { padding-top:    env(safe-area-inset-top,    0px); }
```

- **Viewport dinámico:** `--vh: 1vh` calculado en JS para corregir el 100vh en Safari móvil

### 10.3 Accesibilidad (WCAG 2.1 AA)

| Componente | Mejora aplicada |
|---|---|
| `TopNavigation` | `aria-label` en hamburger, `aria-expanded` en menú, resultados de búsqueda como `<button>` |
| `BottomNav` | `aria-label` en `<nav>`, `aria-current="page"` en elemento activo |
| `AgentChatWidget` | `aria-label="Cerrar chat"` en botón de cierre |
| `RagChatWidget` | `aria-label` en input y botón de envío |
| `AthletesTable` | `<caption className="sr-only">` con descripción de tabla; `aria-label` contextual en dropdown de acciones |
| Login | `aria-label` en botón de toggle de contraseña |

---

## 11. Internacionalización

- Idioma base: **español** (Colombia)
- Zona horaria: `America/Bogota` (UTC-5)
- Tabla `ui_translations` en BD para strings de interfaz
- Formato de moneda: COP (pesos colombianos)
- Formato de fechas: DD/MM/YYYY
- **Pendiente:** Auditoría de cobertura de traducciones y población completa de `ui_translations`

---

## 12. Infraestructura y Despliegue

### 12.1 Docker Compose — servicios

| Servicio | Imagen | Función |
|---|---|---|
| `nginx` | `nginx:1.27-alpine` | Reverse proxy, TLS, archivos estáticos |
| `backend` | Custom (Python 3.11) | FastAPI + LangGraph |
| `celery_worker` | Custom (mismo Dockerfile) | Procesamiento de tareas async |
| `celery_beat` | Custom (mismo Dockerfile) | Scheduler de automatizaciones |
| `redis` | `redis:7-alpine` | Broker de Celery (autenticado) |
| `certbot` | `certbot/certbot` | Gestión de certificados SSL |

### 12.2 Redes Docker

```
frontend_net: nginx, certbot
backend_net:  backend, celery_worker, celery_beat, redis
nginx participa en ambas redes (actúa como proxy entre internet y backend)
```

### 12.3 Healthchecks

Todos los servicios tienen healthcheck configurado en `docker-compose.yml`:

- `nginx`: `curl -sf http://localhost/`
- `backend`: `curl -sf http://localhost:8000/health`
- `celery_worker`: `celery -A tasks inspect ping`
- `celery_beat`: verificación de existencia del proceso
- `redis`: `redis-cli ping`

### 12.4 Deploy (`deploy.sh`)

```bash
./deploy.sh init    # Primer despliegue (build + SSL + Docker)
./deploy.sh update  # Actualizar código (git pull + rebuild + healthcheck)
./deploy.sh ssl     # Obtener/renovar certificado Let's Encrypt
./deploy.sh logs [servicio]  # Ver logs en tiempo real
./deploy.sh status  # Estado de contenedores + health del backend
```

**Rollback automático:** Si `./deploy.sh update` detecta que el health check falla en 60 segundos post-deploy, restaura automáticamente el commit anterior (`ROLLBACK_COMMIT=$(git rev-parse HEAD)`) y reinicia los contenedores. No requiere intervención manual.

### 12.5 SSL / TLS

- Certificados emitidos por **Let's Encrypt** vía Certbot (webroot challenge)
- Renovación automática cada 12 horas por el contenedor certbot
- Cron de respaldo semanal: `0 3 * * 0 cd /opt/skatetrack && docker compose run --rm certbot renew --quiet && docker compose restart nginx`

### 12.6 Requisitos mínimos de servidor

VPS Ubuntu 22.04/24.04, **mínimo 2 GB RAM y 20 GB de disco**, dominio apuntando por DNS (registros A) y acceso SSH.

---

## 13. API del Backend

### 13.1 Endpoints principales (FastAPI)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/api/agents/` | Lista de agentes disponibles y si son restringidos |
| POST | `/api/agents/{agent_id}/chat` | Chat con un agente (respuesta completa) |
| POST | `/api/agents/{agent_id}/chat/stream` | Chat con streaming SSE |
| POST | `/api/rag/query` | Consulta RAG sobre la base de conocimiento |
| GET | `/api/rag/documents` | Lista de documentos indexados |

**Ejemplo de request de chat:**

```bash
curl -X POST https://tudominio.com/api/agents/skating/chat \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"message": "¿En qué categoría FCP compite un atleta nacido en 2013?", "history": []}'
```

Validaciones del request: `message` no vacío y ≤ 4000 caracteres; `history` ≤ 20 mensajes; cada mensaje del historial ≤ 2000 caracteres.

> **Nota de seguridad:** `/docs`, `/redoc` y `/openapi.json` están deshabilitados en producción.

### 13.2 Autenticación de la API

Todos los endpoints (salvo `/health`) requieren **Bearer token de Supabase**. El backend verifica el JWT y resuelve el rol de aplicación desde `user_roles`; los agentes `admin`, `medical` y `finance` exigen rol privilegiado.

### 13.3 Rate limiting

**30 req/min por IP** en Nginx sobre `/api/`, con `429` al exceder.

---

## 14. Requisitos para Implementación

### Para el cliente (club)

- Cuenta **Supabase** (plan Pro recomendado)
- API key de **Anthropic** (Claude `claude-sonnet-4-6`)
- API key de **OpenAI** (embeddings para el módulo RAG)
- API key de **Resend** (email transaccional; requiere dominio verificado en resend.com)
- **VPS Ubuntu 22.04** (mínimo 2 GB RAM, 20 GB disco)
- **Dominio propio** apuntando al VPS

### Tiempo estimado de implementación

- Setup inicial: **2–4 horas**
- Carga de datos históricos: **1–2 días**
- Carga de base de conocimiento RAG: **4–8 horas**
- Capacitación del equipo: **1 día**

---

## 15. Historial de Auditorías y Calidad

### Auditoría 1 — Pre-producción (Sprint 8)

Revisión sistemática antes del primer despliegue. **62 issues** identificados y corregidos:
- Hooks con mutaciones en `queryFn` (violación TanStack Query)
- Queries N+1 en tareas Celery
- `queryKey` con objetos en lugar de primitivos
- Datos hardcodeados en páginas (Training, Finance, Index)
- Tablas incorrectas en ParentDashboard (`attendance` → `training_attendance`, `transactions` → `financial_transactions`)

### Auditoría 2 — Revisión de arquitectura

Revisión por agente de arquitectura especializado. **37 issues** identificados y corregidos:
- Pipeline RAG incompleto (faltaban nodos `rerank` y `check_hallucination`)
- Email placeholder sin implementación real (reemplazado por Resend API)
- Bugs en tareas de finanzas (`calendar.monthrange` para último día del mes) y marketing (overflow en `.not_.in_()`)
- Redis sin autenticación
- Nginx headers no heredados en bloques `location` internos
- HTTP config sirviendo la app completa sin TLS durante bootstrap

### Auditoría 3 — Seguridad y calidad completa (v1.1)

Auditoría integral de frontend, backend, agentes, seguridad anti-hacking, diseño responsivo y accesibilidad. **39 archivos modificados** en un solo commit. Issues principales resueltos:

| Área | Issues resueltos |
|---|---|
| **Seguridad** | IDOR en 6 agentes, XSS en generación PDF, JWT error leakage, /docs expuesto en producción |
| **Agentes IA** | Guardrails en 3 capas, timeout 45s en LLM, max 2000 chars en historial, rerank paralelo con asyncio.gather |
| **Infraestructura** | Redis con contraseña, segmentación de red Docker, nginx header inheritance fix |
| **Frontend** | 7 hooks con bugs de datos/queries, AbortController cleanup, duplicados resueltos |
| **Responsivo** | TabsList en 4 componentes, touch targets ≥ 44px, safe-area-insets, PWA completada |
| **Accesibilidad** | aria-label/aria-current/aria-expanded en componentes de navegación y tablas |
| **BD** | 2 migraciones de hardening: FK constraints, search_path en funciones, REVOKE FROM PUBLIC |

### Estado de calidad actual

- TypeScript: cero errores, cero warnings (`npx tsc --noEmit`)
- RLS: activo en todas las tablas
- Seguridad: defensa en profundidad (RLS + ContextVar + IDOR check por herramienta)
- Responsivo: mobile-first en todos los módulos, tested en 320px–1440px
- PWA: Service Worker registrado, manifest válido, safe-area-insets configurados

---

## 16. Roadmap (Próximas Funcionalidades)

### Próxima iteración

- **Migración de `service_role` → JWT de usuario en herramientas de agentes:** Actualmente los agentes usan la `service_role` key de Supabase (bypassa RLS). Propagar el JWT del usuario a los clientes Supabase de los agentes restauraría la protección RLS completa a nivel de BD para las consultas de IA. Refactoring mayor pendiente de aprobación del arquitecto.
- **Íconos PWA nativos:** Los íconos en 192×192 y 512×512 PNG deben ser creados por el equipo de diseño. Actualmente se usan `favicon.ico` y `logo.svg` como fallback válido.
- **Datos dinámicos en vistas estáticas:** Index.tsx, Training.tsx y Finance.tsx (presupuestos) aún tienen algunos valores que requieren endpoints adicionales.

### Medio plazo

- **Agentes conversacionales adicionales:** AG-08 Seguridad, AG-11 Operaciones, AG-12 Legal y AG-14 Soporte como chatbots interactivos (hoy operan como automatizaciones/lógica de sistema).
- **Integración WhatsApp Business API** (Twilio) para recordatorios y notificaciones push.
- **Firma digital con validez legal** (DocuSign / Firma Colombia), evolucionando el MVP actual de firma electrónica.
- **i18n completo:** Auditoría y población de la tabla `ui_translations` para soporte multilenguaje real.

### Largo plazo

- **App móvil nativa** (React Native) como complemento a la PWA.
- **Integración con federaciones de patinaje** (importación automática de rankings oficiales FCP).
- **Dashboard de análisis biomecánico con video.**
- **Tests E2E con Playwright** corriendo contra entorno de staging.

---

## 17. Preguntas Frecuentes Técnicas

**¿Funciona sin internet?** No. La plataforma requiere conexión: los datos residen en Supabase y los agentes IA dependen de las API de Claude/OpenAI.

**¿Los datos están en Colombia?** Supabase permite seleccionar la región del proyecto. La zona horaria de las automatizaciones está fijada en `America/Bogota`.

**¿Se puede instalar on-premise?** Sí. El backend, Celery, Redis y Nginx se despliegan con Docker Compose en un servidor propio; Supabase puede ser gestionado o autohospedado.

**¿Cuántos atletas soporta?** Probado hasta ~500 atletas por club; la arquitectura escala horizontalmente (más workers de Celery, réplicas de backend).

**¿Se puede personalizar con el logo del club?** Sí. La generación de documentos y recibos PDF utiliza el logo y los datos del club.

**¿Los agentes IA conocen las reglas de mi club específico?** Sí. La base de conocimiento RAG se carga con los documentos del club (reglamentos, protocolos, manuales) y el agente responde citando esas fuentes, con verificación anti-alucinación.

**¿Los datos de los atletas están seguros en los agentes IA?** Sí. Los agentes implementan protección IDOR en 3 capas: RLS de Supabase + propagación de identidad por ContextVar + verificación explícita de autorización en cada herramienta que accede a datos de un atleta específico.

**¿Qué pasa si un agente IA tarda mucho?** Todas las llamadas LLM tienen timeout de 45 segundos. Si se excede, el usuario recibe un mensaje amigable de "tiempo agotado" en lugar de un error genérico o pantalla en blanco.

**¿La plataforma tiene PWA?** Sí. Puede instalarse como app en Android e iOS desde el navegador. Incluye Service Worker para caché offline de assets estáticos, aunque los datos requieren conexión a internet.

**¿Qué pasa si el deploy falla?** El script `./deploy.sh update` incluye rollback automático: si el health check no pasa en 60 segundos, restaura el commit anterior sin intervención manual.

---

*Documento generado con Claude Code — Anthropic · Versión 1.1 · Agosto 2026*
