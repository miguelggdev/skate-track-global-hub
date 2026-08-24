# Auditoría: puntos service_role que necesitarán filtro club_id

Generado el 2026-08-23 como preparación para la Fase 5 del plan multi-tenant
(`~/.claude/plans/linear-roaming-torvalds.md`). Ningún dato de club_id existe
todavía en el backend — este documento es un mapa del trabajo pendiente, no
un fix. No se modificó ningún archivo `.py`.

## Resumen

| Riesgo | Archivos |
|--------|----------|
| ALTO   | 11 |
| MEDIO  | 14 |
| BAJO   | 3  |
| **Total call sites de negocio** | **28** |

Más 2 archivos "Otros" (no son call sites de negocio): `supabase_client.py`
(definición del singleton) y `tests/conftest.py` (fixtures de test).

- **27 tablas distintas de Grupo A** aparecen tocadas en al menos un archivo:
  athletes, training_sessions, financial_transactions, invoices, competitions,
  equipment, equipment_maintenance, documents, federation_documents, awards,
  notifications, notification_log, attendance_alerts, time_records,
  retention_campaigns, satisfaction_surveys, user_documents,
  automation_config, system_settings, audit_log, security_audit_log,
  agent_activity_log, user_roles, medical_sessions, whatsapp_subscribers,
  whatsapp_message_log, daily_reports. (De las ~55 de Grupo A, ~28 no
  aparecen tocadas por ningún archivo backend hoy — probablemente porque
  todavía no tienen lectura/escritura desde Python, o se manejan solo desde
  el frontend vía RLS normal con anon/authenticated key.)
- **9 tablas de Grupo C** tocadas (heredan club_id del padre, no llevan
  columna propia): training_attendance, competition_results,
  competition_registrations, athlete_testimonials,
  athlete_performance_predictions.
- **2 tablas de Grupo B** tocadas: motivational_phrases, blocked_ips,
  backup_log (todas correctamente sin necesidad de club_id).
- **2 tablas Grupo B/A ambiguas** tocadas: knowledge_documents,
  document_chunks (más un uso vía RPC, ver `retrieve.py` en BAJO).
- **3 tablas NO aparecen en ninguna lista del plan**: `club_settings`,
  `profiles`, `settings`. Ver sección "No clasificadas / revisar" — una de
  ellas (`settings`) parece ni siquiera existir como tabla real.

---

## ALTO riesgo

### backend/tasks/billing_tasks.py (Celery)
- Tablas tocadas: system_settings (A, línea 168), athletes (A, línea 173),
  invoices (A/ALTO, líneas 191, 219, 339, 386), financial_transactions
  (A/ALTO, líneas 205, 409), agent_activity_log (A/ALTO, línea 296)
- Necesita: Fase 6 (dispatch por club — este task genera facturación mensual,
  probablemente recorre TODOS los atletas activos hoy; en multi-tenant debe
  iterar por club) + Fase 5 (`.eq("club_id", club_id)` en cada query,
  especialmente crítico en los inserts/updates de `financial_transactions` e
  `invoices` — mezclar facturación entre clubes es el peor escenario posible)

### backend/tasks/finance_tasks.py (Celery)
- Tablas tocadas: financial_transactions (A/ALTO, líneas 38, 103, 197, 290),
  athletes (A, líneas 62, 355), training_sessions (A, línea 217),
  training_attendance (C, línea 227), daily_reports (A, línea 241)
- Necesita: Fase 6 + Fase 5. Genera reportes financieros diarios — si no
  filtra por club_id, el reporte del club X va a incluir transacciones del
  club Y.

### backend/tasks/reporting_tasks.py (Celery)
- Tablas tocadas: training_sessions (A, línea 35), training_attendance
  (C, línea 45), **financial_transactions (A/ALTO, línea 71)**, athletes
  (A, líneas 83, 186, 265), competition_results (C, líneas 88, 133),
  time_records (A, líneas 142, 289), federation_documents (A, línea 199),
  training_attendance (C, línea 278), athlete_performance_predictions
  (C, upsert, línea 330)
- Necesita: Fase 6 + Fase 5. Clasificado ALTO únicamente por la línea 71
  (financial_transactions) — el resto del archivo es reporting operativo.

