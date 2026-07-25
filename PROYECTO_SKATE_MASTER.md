# SKATE TRACK GLOBAL HUB — Documento Maestro del Proyecto
## Plataforma de Gestión Inteligente para Club de Patinaje de Velocidad

**Versión:** 2.0  
**Fecha:** Julio 2026  
**Estado:** En Desarrollo Activo  
**Stack Principal:** React 18 + TypeScript + Supabase + LangGraph + Claude API

---

## 1. Resumen Ejecutivo

### 1.1 Descripción del Proyecto

Skate Track Global Hub es una plataforma de gestión integral para clubes de patinaje de velocidad que combina tecnología web moderna con inteligencia artificial avanzada. El sistema gestiona atletas, entrenamientos, competencias, finanzas y comunicaciones, amplificado por una red de **14 agentes de IA especializados** construidos con LangGraph que automatizan procesos operativos y proveen asesoría experta en tiempo real.

### 1.2 Problema que Resuelve

Los clubes de patinaje operan con herramientas fragmentadas (Excel, WhatsApp, papel) que generan:
- Pérdida de información histórica de atletas
- Descoordinación entre entrenadores, padres y dirección
- Imposibilidad de tomar decisiones basadas en datos
- Carga administrativa excesiva que resta tiempo al entrenamiento
- Falta de seguimiento personalizado de cada deportista

### 1.3 Solución Propuesta

Una plataforma unificada con IA embebida que automatiza el 70% de las tareas administrativas y provee asesoría experta 24/7 a cada rol del club mediante agentes conversacionales inteligentes con acceso a la base de datos en tiempo real y documentos del club.

### 1.4 Métricas de Éxito

| KPI | Baseline | Meta 6 meses |
|-----|----------|--------------|
| Tiempo en tareas admin | 15h/semana | 4h/semana |
| Satisfacción padres (NPS) | 45 | 75+ |
| Asistencia promedio | 78% | 90%+ |
| Retención anual atletas | 72% | 88%+ |
| Respuesta a consultas | 4h promedio | < 5 minutos |
| Resultados cargados en <1h post-competencia | 20% | 100% |

---

## 2. Arquitectura de Automatizaciones

### 2.1 Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND                                  │
│  React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui    │
│  Recharts | jsPDF | XLSX | React Hook Form | TanStack Query  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    BACKEND / BaaS                            │
│              Supabase (PostgreSQL 15)                        │
│  Auth | Realtime | Storage | Edge Functions (Deno)           │
│  pgvector (RAG) | Row Level Security | Audit Log             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  CAPA DE AGENTES IA                          │
│              LangGraph (Python 3.11+)                        │
│  FastAPI | LangChain | Claude claude-sonnet-4-6 API          │
│  pgvector embeddings | Celery + Redis (tareas asíncronas)    │
│  WebSockets (streaming) | Server-Sent Events                 │
└─────────────────────────────────────────────────────────────┘
```

**Versiones de dependencias clave:**
- `langgraph >= 0.2.0`
- `langchain >= 0.3.0`
- `anthropic >= 0.34.0` (claude-sonnet-4-6)
- `supabase-py >= 2.7.0`
- `fastapi >= 0.115.0`
- `celery >= 5.4.0`
- `redis >= 5.0.0`
- `pgvector >= 0.3.0`

### 2.2 Flujo General de una Automatización

```
Trigger (cron / evento / webhook / usuario)
        │
        ▼
