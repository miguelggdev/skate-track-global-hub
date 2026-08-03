# SpeedSkateTrack Hub — Documentación Completa del Producto

**Versión:** 1.0
**Fecha:** Agosto 2026
**Estado:** Producción
**Stack:** React 18 + TypeScript + Supabase (PostgreSQL 15 + pgvector) + LangGraph + FastAPI + Celery + Claude API

---

## 1. Resumen Ejecutivo

**SpeedSkateTrack Hub** es una plataforma integral de gestión para clubes de patinaje de velocidad que unifica en un solo sistema la administración de atletas, entrenamientos, competencias, finanzas, salud deportiva y comunicaciones. Sobre esa base operativa, la plataforma incorpora una red de **agentes de inteligencia artificial especializados** construidos con LangGraph y Claude, y un **catálogo de 35 automatizaciones** que ejecutan tareas recurrentes sin intervención manual.

A diferencia de las herramientas fragmentadas que hoy usan la mayoría de clubes (Excel, WhatsApp, cuadernos y planillas sueltas), SpeedSkateTrack Hub centraliza toda la información del club en una base de datos única, segura y consultable en lenguaje natural. Un administrador puede preguntar "¿cuántos atletas de categoría juvenil pagaron este mes?" y obtener la respuesta en segundos; un entrenador puede pedir orientación técnica sobre periodización; un atleta puede consultar su plan nutricional; y el sistema, por su cuenta, envía recordatorios de entrenamiento, alertas de cartera morosa y felicitaciones de cumpleaños.

La propuesta de valor central es **recuperar tiempo y decidir con datos**: automatizar la carga administrativa repetitiva, dar a cada rol una asistencia experta disponible 24/7, y convertir la información dispersa del club en decisiones deportivas y financieras informadas.

### 1.1 Para quién es (buyer personas)

| Persona | Rol | Qué gana con la plataforma |
|---------|-----|----------------------------|
| **Administrador de club** | `admin` | Visión 360° del club, briefings automáticos, reportes ejecutivos, asistente conversacional con acceso a toda la data |
| **Entrenador** | `coach` | Asistencia técnica IA, seguimiento de asistencia y progreso, planes de carga de entrenamiento |
| **Líder deportivo / directivo** | `leader` | KPIs consolidados, reportes de rendimiento, proyecciones financieras |
| **Atleta** | `athlete` | Perfil deportivo completo, calendario, resultados, ranking interno, asistentes de nutrición y preparación física |
| **Padre / tutor** | `parent` | Seguimiento del atleta a cargo, documentos, pagos, notificaciones |
| **Delegado** | `delegate` | Gestión de un grupo de atletas: competencias, pagos, reportes |

### 1.2 Métricas de impacto esperadas

| KPI | Baseline | Meta 6 meses |
|-----|----------|--------------|
| Tiempo en tareas administrativas | 15 h/semana | 4 h/semana |
| Satisfacción de padres (NPS) | 45 | 75+ |
| Asistencia promedio | 78 % | 90 %+ |
| Retención anual de atletas | 72 % | 88 %+ |
| Tiempo de respuesta a consultas | 4 h promedio | < 5 minutos |
| Resultados cargados < 1 h post-competencia | 20 % | 100 % |

---

## 2. Problema que Resuelve

Los clubes de patinaje de velocidad operan hoy con un mosaico de herramientas desconectadas. Los datos de atletas viven en hojas de cálculo; la comunicación con padres ocurre en grupos de WhatsApp; los pagos se anotan en cuadernos; los resultados de competencias se pierden o se cargan semanas después. Este *status quo* tiene un costo real y medible.

**Pain points principales:**

- **Pérdida de información histórica.** Cuando un entrenador se va o un archivo de Excel se corrompe, se pierde el historial deportivo, médico y financiero de los atletas.
- **Descoordinación.** Entrenadores, dirección y padres trabajan con versiones distintas de la misma información. Nadie tiene la foto completa.
- **Decisiones a ciegas.** Sin datos consolidados es imposible saber qué atletas están progresando, cuáles están en riesgo de deserción o cómo se comporta la caja del club.
- **Carga administrativa que roba tiempo al deporte.** Recordatorios manuales, cobros, generación de documentos y reportes consumen decenas de horas al mes que deberían dedicarse al entrenamiento.
- **Falta de seguimiento personalizado.** Cada atleta es un caso único (carga de entrenamiento, nutrición, lesiones, progreso), pero el seguimiento individual es inviable sin sistemas.

