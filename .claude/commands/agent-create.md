# /agent-create [nombre-agente] — Crear Nuevo Agente LangGraph

Crea la estructura completa de un nuevo agente LangGraph para el backend Python del proyecto.

## Uso
```
/agent-create nutrition    # Crea el agente nutricionista
/agent-create skating      # Crea el agente entrenador de patinaje
/agent-create admin        # Crea el agente conversacional admin
```

## Arquitectura del Backend de Agentes

El backend de agentes vive en `/backend/` (crear si no existe):
```
backend/
├── main.py              # FastAPI app
├── requirements.txt     # LangGraph, LangChain, anthropic, supabase-py, etc.
├── agents/
│   ├── base_agent.py    # Clase base con RAG y DB access
│   ├── [nombre]_agent.py
│   └── tools/           # Herramientas disponibles para los agentes
├── tasks/
│   ├── celery_app.py    # Configuración Celery + Redis
│   └── schedules.py     # Celery Beat schedules
├── rag/
│   ├── embeddings.py    # Generación de embeddings con Claude
│   └── retriever.py     # Búsqueda en pgvector
└── database/
    └── supabase_client.py
```

## Qué crear para cada agente

### 1. `backend/agents/[nombre]_agent.py`
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from langchain_anthropic import ChatAnthropic

class [Nombre]AgentState(TypedDict):
    messages: list
    athlete_id: str | None
    context: dict
    rag_documents: list
    db_results: dict

# Nodos: intent_classifier, rag_retriever, db_query, llm_response, action_executor
# Graph con routing condicional
# Herramientas específicas del agente
```

### 2. `backend/agents/tools/[nombre]_tools.py`
Tools LangChain con `@tool` decorator para las acciones específicas del agente.

### 3. Ruta en `backend/main.py`
Endpoint WebSocket `/ws/agent/[nombre]` para streaming de respuestas.

### 4. Supabase Edge Function (si necesaria)
En `supabase/functions/[nombre]-agent/index.ts` para triggers desde la BD.

### 5. Hook React en el frontend
`src/hooks/use[Nombre]Agent.ts` para conectar desde el frontend.

### 6. Widget de chat en frontend (si es conversacional)
`src/components/agents/[Nombre]ChatWidget.tsx`

## Documentos Knowledge Base a cargar
Después de crear el agente, cargar los documentos relevantes con `/embeddings-sync [nombre]`.

## Notas importantes
- Usar modelo: `claude-sonnet-4-6` (claude-sonnet-4-6)
- Temperatura: 0.3 para agentes técnicos, 0.7 para agentes conversacionales
- Incluir instrucciones del sistema específicas para patinaje de velocidad
- Conectar siempre al calendario `training_sessions` de Supabase