┌───────────────────┐
│  Celery Beat Task │  ← Tareas programadas (cron)
│  o Supabase Hook  │  ← Eventos de base de datos
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  LangGraph Graph  │  ← Orquestador del flujo del agente
│  ┌─────────────┐  │
│  │   RAG Node  │  │  ← Búsqueda vectorial (pgvector)
│  │   DB Node   │  │  ← Query directo a Supabase
│  │  LLM Node   │  │  ← Claude claude-sonnet-4-6
│  │  Action Node│  │  ← Ejecuta acción (email, notif, etc.)
│  └─────────────┘  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Output Channel    │
│ - Notif Realtime  │
│ - Email / WhatsApp│
│ - DB Update       │
│ - PDF/Reporte     │
│ - Chat Response   │
└───────────────────┘
```

### 2.3 Agentes IA Responsables

| ID | Agente | Tipo | Modelo | Acceso |
|----|--------|------|--------|--------|
| AG-01 | Admin Conversacional | Chatbot + Orquestador | Claude claude-sonnet-4-6 | DB completa + Docs |
| AG-02 | Entrenador de Patinaje | Especialista técnico | Claude claude-sonnet-4-6 | DB atletas + Docs técnicos |
| AG-03 | Entrenador de Ciclismo | Cross-training | Claude claude-sonnet-4-6 | DB atletas + Planes |
| AG-04 | Nutricionista | Planes nutricionales | Claude claude-sonnet-4-6 | DB métricas + Docs nutrición |
| AG-05 | Agente Gym/Fuerza | Acondicionamiento | Claude claude-sonnet-4-6 | DB atletas + Rutinas |
| AG-06 | Agente Médico | Lesiones y prevención | Claude claude-sonnet-4-6 | DB médica + Protocolos |
| AG-07 | Agente Financiero | Finanzas del club | Claude claude-sonnet-4-6 | DB financiera + Reportes |
| AG-08 | Agente Seguridad | Auth y auditoría | Reglas + Claude | Logs + Auth |
| AG-09 | Agente Marketing | Comunicaciones | Claude claude-sonnet-4-6 | DB + Templates |
| AG-10 | Agente Resultados | Carga competencias | Claude claude-sonnet-4-6 | DB competencias |
| AG-11 | Agente Operaciones | Calendario y recursos | Claude claude-sonnet-4-6 | DB entrenamientos |
| AG-12 | Agente Legal | Contratos y reglamentos | Claude claude-sonnet-4-6 | Docs legales |
| AG-13 | Agente Psicología | Mental coaching | Claude claude-sonnet-4-6 | DB atletas |
| AG-14 | Agente RAG Soporte | FAQ y soporte general | Claude claude-sonnet-4-6 | KB completa + DB |

---

## 3. Catálogo de Automatizaciones

### 3.1 Automatizaciones de Calendario y Entrenamientos

#### AUTO-01: Recordatorio de Entrenamiento del Día Siguiente
**Trigger:** Celery Beat — diariamente a las 19:00  
**Agente:** AG-11 (Operaciones)  
**Flujo:**
1. Consulta `training_sessions` del día siguiente
2. Obtiene lista de atletas registrados con asistencia esperada
3. Genera mensaje personalizado por categoría
4. Envía notificación push + WhatsApp/SMS a atleta y padre/tutor
5. Registra envío en `notification_log`

**Mensaje ejemplo:**  
*"Hola [Nombre], mañana [día] tienes entrenamiento de [Tipo] a las [hora] en [lugar]. Recuerda traer: [equipo necesario]. ¡Nos vemos! 🛼"*

---

#### AUTO-02: Recordatorio 2 Horas Antes
**Trigger:** Celery Beat — continuo, comparando hora actual vs hora de sesión  
**Agente:** AG-11  
**Flujo:**
1. Detecta sesiones que empiezan en exactamente 2 horas
2. Envía recordatorio final a atletas con asistencia pendiente de confirmar
3. Notifica al entrenador la lista de confirmados vs pendientes

---

#### AUTO-03: Detección de Huecos en el Calendario
**Trigger:** Celery Beat — cada lunes a las 08:00  
**Agente:** AG-11 + AG-02  
**Flujo:**
1. Analiza calendario de entrenamientos de las próximas 4 semanas
2. Detecta días sin sesión que no son festivos ni competencias
3. Compara con el plan de periodización anual
4. Genera sugerencia de sesión para cubrir hueco
5. Envía notificación al admin y entrenador con propuesta lista para aprobar con un clic

---

#### AUTO-04: Gestión de Inasistencias
**Trigger:** Supabase DB Hook — post-insert en `training_attendance` con `attended = false`  
**Agente:** AG-02 + AG-11  
**Flujo:**
1. Detecta inasistencia
2. Consulta historial: ¿cuántas inasistencias consecutivas?
3. Si ≥ 2 consecutivas: notifica al entrenador
4. Si ≥ 3 consecutivas: notifica al entrenador + admin + genera alerta de retención
5. AG-13 (Psicología) genera sugerencia de seguimiento personalizado
6. Registra en `attendance_alerts`

---

#### AUTO-05: Lista de Espera Inteligente para Sesiones
**Trigger:** Evento — sesión de entrenamiento llega al cupo máximo  
**Agente:** AG-11  
**Flujo:**
1. Detecta que sesión está llena
2. Activa lista de espera para esa sesión
3. Cuando un atleta cancela, notifica automáticamente al primero en espera
4. Da 30 minutos para confirmar, si no responde pasa al siguiente

---

#### AUTO-06: Análisis Semanal de Carga de Entrenamiento
**Trigger:** Celery Beat — viernes a las 20:00  
**Agente:** AG-02 (Entrenador Patinaje) + AG-03 (Ciclismo)  
**Flujo:**
1. Calcula carga total de la semana por atleta (horas × intensidad)
2. Compara con plan de periodización
3. Detecta sobre-entrenamiento o sub-entrenamiento
4. Genera recomendación personalizada para la semana siguiente
5. Envía reporte al entrenador con semáforo verde/amarillo/rojo por atleta

---

### 3.2 Automatizaciones de Facturación y Finanzas

#### AUTO-07: Generación Automática de Recibo de Pago
**Trigger:** Supabase DB Hook — post-insert en `financial_transactions` con `type = 'income'`  
**Agente:** AG-07 (Financiero)  
**Flujo:**
1. Detecta nuevo pago registrado
2. Genera recibo en PDF con logo del club, datos del atleta y concepto
3. Envía recibo al email del padre/tutor o atleta
4. Registra en `user_documents` con link de descarga
5. Actualiza estado de pago del atleta en dashboard

---

#### AUTO-08: Alertas de Cartera Morosa
**Trigger:** Celery Beat — 1ro y 15 de cada mes a las 09:00  
**Agente:** AG-07  
**Flujo:**
1. Consulta atletas con pagos vencidos > 30 días
2. Clasifica por nivel: amarillo (30-60d), naranja (60-90d), rojo (>90d)
3. Genera carta de cobro personalizada (AG-12 Legal revisa tono)
4. Envía notificación a padre/tutor
5. Notifica al admin con resumen de cartera total

---

#### AUTO-09: Cierre de Caja Diario
**Trigger:** Celery Beat — diariamente a las 22:00  
**Agente:** AG-07  
**Flujo:**
1. Suma todos los ingresos y egresos del día
2. Compara con meta diaria proporcional al mes
3. Genera resumen con variación vs día anterior
4. Envía reporte al admin y al gestor financiero
5. Archiva en `daily_reports`

---

#### AUTO-10: Proyección Financiera Mensual
**Trigger:** Celery Beat — último día de cada mes a las 18:00  
**Agente:** AG-07  
**Flujo:**
1. Analiza ingresos y egresos del mes
2. Proyecta flujo de caja para los próximos 3 meses
3. Detecta riesgos de liquidez
4. Genera recomendaciones de optimización
5. Produce reporte ejecutivo para el directivo del club

---

#### AUTO-11: Recordatorio de Renovación de Membresía
**Trigger:** Celery Beat — diariamente, 30/15/7/1 días antes de vencimiento  
**Agente:** AG-07 + AG-09 (Marketing)  
**Flujo:**
1. Detecta membresías que vencen en N días
2. Genera mensaje personalizado con opción de renovar online
3. Incluye resumen de logros del atleta en la temporada
4. Envía a padre/tutor con link de pago directo

---

### 3.3 Automatizaciones de Seguimiento de Atletas

#### AUTO-12: Seguimiento Post-Competencia
**Trigger:** Supabase DB Hook — post-insert en `competition_results`  
**Agente:** AG-02 + AG-13 (Psicología)  
**Flujo:**
1. Detecta resultado nuevo cargado para un atleta
2. AG-02 analiza resultado vs histórico: ¿mejora? ¿regresión?
3. Genera análisis técnico: qué salió bien, qué mejorar
4. AG-13 genera mensaje motivacional personalizado (diferente si ganó, mejoró o no logró meta)
5. Envía mensaje al atleta y al entrenador
6. Actualiza `athlete_performance_trends`

---

#### AUTO-13: Recordatorio de Evaluación Física Semestral
**Trigger:** Celery Beat — cada 6 meses desde la última evaluación del atleta  
**Agente:** AG-04 (Nutricionista) + AG-05 (Gym)  
**Flujo:**
1. Identifica atletas que no tienen evaluación en >180 días
2. Agenda evaluación con el médico/fisio del club
3. Prepara formulario de evaluación pre-llenado con historial
4. Notifica al atleta, padre y entrenador
5. Post-evaluación: genera plan nutricional y de fuerza actualizado

---

#### AUTO-14: Alertas de Lesión y Protocolo de Recuperación
**Trigger:** Supabase DB Hook — post-insert en `athlete_medical_sessions` con tipo lesión  
**Agente:** AG-06 (Médico) + AG-02  
**Flujo:**
1. Detecta registro de lesión
2. AG-06 consulta base de conocimiento médico-deportiva
3. Genera protocolo de recuperación específico para el tipo de lesión
4. Marca atleta como "lesionado" en todas las sesiones próximas
5. Notifica al entrenador con instrucciones de modificación de entrenamiento
6. Programa seguimiento automático a los 7, 14 y 30 días

---

#### AUTO-15: Monitoreo de Progreso por Categoría
**Trigger:** Celery Beat — cada lunes a las 07:00  
**Agente:** AG-02 + AG-10 (Resultados)  
**Flujo:**
1. Compara tiempos actuales vs tiempos de 4 semanas atrás
2. Calcula % de mejora por atleta y por categoría
3. Identifica el "atleta de la semana" con mayor progreso
4. Genera ranking interno actualizado
5. Envía resumen al admin, entrenadores y líderes deportivos

---

### 3.4 Automatizaciones Administrativas

#### AUTO-16: Briefing Matutino del Administrador
**Trigger:** Celery Beat — lunes a viernes a las 07:30  
**Agente:** AG-01 (Admin Conversacional)  
**Flujo:**
1. Recopila: entrenamientos del día, pagos pendientes, atletas con alertas
2. Revisa si hay competencias próximas (próximos 14 días)
3. Verifica estado de documentos vencidos
4. Consolida en briefing estructurado
5. Envía resumen al admin por notificación + disponible en dashboard
6. AG-01 queda activo para responder preguntas de seguimiento

**Formato del briefing:**
```
📋 BRIEFING — [Día] [Fecha]
━━━━━━━━━━━━━━━━━━━━━━━━
🏋️ HOY: 3 sesiones (16:00 Técnica/24 atletas, 17:30 Juvenil/18 atletas, 18:30 Avanzado/12)
💰 FINANZAS: 8 pagos vencidos | $450.000 en mora | Meta mes: 78%
🏆 PRÓXIMAS COMPETENCIAS: Campeonato Regional - 5 días
⚠️ ALERTAS: Juan P. (3 inasistencias) | María G. (lesión rodilla, día 7)
📋 DOCUMENTOS: 4 autorizaciones pendientes de firma
```

---

#### AUTO-17: Resumen de Fin de Día
**Trigger:** Celery Beat — lunes a sábado a las 21:00  
**Agente:** AG-01  
**Flujo:**
1. Resume asistencia real del día (confirmada vs esperada)
2. Pagos recibidos en el día
3. Incidencias registradas
4. Metas alcanzadas del plan semanal
5. Envía resumen al admin y al directivo del club

---

#### AUTO-18: Gestión de Documentos Vencidos
**Trigger:** Celery Beat — todos los días a las 09:00  
**Agente:** AG-01 + AG-12 (Legal)  
**Flujo:**
1. Verifica documentos en `user_documents` con fecha de vencimiento
2. Detecta: pólizas de seguro, certificados médicos, autorizaciones de menores
3. Notifica a padres/tutores 30, 15 y 5 días antes del vencimiento
4. Genera versión actualizable del documento con datos pre-llenados
5. Bloquea participación en competencias si docs críticos vencidos (con override manual admin)

---

#### AUTO-19: Control de Equipamiento e Inventario
**Trigger:** Celery Beat — cada lunes a las 06:00 + Supabase Hook post-update equipment  
**Agente:** AG-11  
**Flujo:**
1. Revisa inventario de equipamiento del club (conos, cronómetros, chalecos)
2. Detecta artículos con stock bajo o mantenimiento vencido
3. Genera lista de compras o mantenimiento requerido
4. Notifica al admin con prioridad (urgente/normal/preventivo)
5. Registra historial de mantenimiento en `equipment_maintenance`

---

#### AUTO-20: Generación de Carnets y Documentos
**Trigger:** Manual (admin) + Automático post-registro de atleta  
**Agente:** AG-01  
**Flujo:**
1. Nuevo atleta registrado → genera carnet PDF con QR único
2. Pre-llena formularios de inscripción a federación
3. Genera autorización de imagen para menores
4. Genera contrato de membresía digital con firma electrónica
5. Notifica al padre/tutor con link de firma y descarga

---

### 3.5 Automatizaciones de Marketing y Retención

#### AUTO-21: Felicitación de Cumpleaños
**Trigger:** Celery Beat — diariamente a las 07:00  
**Agente:** AG-09 (Marketing) + AG-13 (Psicología)  
**Flujo:**
1. Detecta atletas con cumpleaños hoy
2. AG-09 genera mensaje personalizado (diferente por edad: niño/juvenil/adulto)
3. Incluye estadística emotiva: "Este año lograste X medallas y mejoraste tu tiempo en Y%"
4. Envía felicitación por WhatsApp/email/notificación
5. Notifica al entrenador para que mencione el cumpleaños en la sesión del día

---

#### AUTO-22: Reactivación de Atletas Inactivos
**Trigger:** Celery Beat — cada quincena a las 10:00  
**Agente:** AG-09 + AG-13  
**Flujo:**
1. Detecta atletas con status `inactive` o sin asistencia en > 30 días
2. Clasifica razón probable (pago, lesión, pérdida de interés)
3. AG-13 genera mensaje de reactivación personalizado según razón
4. Ofrece incentivo (mes gratis, evaluación gratuita, clase de prueba)
5. Registra respuesta en `retention_campaigns`
6. Escala a admin si no hay respuesta en 7 días

---

#### AUTO-23: Encuesta de Satisfacción
**Trigger:** Celery Beat — cada 3 meses + post-competencia importante  
**Agente:** AG-09  
**Flujo:**
1. Genera encuesta NPS de 5 preguntas personalizada por rol (atleta/padre)
2. Envía por email y notificación
3. Recopila respuestas en `satisfaction_surveys`
4. AG-07 analiza tendencias y genera reporte de satisfacción
5. Identifica áreas de mejora prioritarias para el admin

---

#### AUTO-24: Solicitud de Testimonio y Referido
**Trigger:** Post-competencia con resultado positivo (medalla o mejora >5%)  
**Agente:** AG-09  
**Flujo:**
1. Detecta logro destacado de un atleta
2. Espera 24h (dejar celebrar)
3. Envía mensaje solicitando testimonio o foto para redes sociales
4. Si acepta: genera texto sugerido con el logro
5. Registra testimonios en `athlete_testimonials`
6. Genera post para Instagram/Facebook con el testimonio

---

#### AUTO-25: Campaña Pre-Inscripción Nueva Temporada
**Trigger:** Celery Beat — 60 días antes del inicio de temporada  
**Agente:** AG-09 + AG-01  
**Flujo:**
1. Genera landing de inscripción con datos actualizados del club
2. Envía campaña de re-inscripción a todos los atletas activos
3. Campaña de captación de nuevos atletas (ex-atletas + referidos)
4. Seguimiento semanal de inscripciones vs meta
5. Genera reporte de llenado de grupos por categoría

---

### 3.6 Automatizaciones de Reportería

#### AUTO-26: Reporte Semanal para el Directivo
**Trigger:** Celery Beat — domingos a las 20:00  
**Agente:** AG-01 + AG-07  
**Flujo:**
1. Consolida KPIs de la semana: atletas, asistencia, pagos, competencias
2. Compara con semana anterior y meta del mes
3. Genera reporte ejecutivo en PDF con gráficas
4. Incluye 3 logros destacados y 3 alertas a atender
5. Envía al directivo y al admin por email

---

#### AUTO-27: Reporte Mensual de Rendimiento Deportivo
**Trigger:** Celery Beat — 1ro de cada mes a las 08:00  
**Agente:** AG-02 + AG-10  
**Flujo:**
1. Consolida resultados de competencias del mes
2. Calcula evolución de tiempos por atleta y categoría
3. Identifica atletas más mejorados del mes
4. Compara con metas de la temporada
5. Genera reporte técnico para el entrenador en jefe

---

#### AUTO-28: Reporte de Inscripción a Federación
**Trigger:** Manual (admin) + Automático 30 días antes del cierre de inscripciones federativas  
**Agente:** AG-01 + AG-12 (Legal)  
**Flujo:**
1. Verifica documentación completa de cada atleta a inscribir
2. Genera planillas de inscripción en formato de la federación
3. Identifica atletas con docs faltantes y notifica para completar
4. Genera comprobante de inscripción por atleta
5. Archiva toda la documentación en `federation_documents`

---

#### AUTO-29: Dashboard de Análisis Predictivo
**Trigger:** Celery Beat — cada domingo a las 23:00  
**Agente:** AG-02 + AG-04 + AG-05  
**Flujo:**
1. Analiza tendencias de los últimos 3 meses por atleta
2. Predice potencial de medalla en próximas competencias
3. Identifica atletas en riesgo de lesión (sobrecarga de entrenamiento)
4. Genera recomendaciones de ajuste de cargas
5. Actualiza `athlete_performance_predictions`

---

### 3.7 Automatizaciones de Seguridad

#### AUTO-30: Monitoreo de Accesos Sospechosos
**Trigger:** Supabase Auth Hook — en cada intento de login  
**Agente:** AG-08 (Seguridad)  
**Flujo:**
1. Registra cada intento de acceso con IP, hora y resultado
2. Detecta: >5 intentos fallidos en 10 min, login desde país no habitual
3. Bloquea automáticamente IPs sospechosas por 30 minutos
4. Notifica al admin de actividad sospechosa
5. Registra en `security_audit_log`

---

#### AUTO-31: Verificación de Backups
**Trigger:** Celery Beat — diariamente a las 03:00  
**Agente:** AG-08  
**Flujo:**
1. Verifica que el backup automático de Supabase se ejecutó correctamente
2. Comprueba integridad del backup
3. Registra resultado en `backup_log`
4. Si backup falló: notifica INMEDIATAMENTE al admin con alta prioridad
5. Genera reporte semanal de uptime y salud del sistema

---

#### AUTO-32: Auditoría de Acceso a Datos Sensibles
**Trigger:** Supabase DB Hook — en cada SELECT/UPDATE de tablas sensibles  
**Agente:** AG-08  
**Flujo:**
1. Registra cada acceso a: `athlete_body_info`, `user_medical_info`, `financial_transactions`
2. Detecta patrones anómalos: descarga masiva, acceso fuera de horario
3. Genera reporte de auditoría semanal para el admin
4. Cumple requisitos de protección de datos personales (Ley 1581 Colombia)

---

#### AUTO-33: Rotación de Tokens y Sesiones
**Trigger:** Celery Beat — diariamente a las 02:00  
**Agente:** AG-08  
**Flujo:**
1. Invalida tokens de sesión con más de 30 días de inactividad
2. Fuerza re-login a usuarios inactivos
3. Limpia caché de sesiones expiradas
4. Genera reporte de sesiones activas para el admin

---

### 3.8 Automatizaciones de Comunicación Interna

#### AUTO-34: Notificaciones en Tiempo Real
**Trigger:** Supabase Realtime — cualquier evento relevante  
**Agente:** AG-01  
**Flujo:**
1. Nuevo resultado de competencia → notifica a atleta, coach, admin
2. Pago registrado → notifica al atleta/padre y al gestor financiero
3. Nuevo mensaje de entrenador → notifica a atleta
4. Alerta médica → notifica a coach + admin
5. Todas las notificaciones pasan por filtro de prioridad anti-spam

---

#### AUTO-35: Resumen Diario de Actividad de Agentes IA
**Trigger:** Celery Beat — diariamente a las 23:30  
**Agente:** AG-01  
**Flujo:**
1. Consolida todas las acciones tomadas por los 14 agentes durante el día
2. Cuenta: mensajes enviados, documentos generados, alertas activadas
3. Identifica si algún agente falló o generó error
4. Genera log de actividad en `agent_activity_log`
5. Envía resumen al admin con estado del sistema

---

## 4. Arquitectura Detallada de los Agentes LangGraph

### 4.1 Agente Conversacional del Administrador (AG-01)

El agente principal del sistema. Tiene acceso completo a la base de datos y actúa como interfaz conversacional central para el administrador del club.

```python
# Estructura del grafo LangGraph
class AdminAgentState(TypedDict):
    messages: list[BaseMessage]
    user_role: str
    context: dict          # Datos recuperados de la BD
    rag_documents: list    # Documentos relevantes del knowledge base
    actions_taken: list    # Acciones ejecutadas en esta sesión
    db_query_result: dict  # Resultado de la última consulta a BD