### backend/tasks/admin_tasks.py (Celery)
- Tablas tocadas: training_sessions (A, líneas 36, 123), **financial_transactions
  (A/ALTO, líneas 46, 149)**, competitions (A, línea 56), attendance_alerts
  (A, línea 65), user_documents (A, líneas 73, 200, 233, 351),
  training_attendance (C, línea 133), **medical_sessions (A/ALTO, línea 159)**,
  equipment (A, línea 270), equipment_maintenance (A, línea 283), athletes
  (A, línea 328)
- Necesita: Fase 6 + Fase 5. Archivo "catch-all" de tareas administrativas —
  toca casi todo el catálogo Grupo A, incluidas dos tablas ALTO
  (financial_transactions, medical_sessions).

### backend/tasks/athlete_tasks.py (Celery)
- Tablas tocadas: competition_results (C, línea 31), athletes (A, línea 97),
  **medical_sessions (A/ALTO, líneas 157, 219)**, time_records (A, línea 274)
- Necesita: Fase 6 + Fase 5. Dos accesos directos a medical_sessions —
  filtrar mal acá expone historial médico de atletas entre clubes.

### backend/tasks/security_tasks.py (Celery)
- Tablas tocadas: **security_audit_log (A/ALTO, líneas 33, 50)**, blocked_ips
  (B, líneas 62, 71), backup_log (B, líneas 104, 122), **audit_log
  (A/ALTO, línea 159)**, `profiles` (no clasificada, línea 213), athletes
  (A, línea 258), **agent_activity_log (A/ALTO, línea 319)**
- Necesita: Fase 6 + Fase 5 para security_audit_log/audit_log/athletes. Las
  tablas Grupo B (blocked_ips, backup_log) son correctamente globales — no
  necesitan club_id. Ojo: mezclar audit logs de seguridad entre clubes es
  tan grave como mezclar datos financieros.

### backend/tasks/helpers.py (Celery — módulo compartido, no un task en sí)
- Tablas tocadas: automation_config (A, línea 81), notifications (A, insert,
  línea 137), user_roles (A, líneas 161, 237, 250), notification_log
  (A, insert, línea 194), **agent_activity_log (A/ALTO, insert, línea 219)**
- Necesita: Fase 5. Es un módulo de utilidades (`log_agent_activity`,
  `notify_admins`, etc.) importado por prácticamente todos los demás Celery
  tasks — cualquier fix acá se propaga automáticamente a los que lo llaman,
  pero también significa que las funciones necesitan recibir `club_id`
  como parámetro explícito desde el caller.

### backend/agents/finance_agent.py (LangGraph)
- Tablas tocadas: **financial_transactions (A/ALTO, líneas 35, 63, 88)**,
  `club_settings` (no clasificada, línea 121)
- Necesita: Fase 5. Agente conversacional — el club_id debería venir del
  contexto de sesión del usuario autenticado, no de un parámetro libre.

### backend/agents/admin_agent.py (LangGraph)
- Tablas tocadas: athletes (A, líneas 16, 17, 18), **financial_transactions
  (A/ALTO, línea 38)**, competitions (A, línea 64), training_sessions
  (A, línea 81)
- Necesita: Fase 5.

### backend/agents/security_agent.py (LangGraph)
- Tablas tocadas: notification_log (A, línea 17), user_roles (A, línea 32),
  **agent_activity_log (A/ALTO, líneas 49, 66)**
- Necesita: Fase 5.

### backend/api/routes/automations.py (FastAPI)
- Tablas tocadas: automation_config (A, líneas 44, 110), **agent_activity_log
  (A/ALTO, línea 68)**
- Necesita: Fase 5. Ruta administrativa de configuración de automatizaciones
  — necesita también verificar que el admin autenticado pertenezca al
  club_id que está configurando.

---

## MEDIO riesgo

### backend/api/deps.py (FastAPI — dependency compartida)
- Tablas tocadas: user_roles (A, línea 72, función `_fetch_app_role`)
- Se ejecuta en **cada** request autenticado vía `require_roles()`. Hoy
  resuelve el rol del usuario sin considerar club — en multi-tenant esta
  función probablemente necesite devolver también el club_id del usuario
  (join a una tabla de membresía) para que las rutas puedan usarlo
  downstream. Fase 5, alta prioridad de diseño aunque el riesgo de fuga de
  datos en sí es bajo (solo lee el rol, no datos de negocio).