**Costo del status quo:** un club promedio dedica alrededor de **120 horas/mes** a tareas administrativas dispersas. Además, la falta de seguimiento de cartera y de retención se traduce en ingresos perdidos y en atletas que abandonan sin que nadie lo detecte a tiempo.

---

## 3. Solución — Visión General

SpeedSkateTrack Hub es una aplicación web (React + TypeScript) respaldada por Supabase para datos, autenticación y almacenamiento, y por un backend de agentes IA en Python (FastAPI + LangGraph + Celery) que aporta la capa conversacional y las automatizaciones.

### 3.1 Diagrama de arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│   React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui    │
│   TanStack Query · Recharts · jsPDF · React Hook Form + Zod  │
└───────────────┬──────────────────────────┬───────────────────┘
                │ (SDK Supabase)           │ (REST / SSE)
                ▼                          ▼
┌───────────────────────────┐   ┌──────────────────────────────┐
│   SUPABASE (BaaS)         │   │  BACKEND IA (FastAPI)        │
│  PostgreSQL 15 + pgvector │   │  LangGraph · Claude API      │
│  Auth (JWT) · Storage     │◄──┤  Agentes conversacionales    │
│  Row Level Security       │   │  Pipeline RAG                │
│  ~70 tablas               │   │  Celery + Redis (35 autos)   │
└───────────────────────────┘   └──────────────────────────────┘
```

### 3.2 Módulos principales

Dashboards por rol · Gestión de atletas · Entrenamientos · Competencias · Finanzas · Módulo médico · Documentos · Equipamiento · Mensajería y notificaciones · Portal RAG / base de conocimiento · Red de 10 agentes IA conversacionales · 35 automatizaciones programadas.

---

## 4. Módulos Funcionales

### 4.1 🛠️ Dashboard Administrador

**Rol:** `admin`. Vista central del club. Consolida KPIs de atletas, asistencia, finanzas y competencias, con acceso al asistente conversacional administrativo (agente `admin`) que consulta la base de datos en tiempo real. Página: `AdminDashboard.tsx`.

### 4.2 🏋️ Dashboard Entrenador

**Rol:** `coach`. Muestra los atletas asignados, sesiones de entrenamiento de la semana, asistencia y progreso. Acceso a los agentes técnicos (patinaje, nutrición, gym, ciclismo, psicología). Página: `CoachDashboard.tsx`.

### 4.3 🛼 Dashboard Atleta

**Rol:** `athlete`. Perfil deportivo, calendario personal de entrenamientos y competencias, resultados propios, ranking interno y acceso a los asistentes de patinaje, nutrición y preparación física. Páginas: `AthleteDashboard.tsx`, `AthleteTraining.tsx`, `AthleteCompetitions.tsx`.

### 4.4 👨‍👩‍👧 Dashboard Padres/Tutores

**Rol:** `parent`. Seguimiento del/los atleta(s) a cargo: asistencia, resultados, documentos pendientes y pagos. La relación se modela en la tabla `parent_athletes`. Página: `ParentDashboard.tsx`.

### 4.5 🎖️ Dashboard Líder Deportivo

**Rol:** `leader`. KPIs consolidados, reportes de rendimiento y evolución del club. Página: `LeaderDashboard.tsx`. Existe además un rol `delegate` con su propio conjunto de vistas (`DelegateDashboard.tsx`, `DelegateAthletes.tsx`, `DelegateCompetitions.tsx`, `DelegatePayments.tsx`, `DelegateReports.tsx`, `DelegateTraining.tsx`) para la gestión de un grupo de atletas.

### 4.6 📇 Gestión de Atletas

Perfil deportivo completo respaldado por múltiples tablas: datos personales y corporales (`athletes`, `athlete_body_info`), familia (`athlete_family`), estudios (`athlete_studies`), equipamiento (`athlete_equipment`, `athlete_wheels`), historial (`athlete_history`), galería de fotos (`athlete_gallery`), redes sociales (`athlete_socials`) y competencias internacionales (`athlete_international_competitions`). Incluye una vista consolidada tipo hoja de vida deportiva y una página pública de carné del atleta con QR (`AthleteCardPublic.tsx`, `PublicAthletePage.tsx`). Páginas: `Athletes.tsx`, `EvaluationsPage.tsx`.

### 4.7 🗓️ Gestión de Entrenamientos

Sesiones (`training_sessions`), asistencia (`training_attendance`, `attendance`), indicadores de entrenamiento (`training_kpis`) y calendario. Páginas: `Training.tsx`, `TrainingCalendar.tsx`, `AthleteTraining.tsx`.

### 4.8 🏆 Gestión de Competencias

Registro de competencias y eventos (`competitions`, `competition_events`, `race_events`), inscripciones (`competition_registrations`), resultados individuales y de relevos (`competition_results`, `relay_teams`, `relay_team_members`, `relay_results`), tiempos (`time_records`), tablas de puntos (`point_tables`), ligas y clasificaciones (`leagues`, `league_stages`, `league_standings`), atletas externos (`external_athletes`) e importación de resultados (`result_imports`). Páginas: `Competitions.tsx`, `Tiempos.tsx`.

### 4.9 💰 Módulo Financiero

Transacciones de ingresos y egresos (`financial_transactions`, `transactions`), con reportes y proyecciones. El agente `finance` responde consultas sobre balance del mes en tiempo real. Páginas: `Finance.tsx`, `FinanceDashboard.tsx`, `DelegatePayments.tsx`, `Reports.tsx`.

### 4.10 🩺 Módulo Médico

Historial de sesiones médicas y lesiones (`medical_sessions`), registro de vacunas (`vaccine_records`) y evaluaciones físicas (`physical_fitness_tests`). El agente `medical` (rol restringido) da orientación en salud, lesiones y protocolos de retorno al deporte. Página: `MedicalPage.tsx`.

### 4.11 📄 Módulo de Documentos

Gestión documental (`documents`, `user_documents`, `document_templates`), generación de PDF en el frontend (jsPDF), firmas digitales en fase MVP (`document_signatures`) y documentación para federación (`federation_documents`). Página: `Documents.tsx`.

### 4.12 🧰 Módulo de Equipamiento

Inventario del club y del atleta (`equipment`, `athlete_equipment`, `athlete_wheels`) y mantenimiento (`equipment_maintenance`). Página: `EquipmentPage.tsx`.

### 4.13 ✉️ Sistema de Mensajería y Notificaciones

Mensajería interna (`messages`), notificaciones (`notifications`) y registro de envíos de las automatizaciones (`notification_log`). El correo transaccional se envía mediante Resend. Página: `MessagesPage.tsx`.

### 4.14 📚 Portal RAG / Base de Conocimiento

Consulta en lenguaje natural sobre los documentos del club. Los documentos se ingieren y trocean en `knowledge_documents` y `document_chunks` (con embeddings en pgvector), y el pipeline RAG responde citando las fuentes. Página: `AgentChat.tsx` (interfaz de chat con agentes y RAG).

---

## 5. Red de Agentes IA — Agentes Conversacionales

> **Nota de alcance (validada contra el código):** el backend expone actualmente **10 agentes conversacionales** operativos vía la API (`/api/agents`). El documento maestro contempla 14 agentes en total; los 4 restantes (Seguridad, Operaciones, Legal, Soporte) operan hoy como **automatizaciones** y lógica de sistema, no como chatbots, y su versión conversacional está en el Roadmap (sección 14). Todos los agentes conversacionales usan **Claude (`claude-sonnet-4-6`)** vía LangGraph; el pipeline RAG usa además `claude-haiku-4-5` para rerank y verificación.

Cada agente se define en `backend/agents/` y se registra en `api/routes/agents.py`. Los agentes marcados como **restringidos** solo son accesibles por roles privilegiados (`admin`, `coach`, `leader`, `delegate`, `finance`).

| ID (API) | Nombre | Especialidad | Acceso | Restringido |
|----------|--------|--------------|--------|-------------|
| `admin` | Asistente Administrativo | Consulta atletas, finanzas y competencias en tiempo real (herramientas a BD) | Roles privilegiados | Sí |
| `skating` | Experto en Patinaje | Reglas FCP, técnica, categorías, equipamiento, entrenamiento | Todos | No |
| `nutrition` | Nutricionista Deportivo | Planes nutricionales, hidratación, suplementación | Todos | No |
| `gym` | Preparador Físico | Fuerza, pliometría, prevención de lesiones | Todos | No |
| `medical` | Medicina Deportiva | Salud, lesiones, protocolos de retorno | Roles privilegiados | Sí |
| `cycling` | Experto en Ciclismo | Entrenamiento cruzado para potenciar el patinaje | Todos | No |
| `psychology` | Psicólogo Deportivo | Preparación mental, ansiedad, concentración | Todos | No |
| `finance` | Asesor Financiero | Ingresos, egresos, pagos pendientes, metas | Roles privilegiados | Sí |
| `marketing` | Marketing y Comunicación | Contenido para redes, comunicados, crecimiento | Todos | No |
| `results` | Analista de Resultados | Resultados, rankings, historial y análisis de rendimiento | Todos | No |

### 5.1 Detalle de agentes destacados

**Asistente Administrativo (`admin`)** — Construido como *ReAct agent* de LangGraph con herramientas que consultan Supabase en vivo: resumen de atletas por categoría y estado, resumen financiero del mes, próximas competencias y sesiones de entrenamiento de ±7 días. Responde en español con cifras formateadas.
*Ejemplo:* "¿Cuál es el balance financiero de este mes y cuántos atletas están activos?"

**Experto en Patinaje (`skating`)** — Conoce las **categorías de la Federación Colombiana de Patinaje (FCP)** por edad y tamaño máximo de rueda, las pruebas de pista/maratón/carretera y el circuito colombiano. Incluye herramientas para calcular categoría por fecha de nacimiento (corte al 1 de julio) y el tamaño máximo de rueda por categoría.
*Ejemplo:* "¿En qué categoría FCP compite un atleta nacido en 2013 y qué rueda máxima puede usar?"

**Nutricionista / Preparador Físico / Psicólogo / Ciclismo** — Agentes especializados que orientan a atletas y entrenadores según su dominio.
*Ejemplo (nutrición):* "Arma un plan de hidratación para una competencia de 10 km en clima cálido."

**Analista de Resultados (`results`)** — Analiza resultados de competencias, rankings e historial de rendimiento.
*Ejemplo:* "¿Cómo evolucionaron mis tiempos de 500 m en los últimos tres meses?"

---

## 6. Catálogo de Automatizaciones — Las 35 Automatizaciones

Todas las automatizaciones se orquestan con **Celery Beat** (zona horaria `America/Bogota`) y están centralizadas en `backend/tasks/schedules.py`. Las que dependen de eventos (marcadas *event-driven*) se disparan desde hooks de base de datos o de autenticación mediante `.delay(...)`. El canal de salida típico es notificación in-app + email (Resend), y en varios casos generación de PDF/reporte.

### 6.1 Calendario y Entrenamientos (AUTO-01 a AUTO-06)

| ID | Trigger | Qué hace | Salida |
|----|---------|----------|--------|
| AUTO-01 | Diario 19:00 | Recordatorio del entrenamiento del día siguiente | Notif + email |
| AUTO-02 | Cada 30 min | Recordatorio ~2 h antes de la sesión | Notif |
| AUTO-03 | Lunes 08:00 | Detecta huecos en el calendario y sugiere sesiones | Notif admin/coach |
| AUTO-04 | Event-driven | Gestión de inasistencias (alertas por rachas) | `attendance_alerts` |
| AUTO-05 | Event-driven | Lista de espera inteligente al liberarse cupo | Notif atleta |
| AUTO-06 | Viernes 20:00 | Análisis semanal de carga de entrenamiento | Reporte coach |

### 6.2 Facturación y Finanzas (AUTO-07 a AUTO-11)

| ID | Trigger | Qué hace | Salida |
|----|---------|----------|--------|
| AUTO-07 | Event-driven (insert income) | Genera recibo de pago | PDF + email |
| AUTO-08 | Día 1 y 15, 09:00 | Alertas de cartera morosa por antigüedad | Notif + email |
| AUTO-09 | Diario 22:00 | Cierre de caja diario | `daily_reports` |
| AUTO-10 | Días 28–31, 18:00 | Proyección financiera mensual (verifica fin de mes) | Reporte directivo |
| AUTO-11 | Diario 08:00 | Recordatorio de renovación de membresía | Notif + email |

### 6.3 Seguimiento de Atletas (AUTO-12 a AUTO-15)

| ID | Trigger | Qué hace | Salida |
|----|---------|----------|--------|
| AUTO-12 | Event-driven (nuevo resultado) | Seguimiento post-competencia | Notif atleta/coach |
| AUTO-13 | Lunes 10:00 | Recordatorio de evaluación física semestral | Notif |
| AUTO-14 | Event-driven (lesión) | Protocolo de lesión y recuperación | Notif coach |
| AUTO-15 | Lunes 07:00 | Monitoreo semanal de progreso | Resumen |

### 6.4 Administrativas (AUTO-16 a AUTO-20)

| ID | Trigger | Qué hace | Salida |
|----|---------|----------|--------|
| AUTO-16 | Lun–Vie 07:30 | Briefing matutino del administrador | Notif + dashboard |
| AUTO-17 | Lun–Sáb 21:00 | Resumen de fin de día | Notif directivo |
| AUTO-18 | Diario 09:00 | Gestión de documentos vencidos | Notif |
| AUTO-19 | Lunes 06:00 | Control de equipamiento e inventario | Notif admin |
| AUTO-20 | Event-driven (nuevo atleta) | Generación de carnets y documentos | PDF |

### 6.5 Marketing y Retención (AUTO-21 a AUTO-25)

| ID | Trigger | Qué hace | Salida |
|----|---------|----------|--------|
| AUTO-21 | Diario 07:00 | Felicitación de cumpleaños | Notif + email |
| AUTO-22 | Día 1 y 15, 10:00 | Reactivación de atletas inactivos | `retention_campaigns` |
| AUTO-23 | Trimestral (1 ene/abr/jul/oct) | Encuesta de satisfacción NPS | `satisfaction_surveys` |
| AUTO-24 | Event-driven (+24 h tras top-3) | Solicitud de testimonio | `athlete_testimonials` |
| AUTO-25 | 1 oct 09:00 | Campaña de pre-inscripción de temporada | Campaña email |

### 6.6 Reportes y Análisis (AUTO-26 a AUTO-29)

| ID | Trigger | Qué hace | Salida |
|----|---------|----------|--------|
| AUTO-26 | Domingo 20:00 | Reporte semanal ejecutivo para el directivo | PDF/email |
| AUTO-27 | Día 1, 08:00 | Reporte mensual de rendimiento deportivo | Reporte |
| AUTO-28 | 1 ago 09:00 | Documentación de inscripción federativa | `federation_documents` |
| AUTO-29 | Domingo 23:00 | Análisis predictivo de rendimiento | `athlete_performance_predictions` |

### 6.7 Seguridad y Comunicación (AUTO-30 a AUTO-35)

| ID | Trigger | Qué hace | Salida |
|----|---------|----------|--------|
| AUTO-30 | Event-driven (Auth hook) | Monitoreo de accesos sospechosos | `security_audit_log` / `blocked_ips` |
| AUTO-31 | Diario 03:00 | Verificación de backups | `backup_log` |
| AUTO-32 | Domingo 04:00 | Auditoría de acceso a datos sensibles | Reporte auditoría |
| AUTO-33 | Diario 02:00 | Rotación de sesiones inactivas | Reporte |
| AUTO-34 | Event-driven | Notificaciones en tiempo real | Notif |
| AUTO-35 | Diario 23:30 | Resumen diario de actividad de agentes | `agent_activity_log` |

---

## 7. Roles y Permisos

El rol de aplicación se almacena en la tabla `user_roles` (ENUM `user_role`) y se resuelve con las funciones `has_role(auth.uid(), 'rol')` y `get_user_role(auth.uid())`. El backend valida el rol de forma independiente al JWT antes de dar acceso a agentes restringidos. Los roles privilegiados (`admin`, `coach`, `leader`, `delegate`, `finance`) tienen acceso a datos sensibles.

| Rol | Descripción | Acceso a módulos | Agentes disponibles |
|-----|-------------|------------------|---------------------|
| `admin` | Administrador del club, control total | Todos | Todos (incluye `admin`, `medical`, `finance`) |
| `coach` | Entrenador con atletas asignados | Atletas asignados, entrenamientos, competencias, médico | Todos los especializados + restringidos |
| `leader` | Líder/directivo deportivo | Dashboards, reportes, rendimiento, finanzas | Todos incl. restringidos |
| `delegate` | Delegado de un grupo de atletas | Atletas del grupo, competencias, pagos, reportes | Especializados + restringidos |
| `athlete` | Deportista | Su perfil, entrenamientos, resultados, ranking | Agentes no restringidos (skating, nutrition, gym, cycling, psychology, marketing, results) |
| `parent` | Padre/tutor | Atleta(s) a cargo, documentos, pagos | Agentes no restringidos |

---

## 8. Arquitectura Técnica

### 8.1 Stack tecnológico

| Capa | Tecnología | Versión de referencia |
|------|------------|------------------------|
| Frontend | React + TypeScript + Vite | React 18, TS estricto |
| UI | Tailwind CSS + shadcn-ui | — |
| Datos frontend | TanStack Query, React Hook Form + Zod | — |
| Visualización / export | Recharts, jsPDF, XLSX | — |
| BaaS | Supabase (PostgreSQL 15 + pgvector) | pgvector ≥ 0.3 |
| Backend IA | FastAPI + LangGraph + LangChain | fastapi ≥ 0.115, langgraph ≥ 0.2 |
| LLM | Claude `claude-sonnet-4-6` (agentes), `claude-haiku-4-5` (rerank/check) | anthropic SDK |
| Embeddings RAG | OpenAI `text-embedding-3-small` | — |
| Tareas asíncronas | Celery + Redis | celery ≥ 5.4, redis ≥ 5.0 |
| Infraestructura | Docker Compose + Nginx + Let's Encrypt | Ubuntu 22.04/24.04 |

### 8.2 Diagrama de componentes

```
[ Navegador ] ──HTTPS──► [ Nginx ] ──► /dist (React estático)
                             │
                             ├── /api/ ──► [ FastAPI (uvicorn) ]
                             │                 ├─ /agents  (LangGraph + Claude)
                             │                 ├─ /rag     (pipeline RAG)
                             │                 └─ /health
                             │
                          [ Redis ] ◄── [ Celery worker ] + [ Celery beat ]
                             │