# Nodos del grafo
nodes = [
    "intent_classifier",     # Clasifica qué tipo de pregunta es
    "rag_retriever",         # Búsqueda vectorial en knowledge base
    "db_query_executor",     # Ejecuta queries a Supabase
    "response_generator",    # Claude genera respuesta
    "action_executor",       # Ejecuta acciones si es necesario
    "response_formatter"     # Formatea respuesta para la UI
]
```

**Capacidades del Admin Agent:**
- Responder preguntas sobre cualquier dato del club en lenguaje natural
- Ejecutar acciones: "Registra la asistencia de Juan para el entrenamiento de hoy"
- Generar reportes ad-hoc: "¿Cuántos atletas han pagado este mes?"
- Coordinar con otros agentes: delega tareas especializadas
- Contexto de conversación: recuerda el contexto de la sesión

**Ejemplos de interacciones:**
```
Admin: "¿Cuántos atletas de categoría juvenil han faltado más de 3 veces este mes?"
Admin: "Genera el reporte mensual para enviar al presidente del club"
Admin: "¿Qué atletas están listos para competir el próximo fin de semana?"
Admin: "Envía un recordatorio de pago a todos los morosos"
Admin: "¿Cuál ha sido nuestro mejor resultado en competencias este año?"
```

---

### 4.2 Agente Técnico y Estratega de Patinaje de Velocidad (AG-02)

El agente más especializado del sistema. Es un experto en patinaje de velocidad con conocimiento profundo de periodización, biomecánica y estrategia de carrera.

```python
class SkatingCoachAgentState(TypedDict):
    athlete_id: str
    athlete_profile: dict      # Datos completos del atleta
    training_history: list     # Últimas 12 semanas de entrenamiento
    competition_results: list  # Resultados históricos
    current_season_plan: dict  # Plan de temporada
    biomechanics_notes: str    # Notas técnicas del entrenador
    rag_context: list          # Documentos técnicos relevantes