### backend/api/routes/athletes.py (FastAPI)
- Tablas tocadas: athletes (A, línea 145, insert en import CSV)
- Necesita: Fase 5 — cada fila insertada del CSV necesita `club_id` fijado
  al del admin que hace la importación.

### backend/tasks/whatsapp_tasks.py (Celery)
- Tablas tocadas: motivational_phrases (B, líneas 67, 116), whatsapp_subscribers
  (A, línea 83), `settings` (no clasificada / posible tabla inexistente,
  línea 98), whatsapp_message_log (A, insert, línea 122)
- Necesita: Fase 6 + Fase 5 para whatsapp_subscribers/whatsapp_message_log.
  Ver nota sobre `settings` en "No clasificadas / revisar".

### backend/tasks/marketing_tasks.py (Celery)
- Tablas tocadas: athletes (A, líneas 33, 101, 117, 197, 306),
  training_attendance (C, línea 109), retention_campaigns (A, upsert,
  línea 140), satisfaction_surveys (A, líneas 184, 209), competition_results
  (C, línea 242), athlete_testimonials (C, insert, línea 275)
- Necesita: Fase 6 + Fase 5.

### backend/tasks/calendar_tasks.py (Celery)
- Tablas tocadas: training_sessions (A, líneas 37, 96, 150, 289, 347),
  training_attendance (C, líneas 57, 111, 204, 301, 360), athletes
  (A, línea 224), attendance_alerts (A, upsert, línea 239), `profiles`
  (no clasificada, línea 251)
- Necesita: Fase 6 + Fase 5. Es el archivo con más call sites individuales
  (13) de todo el audit, aunque ninguno toca una tabla de la lista ALTO.

### backend/agents/legal_agent.py (LangGraph)
- Tablas tocadas: athletes (A, líneas 18, 75, 101), documents (A, líneas 29,
  55, 77, 102)
- Necesita: Fase 5.

### backend/agents/operations_agent.py (LangGraph)
- Tablas tocadas: training_sessions (A, líneas 19, 27, 73, 92), equipment
  (A, línea 48), athletes (A, línea 71), training_attendance (C, línea 100)
- Necesita: Fase 5.

### backend/agents/cycling_agent.py (LangGraph)
- Tablas tocadas: athletes (A, línea 24), training_sessions (A, línea 35),
  training_attendance (C, línea 54)
- Necesita: Fase 5.

### backend/agents/gym_agent.py (LangGraph)
- Tablas tocadas: athletes (A, líneas 24, 35, 81), training_sessions
  (A, línea 65)
- Necesita: Fase 5.

### backend/agents/nutrition_agent.py (LangGraph)
- Tablas tocadas: athletes (A, líneas 24, 35, 81), training_sessions
  (A, línea 65)
- Necesita: Fase 5.

### backend/agents/medical_agent.py (LangGraph)
- Tablas tocadas: athletes (A, líneas 23, 61 — incluye columnas sensibles:
  `blood_type`, `allergies`, `chronic_conditions`, contactos de emergencia),
  equipment (A, línea 76)
- Clasificado MEDIO por nombre de tabla (no toca literalmente
  `medical_sessions`/`athlete_body_info`), **pero ver nota en "algo
  inesperado" más abajo** — el contenido que expone es tan sensible como si
  tocara esas tablas.

### backend/agents/psychology_agent.py (LangGraph)
- Tablas tocadas: athletes (A, líneas 22, 70), competition_registrations
  (C, línea 33), competitions (A, línea 53)
- Necesita: Fase 5.

### backend/agents/results_agent.py (LangGraph)
- Tablas tocadas: competition_results (C, líneas 21, 68, 106), competitions
  (A, líneas 46, 98), athletes (A, línea 64)
- Necesita: Fase 5.

### backend/agents/marketing_agent.py (LangGraph)
- Tablas tocadas: athletes (A, líneas 19, 47), competitions (A, línea 23),
  `club_settings` (no clasificada, línea 30), awards (A, línea 73)
- Necesita: Fase 5.

---

## BAJO riesgo