[ Supabase ] ◄── SDK ── (frontend)  y  service key ── (backend)
```

### 8.3 Flujo de datos

1. El usuario interactúa con el frontend React; el fetching de datos operativos va directo a Supabase con el SDK y RLS (autenticado por JWT).
2. Para IA, el frontend llama a la API FastAPI enviando el **Bearer token de Supabase**.
3. FastAPI verifica el JWT, resuelve el rol de app desde `user_roles`, fija el contexto de usuario y ejecuta el grafo LangGraph correspondiente.
4. El agente consulta Supabase (herramientas) y/o el índice vectorial, invoca a Claude y devuelve la respuesta (completa o por **streaming SSE**).

### 8.4 Sistema de agentes IA (LangGraph + streaming SSE)

Los agentes heredan de `BaseAgent`, que instancia `ChatAnthropic(model="claude-sonnet-4-6")`. Los agentes con herramientas (p. ej. `admin`) se compilan una vez con `create_react_agent` de LangGraph. El endpoint de streaming emite eventos `text/event-stream` con tokens en formato `data: {"token": "..."}` y cierra con `data: [DONE]`. La identidad del usuario se propaga de forma segura mediante `ContextVar` (`current_user_id`, `current_user_role`), evitando fugas entre requests concurrentes.

### 8.5 Sistema RAG (retrieval → rerank → generación → verificación anti-alucinación)

El grafo RAG (`backend/agents/skating_rag/graph.py`) encadena cuatro nodos:

1. **retrieve** — genera el embedding de la pregunta (OpenAI `text-embedding-3-small`) y busca los chunks más relevantes en pgvector vía la función `match_document_chunks` (umbral 0.70, top 5).
2. **rerank** — reordena por relevancia usando Claude Haiku como scorer (0–10) y conserva los mejores 5.
3. **generate** — Claude redacta la respuesta a partir del contexto recuperado.
4. **check_hallucination** — un verificador factual (Claude Haiku) comprueba si la respuesta está respaldada por el contexto; si no lo está, añade un *disclaimer* de advertencia (ES/EN). La respuesta se devuelve **citando las fuentes** (documento, página, extracto).

### 8.6 Cola de tareas asíncronas (Celery + Redis)

Celery ejecuta las 35 automatizaciones. Celery Beat programa las tareas por cron; Redis actúa como broker. Los módulos de tareas están organizados por dominio (`calendar_tasks`, `finance_tasks`, `athlete_tasks`, `admin_tasks`, `marketing_tasks`, `reporting_tasks`, `security_tasks`) y se importan en `schedules.py` para su registro.

### 8.7 Base de datos (PostgreSQL + pgvector, RLS)

Modelo relacional amplio: **~70 tablas** distribuidas en atletas, entrenamientos, competencias, finanzas, médico, documentos, equipamiento, mensajería, automatizaciones, seguridad y base de conocimiento. La búsqueda semántica usa **pgvector** sobre `document_chunks`/`knowledge_base`. **Row Level Security está activo en todas las tablas**, con políticas basadas en `has_role`/`get_user_role`.

---

## 9. Seguridad

### 9.1 Autenticación (Supabase Auth, JWT)
Login gestionado por Supabase Auth. El backend valida el JWT con `HS256` y audiencia `authenticated` usando el `SUPABASE_JWT_SECRET`, rechazando tokens expirados o inválidos.

### 9.2 Row Level Security (RLS)
RLS activo en todas las tablas. Las políticas usan `has_role(auth.uid(), 'rol')` y restringen el acceso por propiedad del dato o por rol.

### 9.3 Protección de datos de menores
Los datos de menores solo son accesibles por el coach asignado, el admin o el padre/tutor (relación en `parent_athletes`). Se contemplan consentimientos y autorización parental.

### 9.4 Audit log
Tabla `audit_log` para operaciones sensibles y `security_audit_log` para eventos de seguridad; `agent_activity_log` registra la actividad diaria de los agentes.

### 9.5 Rate limiting (Nginx, API)
Nginx aplica `limit_req_zone` a **30 req/min por IP** sobre `/api/` (burst 50) y sobre el streaming de agentes (burst 5), devolviendo `429` al exceder. El endpoint `/api/health` queda exento para healthchecks. A nivel de tablas existe `rate_limit_cache` y `blocked_ips`.

### 9.6 Headers de seguridad
Nginx envía HSTS (`max-age=63072000; includeSubDomains; preload`), CSP restrictiva, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` y oculta la versión del servidor (`server_tokens off`). TLS 1.2/1.3 con OCSP stapling.