```

**Knowledge Base del Agente de Patinaje:**
- Reglamentos UEC/WS (World Skate) de patinaje de velocidad
- Planes de periodización por categoría (escuela → senior)
- Biomecánica del patinaje de velocidad (técnica de empuje, posición, viraje)
- Estrategias de carrera (draft, sprints, relevos, eliminación)
- Modalidades: 300m, 500m, 1000m, 3000m, 5000m, maratón, relevos
- Análisis de video y corrección de técnica
- Planificación de temporada competitiva
- Tapering y peak performance para competencias importantes

**Capacidades:**
- Crear plan de entrenamiento semanal personalizado por atleta
- Analizar resultados y dar feedback técnico específico
- Sugerir ajuste de técnica basado en tiempos y observaciones
- Planificar estrategia para una carrera específica
- Periodizar la temporada completa
- Identificar potencial de mejora por categoría

---

### 4.3 Agente Nutricionista (AG-04)

Especialista en nutrición deportiva para patinadores de velocidad con planes personalizados basados en métricas del atleta y calendario de entrenamientos.

```python
class NutritionAgentState(TypedDict):
    athlete_id: str
    body_metrics: dict         # Peso, talla, composición corporal
    training_load: dict        # Carga de entrenamiento semanal
    competition_calendar: list # Competencias próximas
    dietary_restrictions: list # Alergias, intolerancias
    nutrition_goals: dict      # Peso objetivo, rendimiento
    current_plan: dict         # Plan nutricional actual
