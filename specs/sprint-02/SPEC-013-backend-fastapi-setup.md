# SPEC-013 — Backend Python: FastAPI + LangGraph Base Setup
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND
**Sprint:** 02
**Prioridad:** CRÍTICA

---

## Propósito
Crear la estructura base del backend Python (FastAPI + LangGraph) que servirá como fundamento para todos los agentes IA, automatizaciones y el sistema RAG del proyecto.

---

## Acceptance Criteria

- [x] Directorio `backend/` creado con estructura modular
- [x] `requirements.txt` con dependencias para Python 3.11
- [x] `main.py` con FastAPI app, CORS configurado para el frontend
- [x] `database/supabase_client.py` — cliente Supabase con service_role
- [x] `agents/base_agent.py` — clase base que todos los agentes heredan
- [x] `agents/admin_agent.py` — AG-01 MVP: consulta DB + responde preguntas de gestión
- [x] `agents/skating_agent.py` — AG-02 MVP: experto en patinaje colombiano
- [x] `api/routes/health.py` — GET /health retorna status + versión
- [x] `api/routes/agents.py` — POST /api/agents/{agent_id}/chat
- [x] `api/deps.py` — validación JWT de Supabase en cada request
- [x] `.env.example` con todas las variables requeridas
- [x] `Makefile` con comandos: dev, install, test

---

## Cambios de Base de Datos
Ninguno en esta spec. Las tablas necesarias ya existen.

---

## Cambios de Backend

### Estructura final
```
backend/
├── main.py
├── requirements.txt
├── .env.example
├── Makefile
├── agents/
│   ├── __init__.py
│   ├── base_agent.py      # Clase base LangGraph
│   ├── admin_agent.py     # AG-01: gestión del club
│   └── skating_agent.py   # AG-02: experto técnico patinaje
├── api/
│   ├── __init__.py
│   ├── deps.py            # Validación JWT + get_current_user
│   └── routes/
│       ├── __init__.py
│       ├── health.py
│       └── agents.py
├── database/
│   ├── __init__.py
│   └── supabase_client.py
└── config.py              # Settings desde .env
```

### Variables de entorno requeridas
- `ANTHROPIC_API_KEY` — Claude API
- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_SERVICE_KEY` — service_role key (nunca la anon key)
- `SUPABASE_JWT_SECRET` — para verificar JWTs del frontend
- `FRONTEND_URL` — para CORS (default: http://localhost:5173)
- `ENVIRONMENT` — development | production

---

## Notas de Implementación

1. **Python 3.11** — compatibilidad máxima con LangGraph y todas las librerías AI
2. **LangGraph 0.2.x** — grafo de agente con nodos: `route → execute → respond`
3. **Auth**: el frontend envía el JWT de Supabase en `Authorization: Bearer <token>`. El backend lo verifica con el JWT secret de Supabase (no necesita llamar a la API de Supabase para cada request).
4. **CORS**: configurado para `localhost:5173` en dev y el dominio de Vercel en producción
5. **AG-01 Admin**: tiene acceso a tools que consultan `athletes`, `financial_transactions`, `competitions`, `training_sessions` via supabase-py
6. **AG-02 Skating**: conoce categorías FCP, límites de rueda, circuitos colombianos — knowledge hardcodeado en el system prompt, sin BD

---

## Archivos a Crear
```
backend/main.py
backend/requirements.txt
backend/.env.example
backend/Makefile
backend/config.py
backend/agents/__init__.py
backend/agents/base_agent.py
backend/agents/admin_agent.py
backend/agents/skating_agent.py
backend/api/__init__.py
backend/api/deps.py
backend/api/routes/__init__.py
backend/api/routes/health.py
backend/api/routes/agents.py
backend/database/__init__.py
backend/database/supabase_client.py
```