### 9.7 IDOR protection (ContextVar en agentes)
La identidad del usuario se propaga a las herramientas de los agentes mediante `ContextVar`, aislando el contexto entre requests concurrentes y evitando accesos indebidos a datos de otros usuarios.

### 9.8 Firma digital (MVP)
Firmas de documentos en fase MVP (`document_signatures`). La validez legal plena está en el Roadmap.

---

## 10. Internacionalización

La plataforma soporta **6 idiomas**: español (`es`), inglés (`en`), francés (`fr`), italiano (`it`), alemán (`de`) y portugués (`pt`). El idioma preferido del usuario se guarda en `profiles.language_code` (con `CHECK` sobre los 6 códigos). Las traducciones de interfaz viven en la tabla `ui_translations` (una columna por idioma, indexada por `key`), legibles por cualquier usuario autenticado y administrables por `admin`.

**Cómo agregar un idioma nuevo:** ampliar el `CHECK` de `profiles.language_code`, añadir la columna del idioma en `ui_translations` y poblar las traducciones. Al basarse en base de datos, no requiere recompilar el frontend para actualizar textos existentes.

---

## 11. Infraestructura y Deploy

### 11.1 Arquitectura de producción
Despliegue con **Docker Compose sobre un VPS Ubuntu 22.04/24.04**. El script `deploy.sh` automatiza `init` (primer despliegue) y `update` (actualizaciones).