```

**Knowledge Base del Agente Nutricionista:**
- Requerimientos calóricos por intensidad de entrenamiento
- Nutrición pericompetitiva (pre, durante, post)
- Suplementación legal para deportistas (proteínas, carbohidratos, electrolitos)
- Hidratación para entrenamientos de alta intensidad
- Nutrición por categoría de edad (niños, adolescentes, adultos)
- Planes de pérdida/ganancia de peso para competencias por categoría
- Alimentos prohibidos en el deporte (dopaje involuntario)
- Recetas prácticas para atletas jóvenes

**Capacidades:**
- Generar plan nutricional semanal personalizado
- Ajustar dieta según carga de entrenamiento del calendario
- Plan de hidratación para competencias
- Análisis de composición corporal y recomendaciones
- Alertas de déficit nutricional detectado

---

### 4.4 Integración LangGraph con Calendario de Entrenamientos

Los agentes leen directamente el calendario de `training_sessions` para contextualizar sus respuestas:

```python
# Nodo de consulta al calendario
async def query_training_calendar(state: AgentState) -> AgentState:
    today = datetime.now().date()
    sessions = await supabase_client.table("training_sessions")\
        .select("*, coaches(*), training_attendance(*)")\
        .gte("session_date", today.isoformat())\
        .lte("session_date", (today + timedelta(days=14)).isoformat())\
        .execute()
    
    state["upcoming_sessions"] = sessions.data
    state["context"]["calendar"] = format_calendar_for_agent(sessions.data)
    return state