### backend/api/routes/rag.py (FastAPI)
- Tablas tocadas: knowledge_documents (B/A ambiguo, líneas 102, 153, 188,
  214), document_chunks (B/A ambiguo, insert, línea 186)
- Depende de que se resuelva la ambigüedad Grupo B/A para
  knowledge_documents/document_chunks en el plan (ver más abajo). Si terminan
  en Grupo A, este archivo sube a MEDIO — sube y baja el CRUD completo de la
  base de conocimiento (list, insert, update, delete).

### backend/functions/ingest_documents.py
- Tablas tocadas: knowledge_documents (B/A ambiguo, insert, línea 124),
  document_chunks (B/A ambiguo, insert, línea 149)
- Mismo comentario que rag.py — script de ingesta que alimenta las mismas
  tablas ambiguas.

### backend/agents/skating_rag/nodes/retrieve.py (LangGraph node)
- No usa `.table()` directamente: en la línea 44 llama
  `get_supabase().rpc("match_document_chunks", {...})` — una función
  Postgres (`match_document_chunks`) que internamente hace la búsqueda
  vectorial sobre `document_chunks`. El filtro `club_id` (si
  document_chunks termina en Grupo A) tendría que ir **dentro de la función
  SQL `match_document_chunks`**, no en este archivo Python — este archivo
  solo pasaría el `club_id` como parámetro adicional del RPC.

---

## No clasificadas / revisar

Tres nombres de tabla aparecen en el código pero no figuran en ninguna de
las listas Grupo A/B/C del plan:

- **`club_settings`** — `finance_agent.py:121`, `marketing_agent.py:30`.
  Existe en el schema (`supabase/migrations/20260101000000_initial_schema.sql:184`,
  columnas `club_name`, `logo_url`, etc. — es literalmente la configuración
  de UN club). Es un candidato obvio a Grupo A (una fila por club, o incluso
  la tabla que reemplaza/complementa a `clubs`) y el plan debería incluirla
  explícitamente — hoy queda fuera de las ~55 tablas listadas.
- **`profiles`** — `calendar_tasks.py:251`, `security_tasks.py:213`. Existe
  en el schema (`...:46`, un perfil por `auth.users`, con `first_name`,
  `email`, etc.). Tampoco está en Grupo A/B/C. Si un usuario puede
  pertenecer a un solo club, probablemente sea Grupo A (o Grupo C colgada de
  `user_roles`/membership); si en el futuro un usuario puede pertenecer a
  varios clubes, el modelo es más complejo. Vale la pena que el dueño del
  plan lo decida explícitamente.
- **`settings`** (sin prefijo) — `whatsapp_tasks.py:98`. **Esto es un
  hallazgo inesperado**: no existe ninguna tabla llamada `settings` en
  `supabase/migrations/20260101000000_initial_schema.sql` — solo existen
  `club_settings` y `system_settings`. Es muy probable que sea un bug
  preexistente (nombre de tabla equivocado, probablemente debería ser
  `club_settings` dado que busca `key = "club_name"` — aunque `club_settings`
  no tiene un modelo key/value, tiene una columna `club_name` directa, así
  que ni siquiera el fallback es directo). En producción esta query
  probablemente falla silenciosamente o lanza una excepción capturada en
  otro lado, y el nombre del club cae siempre al default
  `"SpeedSkateTrack Hub"`. Vale la pena revisarlo aparte de la migración
  multi-tenant — es un bug de hoy, no de mañana.

---

## Otros

- **backend/database/supabase_client.py**: definición del singleton
  (`get_supabase()`, cliente `service_role` vía `lru_cache`), no un call
  site de negocio. Cualquier estrategia de Fase 5 (ej. un wrapper que
  inyecte `club_id` automáticamente, o un cliente por-request) probablemente
  empieza acá.
- **backend/tests/conftest.py**: fixtures de test
  (`mock_supabase`/`mock_supabase_ctx` mockean `get_supabase()` por completo
  vía `MagicMock`, sin tocar tablas reales). Cuando la Fase 5 agregue
  `club_id`, estos fixtures van a necesitar simular un `club_id` de prueba
  (o al menos verificar que los mocks de `.eq(...)` reciban la llamada con
  `"club_id"` para no dar falsos verdes en tests que deberían fallar sin el
  filtro).