### 11.2 Diagrama de contenedores

```
Internet (80/443)
      │
      ▼
  nginx:1.27-alpine  ── sirve /dist (React) y hace proxy /api/ ──► backend:8000
      │                                                             │
   TLS Let's Encrypt                                         (FastAPI/uvicorn)
                                                                    │
   backend ─┬─► redis:6379                                          │
 celery_worker ─► redis:6379                                        │
 celery_beat ──► redis:6379                                         │
 certbot (renovación SSL automática cada 12 h)
```

### 11.3 SSL automático (Let's Encrypt)
Certbot obtiene y renueva el certificado automáticamente (cada 12 h si expira en < 30 días). El template de Nginx alterna configuración HTTP→HTTPS durante el `init`.

### 11.4 Rollback automático
`./deploy.sh update` incluye rollback automático: si el build falla o el healthcheck post-deploy no pasa en 60 s, restaura el commit anterior y reinicia los contenedores sin intervención manual.

### 11.5 Healthchecks
`GET /api/health` responde `{"status":"ok", "version", "environment", "timestamp"}` y se usa para el healthcheck de Docker (exento de rate limit).

### 11.6 Requisitos mínimos de servidor
VPS Ubuntu 22.04/24.04, **mínimo 2 GB RAM y 20 GB de disco**, dominio apuntando por DNS (registros A) y acceso SSH.