```

---

## 5. Mejoras de Dashboards

### 5.1 Dashboard Administrador — Mejoras

**Estado actual:** KPIs estáticos, gráficas básicas, datos reales parciales  
**Mejoras propuestas:**

| Elemento | Estado Actual | Mejora |
|----------|--------------|--------|
| KPI Cards | 4 métricas básicas | 8 métricas con tendencia, sparkline y comparativa |
| Gráfica ingresos | Recharts básico | Forecast a 3 meses + meta visual |
| Mapa de calor | Solo asistencia | Asistencia + rendimiento + lesiones |
| Tabla atletas | Lista simple | Vista kanban por estado + alertas inline |
| **NUEVO** | — | Widget chat AG-01 integrado en dashboard |
| **NUEVO** | — | Panel de alertas activas con prioridad |
| **NUEVO** | — | Cronómetro de próxima competencia |
| **NUEVO** | — | Feed de actividad reciente en tiempo real |
| Mobile | Sin responsividad | Responsive completo con bottom navigation |

### 5.2 Dashboard Entrenador — Mejoras

**Estado actual:** Datos mock, sin conexión real a BD  
**Mejoras propuestas:**

| Elemento | Estado Actual | Mejora |
|----------|--------------|--------|
| Lista atletas | Mock data hardcoded | Datos reales de BD con filtros |
| KPIs | Valores fijos | Calculados en tiempo real |
| Entrenamientos semana | Mock | Integrado con `training_sessions` real |
| **NUEVO** | — | Chat con AG-02 (Entrenador IA) |
| **NUEVO** | — | Generador de plan semanal con IA |
| **NUEVO** | — | Registro de asistencia por QR |
| **NUEVO** | — | Vista de progreso de tiempos por atleta |
| **NUEVO** | — | Semáforo de carga de entrenamiento |

### 5.3 Dashboard Atleta — Mejoras

**Estado actual:** Bien implementado, muchas tabs  
**Mejoras propuestas:**

| Elemento | Mejora |
|----------|--------|
| KPI Cards | Añadir: días hasta próxima competencia, streak de asistencia |
| Gráfica de progreso | Timeline de tiempos con línea de tendencia |
| **NUEVO** | Chat con AG-02 (preguntas sobre entrenamiento) |
| **NUEVO** | Chat con AG-04 (consultas nutricionales) |
| **NUEVO** | Chat con AG-05 (rutinas de gym) |
| **NUEVO** | Página de mis resultados con ranking interno |
| **NUEVO** | Calendario personal de entrenamientos y competencias |
| Mobile | Diseño mobile-first, PWA installable |

### 5.4 Dashboard Financiero — Mejoras

**Estado actual:** Datos mock, sin conexión a BD real  
**Mejoras propuestas:**

| Elemento | Mejora |
|----------|--------|
| KPIs | Conectar a BD real |
| Gráficas | Datos reales, forecast de ingresos |
| **NUEVO** | Chat con AG-07 (consultas financieras) |
| **NUEVO** | Estado de mora en tiempo real |
| **NUEVO** | Proyección de flujo de caja |
| **NUEVO** | Botón "Generar reporte ejecutivo" con IA |

---

## 6. Seguridad y Cumplimiento Normativo

### 6.1 Marco Legal Aplicable

| Normativa | Alcance | Implementación |
|-----------|---------|----------------|
| Ley 1581 de 2012 (Colombia) | Protección datos personales | RLS + audit_log + consentimientos |
| Ley 1273 de 2009 | Delitos informáticos | Audit log + rate limiting + encryption |
| Código del Menor | Menores de edad en deporte | Autorización parental digital obligatoria |
| Reglamento World Skate | Datos de competencias | Formato estándar de resultados |
| Reglamento Fenacopa/Fedepatin | Inscripciones y categorías | Validación automática de categorías |

### 6.2 Principios de Seguridad

1. **Least Privilege:** Cada rol accede solo a los datos que necesita (RLS completo)
2. **Defense in Depth:** Validación en frontend + backend + base de datos
3. **Data Minimization:** Solo se recopilan datos necesarios para el deporte
4. **Audit Everything:** Toda operación sensible queda registrada
5. **Encrypt at Rest:** Datos sensibles (médicos, financieros) cifrados en BD
6. **Zero Trust:** Cada request se valida independientemente

### 6.3 Consentimientos Requeridos

- Autorización de tratamiento de datos personales (adultos)
- Autorización parental para menores de edad
- Consentimiento de uso de imagen en redes sociales
- Autorización médica para actividad deportiva
- Consentimiento de comunicaciones electrónicas

### 6.4 Implementación RLS por Tabla

```sql
-- Ejemplo: athletes solo visible por su coach y admin
CREATE POLICY "athletes_coach_access" ON athletes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM coaches 
      JOIN coach_athletes ON coaches.id = coach_athletes.coach_id
      WHERE coach_athletes.athlete_id = athletes.id
    ) OR has_role(auth.uid(), 'admin')
  );
```

---

## 7. Plan de Implementación

### 7.1 Cronograma por Sprint

#### SPRINT 1 (Semanas 1-2): Fundamentos y Seguridad
**Objetivo:** Base técnica sólida para construir sobre ella

| Tarea | Responsable | Días | Prioridad |
|-------|-------------|------|-----------|
| Activar pgvector en Supabase | Dev | 1 | CRÍTICA |
| RLS completo en todas las tablas | Dev | 3 | CRÍTICA |
| Tabla audit_log + triggers | Dev | 2 | ALTA |
| Rate limiting en Edge Functions | Dev | 1 | ALTA |
| Tabla knowledge_base + embeddings | Dev | 2 | ALTA |
| Tabla support_tickets | Dev | 1 | MEDIA |
| AG-08 Agente Seguridad básico | Dev | 2 | ALTA |

**Skills a usar:** `/rls-policy`, `/security-review`, `/pgvector-setup`, `/audit-log`

---

#### SPRINT 2 (Semanas 3-4): Backend de Agentes LangGraph
**Objetivo:** Infraestructura Python para todos los agentes

| Tarea | Responsable | Días | Prioridad |
|-------|-------------|------|-----------|
| Setup FastAPI + LangGraph + Celery | Dev | 2 | CRÍTICA |
| Conexión Supabase ↔ LangGraph | Dev | 1 | CRÍTICA |
| AG-01 Admin Agent (MVP) | Dev | 4 | CRÍTICA |
| AG-02 Skating Coach Agent (MVP) | Dev | 4 | ALTA |
| Sistema de embeddings para KB | Dev | 2 | ALTA |
| WebSocket para streaming en frontend | Dev | 2 | ALTA |

**Skills a usar:** `/agent-create`, `/rag-pipeline`, `/agent-tools`

---

#### SPRINT 3 (Semanas 5-6): Agentes Especializados
**Objetivo:** Todos los agentes deportivos funcionando

| Tarea | Responsable | Días | Prioridad |
|-------|-------------|------|-----------|
| AG-04 Nutrición Agent | Dev | 3 | ALTA |
| AG-05 Gym/Fuerza Agent | Dev | 3 | ALTA |
| AG-06 Médico Agent | Dev | 3 | MEDIA |
| AG-03 Ciclismo Agent | Dev | 2 | MEDIA |
| AG-13 Psicología Agent | Dev | 2 | MEDIA |
| Knowledge base: cargar documentos | Admin | 3 | ALTA |

**Skills a usar:** `/agent-create`, `/embeddings-sync`

---

#### SPRINT 4 (Semanas 7-8): Agentes de Negocio + Chat UI
**Objetivo:** Agentes financiero, marketing y UI de chat

| Tarea | Responsable | Días | Prioridad |
|-------|-------------|------|-----------|
| AG-07 Financiero Agent | Dev | 3 | ALTA |
| AG-09 Marketing Agent | Dev | 2 | MEDIA |
| AG-10 Resultados Agent | Dev | 3 | ALTA |
| AG-12 Legal Agent | Dev | 2 | MEDIA |
| Chat widget en frontend | Dev | 3 | CRÍTICA |
| Selección de agente por contexto/rol | Dev | 2 | ALTA |

**Skills a usar:** `/chat-widget`, `/competition-import`

---

#### SPRINT 5 (Semanas 9-10): Automatizaciones Celery
**Objetivo:** 35 automatizaciones programadas funcionando

| Tarea | Responsable | Días | Prioridad |
|-------|-------------|------|-----------|
| AUTO-01 a AUTO-06 (Calendario) | Dev | 3 | ALTA |
| AUTO-07 a AUTO-11 (Finanzas) | Dev | 3 | ALTA |
| AUTO-12 a AUTO-15 (Atletas) | Dev | 3 | ALTA |
| AUTO-16 a AUTO-20 (Admin) | Dev | 3 | MEDIA |
| AUTO-21 a AUTO-25 (Marketing) | Dev | 2 | MEDIA |
| AUTO-26 a AUTO-29 (Reportería) | Dev | 2 | MEDIA |
| AUTO-30 a AUTO-35 (Seguridad/Comms) | Dev | 2 | ALTA |

**Skills a usar:** `/notification-system`, `/pdf-template`

---

#### SPRINT 6 (Semanas 11-12): Mejoras de Dashboard y Diseño
**Objetivo:** Dashboards responsivos y visualmente impresionantes

| Tarea | Responsable | Días | Prioridad |
|-------|-------------|------|-----------|
| Design system completo | Dev | 2 | ALTA |
| Dashboard Admin mejorado | Dev | 3 | ALTA |
| Dashboard Coach conectado a BD | Dev | 2 | ALTA |
| Dashboard Atleta mejorado | Dev | 2 | ALTA |
| Dashboard Financiero conectado | Dev | 2 | ALTA |
| Mobile responsive completo | Dev | 3 | ALTA |
| Animaciones y micro-interacciones | Dev | 2 | MEDIA |
| PWA (installable en móvil) | Dev | 1 | MEDIA |

**Skills a usar:** `/design-system`, `/responsive-audit`, `/dashboard-layout`

---

#### SPRINT 7 (Semanas 13-14): Funcionalidades Complementarias
**Objetivo:** Features faltantes de alto valor

| Tarea | Días | Prioridad |
|-------|------|-----------|
| Agente de Resultados (carga CSV/Excel) | 4 | ALTA |
| Sistema de mensajería interna | 3 | MEDIA |
| Módulo médico completo | 3 | MEDIA |
| Portal de padres | 3 | MEDIA |
| Importación masiva atletas (Excel) | 2 | MEDIA |
| Integración Google Calendar | 2 | BAJA |
| Firma digital de documentos | 2 | MEDIA |

---

#### SPRINT 8 (Semanas 15-16): Testing y Go-Live
**Objetivo:** Plataforma lista para producción

| Tarea | Días | Prioridad |
|-------|------|-----------|
| Tests E2E con Playwright | 4 | ALTA |
| Tests de carga y performance | 2 | ALTA |
| Auditoría de seguridad final | 2 | CRÍTICA |
| Documentación de usuario | 2 | MEDIA |
| Capacitación equipo del club | 2 | ALTA |
| Deploy en producción | 1 | CRÍTICA |
| Monitoreo post-go-live | Continuo | CRÍTICA |

---

### 7.2 Configuración Celery Beat

```python
# celery_config.py
CELERY_BEAT_SCHEDULE = {
    # Entrenamientos
    "reminder-next-day": {
        "task": "agents.tasks.reminder_next_day_training",
        "schedule": crontab(hour=19, minute=0),
    },
    "weekly-calendar-gaps": {
        "task": "agents.tasks.detect_calendar_gaps",
        "schedule": crontab(day_of_week=1, hour=8, minute=0),
    },
    "weekly-training-load": {
        "task": "agents.tasks.analyze_weekly_training_load",
        "schedule": crontab(day_of_week=5, hour=20, minute=0),
    },
    # Finanzas
    "daily-cash-close": {
        "task": "agents.tasks.daily_cash_close",
        "schedule": crontab(hour=22, minute=0),
    },
    "biweekly-overdue-alerts": {
        "task": "agents.tasks.overdue_payment_alerts",
        "schedule": crontab(day_of_month="1,15", hour=9, minute=0),
    },
    # Admin
    "morning-briefing": {
        "task": "agents.tasks.morning_briefing",
        "schedule": crontab(day_of_week="1-5", hour=7, minute=30),
    },
    "end-of-day-summary": {
        "task": "agents.tasks.end_of_day_summary",
        "schedule": crontab(day_of_week="1-6", hour=21, minute=0),
    },
    # Seguridad
    "daily-backup-check": {
        "task": "agents.tasks.verify_backup",
        "schedule": crontab(hour=3, minute=0),
    },
    # Marketing
    "birthday-wishes": {
        "task": "agents.tasks.birthday_wishes",
        "schedule": crontab(hour=7, minute=0),
    },
    # Reportería
    "weekly-director-report": {
        "task": "agents.tasks.weekly_director_report",
        "schedule": crontab(day_of_week=0, hour=20, minute=0),
    },
    "monthly-performance-report": {
        "task": "agents.tasks.monthly_performance_report",
        "schedule": crontab(day_of_month=1, hour=8, minute=0),
    },
    "agent-activity-summary": {
        "task": "agents.tasks.agent_activity_summary",
        "schedule": crontab(hour=23, minute=30),
    },
}
```

### 7.3 Monitoreo y Observabilidad

```
Herramientas de monitoreo:
- Supabase Dashboard: estado de BD, queries lentas, errores
- Flower (Celery): estado de tareas asíncronas, errores, tiempos
- Sentry: errores en frontend y backend
- Logfire/Langfuse: trazabilidad de agentes LangGraph
- Uptime Robot: disponibilidad del servicio 24/7
```

---

## 8. Métricas y Retorno de Inversión (ROI)

### 8.1 Ahorro de Tiempo Estimado

| Tarea | Tiempo Actual | Con IA | Ahorro/mes |
|-------|--------------|--------|------------|
| Recordatorios manuales | 5h/semana | 0h | 20h |
| Generación de reportes | 8h/mes | 30min | 7.5h |
| Registro de resultados | 3h/competencia | 20min | Variable |
| Responder consultas padres | 10h/semana | 2h | 32h |
| Gestión de cobros | 6h/semana | 1h | 20h |
| Cierre de caja | 2h/día | 10min | 37h |
| Carnets y documentos | 4h/mes | 30min | 3.5h |
| **Total** | **~120h/mes** | **~25h/mes** | **~95h/mes** |

### 8.2 Costo vs Beneficio

| Concepto | Costo Mensual |
|----------|---------------|
| Claude API (estimado 2M tokens/mes) | $60 USD |
| Supabase Pro (BD + funciones) | $25 USD |
| Redis (Celery) | $15 USD |
| Servidor FastAPI (Railway/Render) | $20 USD |
| **Total infraestructura** | **$120 USD/mes** |

| Beneficio | Valor Mensual |
|-----------|---------------|
| 95h de trabajo ahorradas × $15/h | $1,425 USD |
| Reducción de morosos 20% → $X extra | Variable |
| Retención mejorada (+16 atletas × $50) | $800 USD |
| **Total beneficio** | **~$2,225 USD/mes** |

**ROI estimado:** 1,754% mensual | Payback: < 1 mes

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| LangGraph | Framework Python para construir agentes de IA como grafos de estado |
| RAG | Retrieval Augmented Generation: técnica de búsqueda + generación con IA |
| pgvector | Extensión de PostgreSQL para almacenar y buscar embeddings vectoriales |
| Celery Beat | Scheduler de tareas programadas para Python |
| RLS | Row Level Security: políticas de seguridad a nivel de fila en PostgreSQL |
| Embedding | Representación vectorial de texto usada para búsqueda semántica |
| Knowledge Base | Base de documentos indexados para el sistema RAG |
| Streaming | Respuesta del agente enviada palabra por palabra en tiempo real |
| Edge Function | Función serverless en Supabase (Deno/TypeScript) |
| NPS | Net Promoter Score: métrica de satisfacción del cliente |
| Tapering | Reducción de carga de entrenamiento antes de competencia importante |
| Periodización | Planificación estructurada del entrenamiento en ciclos |
| Draft | Técnica de carrera en patinaje: seguir la estela del competidor delantero |

---

## 10. Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Jul 2025 | Versión inicial Lovable — funcionalidades básicas |
| 1.5 | Ene 2026 | Expansión de módulos, más migraciones SQL |
| 2.0 | Jul 2026 | Plan IA: LangGraph + RAG + 14 agentes + 35 automatizaciones |

---

*Documento generado con Claude Code — Anthropic*  
*Última actualización: Julio 2026*