---

## 12. API del Backend

### 12.1 Endpoints principales (FastAPI)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/api/agents/` | Lista de agentes disponibles y si son restringidos |
| POST | `/api/agents/{agent_id}/chat` | Chat con un agente (respuesta completa) |
| POST | `/api/agents/{agent_id}/chat/stream` | Chat con streaming SSE |
| POST | `/api/rag/query` | Consulta RAG sobre la base de conocimiento |
| GET | `/api/rag/documents` | Lista de documentos indexados |

> Los nombres reales en el código son `/api/agents/`, `/api/agents/{id}/chat`, `/api/agents/{id}/chat/stream`, `/api/rag/query` y `/api/rag/documents`. La ingesta de documentos se realiza mediante la función `backend/functions/ingest_documents.py`.

**Ejemplo de request de chat:**

```bash
curl -X POST https://tudominio.com/api/agents/skating/chat \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"message": "¿En qué categoría FCP compite un atleta nacido en 2013?", "history": []}'
```

Validaciones del request: `message` no vacío y ≤ 4000 caracteres; `history` ≤ 20 mensajes.

### 12.2 Autenticación de la API
Todos los endpoints (salvo `/health`) requieren **Bearer token de Supabase**. El backend verifica el JWT y resuelve el rol de aplicación desde `user_roles`; los agentes `admin`, `medical` y `finance` exigen rol privilegiado.

### 12.3 Rate limiting
**30 req/min por IP** en Nginx sobre `/api/`, con `429` al exceder.

---

## 13. Requisitos para Implementación

### Para el cliente (club)
- Cuenta **Supabase** (plan Pro recomendado)
- API key de **Anthropic** (Claude `claude-sonnet-4-6`)
- API key de **OpenAI** (embeddings para el módulo RAG)
- API key de **Resend** (email transaccional)
- **VPS Ubuntu 22.04** (mínimo 2 GB RAM, 20 GB disco)
- **Dominio propio** apuntando al VPS

### Tiempo estimado de implementación
- Setup inicial: **2–4 horas**
- Carga de datos históricos: **1–2 días**
- Carga de base de conocimiento RAG: **4–8 horas**
- Capacitación del equipo: **1 día**

---

## 14. Roadmap (Próximas Funcionalidades)

- **Agentes conversacionales adicionales:** AG-08 Seguridad, AG-11 Operaciones, AG-12 Legal y AG-14 Soporte como chatbots (hoy operan como automatizaciones/lógica de sistema).
- **Integración WhatsApp Business API** (Twilio) para recordatorios y notificaciones.
- **Firma digital con validez legal** (DocuSign / Firma Colombia), evolucionando el MVP actual.
- **App móvil nativa** (React Native) y experiencia PWA installable.
- **Integración con federaciones de patinaje** (importación de rankings oficiales).
- **Dashboard de análisis biomecánico con video.**

---

## 15. Preguntas Frecuentes Técnicas

**¿Funciona sin internet?** No. La plataforma requiere conexión: los datos residen en Supabase y los agentes IA dependen de las API de Claude/OpenAI.

**¿Los datos están en Colombia?** Supabase permite seleccionar la región del proyecto. La zona horaria de las automatizaciones está fijada en `America/Bogota`.

**¿Se puede instalar on-premise?** Sí. El backend, Celery, Redis y Nginx se despliegan con Docker Compose en un servidor propio; Supabase puede ser gestionado o autohospedado.

**¿Cuántos atletas soporta?** Probado hasta ~500 atletas por club; la arquitectura escala horizontalmente (más workers de Celery, réplicas de backend).

**¿Se puede personalizar con el logo del club?** Sí. La generación de documentos y recibos PDF utiliza el logo y los datos del club.

**¿Los agentes IA conocen las reglas de mi club específico?** Sí. La base de conocimiento RAG se carga con los documentos del club (reglamentos, protocolos, manuales) y el agente responde citando esas fuentes, con verificación anti-alucinación.

---

*Documento generado con Claude Code — Anthropic · Versión 1.0 · Agosto 2026*
