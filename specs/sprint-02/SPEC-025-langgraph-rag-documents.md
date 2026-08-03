# SPEC-025 — RAG Backend LangGraph para Documentos de Patinaje
**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND
**Sprint:** 02
**Prioridad:** ALTA

---

## Propósito
Permitir que los usuarios (especialmente entrenadores y delegados) consulten en lenguaje natural los documentos oficiales del patinaje colombiano (reglamentos, manuales, pruebas), con respuestas precisas y contextualizadas, usando LangGraph + Claude + Supabase pgvector como motor RAG.

---

## Acceptance Criteria

### A. Ingesta y vectorización de documentos
- [ ] Edge Function `ingest-documents` procesa PDFs y los divide en chunks de ~500 tokens con solapamiento de 50 tokens
- [ ] Cada chunk se vectoriza con `text-embedding-3-small` (OpenAI) o con el modelo de embeddings de Anthropic disponible
- [ ] Los vectores se almacenan en `document_chunks` (tabla pgvector ya existente)
- [ ] Soporte para: PDF, Markdown, texto plano
- [ ] Los documentos fuente están en el bucket `documents/skating-knowledge/`
- [ ] Documentos a indexar inicialmente:
  - Reglamento World Skate (velocidad en línea)
  - Resoluciones FCP 055 y 061
  - Manual de banco de pruebas (AMEBA, ANTIFAZ, ESTRELLA)
  - Manual de circuitos (reglas de falta)
  - Planilla de inscripción Liga Bogotá (referencia)

### B. Agente RAG (LangGraph)
- [ ] Grafo `skating_rag_agent` en `backend/agents/skating_rag/graph.py`
- [ ] Nodo `retrieve`: búsqueda semántica en pgvector con top-k=5, threshold=0.75
- [ ] Nodo `rerank`: filtra chunks por relevancia con cross-encoder ligero
- [ ] Nodo `generate`: Claude genera respuesta citando las fuentes encontradas
- [ ] Nodo `check_hallucination`: verifica que la respuesta esté soportada por el contexto
- [ ] Si no hay contexto relevante → responde "No encontré información sobre eso en los documentos disponibles"
- [ ] El agente conoce el sistema de categorías FCP (hardcodeado como knowledge, no vectorizado)

### C. API endpoint
- [ ] `POST /api/rag/query` recibe `{ question: string, context?: { athlete_id?, competition_id? } }`
- [ ] Devuelve `{ answer: string, sources: Array<{ document: string, page?: number, excerpt: string }> }`
- [ ] Rate limiting: 30 req/min por usuario autenticado
- [ ] Timeout: 15 segundos máximo

### D. Widget de chat en el frontend
- [ ] Componente `<RagChatWidget />` flotante (botón ? en la esquina inferior derecha)
- [ ] Disponible para roles: admin, coach, delegate, leader
- [ ] Historial de la sesión (no persistido entre sesiones)
- [ ] Muestra fuentes expandibles debajo de cada respuesta
- [ ] Sugerencias de preguntas frecuentes al abrir:
  - "¿Qué categoría le corresponde a un atleta nacido el [fecha]?"
  - "¿Cuáles son las reglas de falta en el circuito AMEBA?"
  - "¿Qué rueda puede usar un Infantil 12 años?"
  - "¿Cuántos atletas se premian en Mini 7 años?"

### E. Integración con el perfil del atleta
- [ ] Cuando el usuario pregunta sobre una categoría, el agente puede acceder al perfil del atleta en contexto para dar respuestas personalizadas
- [ ] Ejemplo: "¿En qué categoría compite Juan García?" → el agente consulta la BD y calcula con `calcularCategoria()`

---

## Cambios de Base de Datos

### Tablas existentes (ya creadas en `20260104000000_audit_log_pgvector.sql`)
- `document_chunks`: uuid, document_id, content, embedding (vector 1536), metadata jsonb

### Tablas nuevas
```sql
CREATE TABLE public.knowledge_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename     text NOT NULL,
  title        text NOT NULL,
  document_type text NOT NULL, -- 'reglamento', 'resolucion', 'manual', 'planilla'
  file_url     text NOT NULL,
  chunks_count integer NOT NULL DEFAULT 0,
  indexed_at   timestamptz,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

### RLS
- `knowledge_documents`: SELECT para authenticated, INSERT/UPDATE para admin
- `document_chunks`: SELECT para authenticated, INSERT para service_role

---

## Cambios de Backend (LangGraph Python)

### Estructura de archivos
```
backend/
├── agents/
│   └── skating_rag/
│       ├── __init__.py
│       ├── graph.py          # Grafo LangGraph principal
│       ├── nodes/
│       │   ├── retrieve.py   # Búsqueda en pgvector
│       │   ├── rerank.py     # Filtrado por relevancia
│       │   ├── generate.py   # Generación con Claude
│       │   └── check.py      # Anti-alucinación
│       ├── prompts.py        # System prompts del agente
│       └── tools.py          # Tools: calculate_category, get_wheel_limit
├── functions/
│   └── ingest_documents.py   # Ingesta y vectorización
└── api/
    └── routes/rag.py         # FastAPI endpoint
```

### Dependencias Python adicionales
```
langchain-anthropic
langchain-openai  # para embeddings
langchain-community
pgvector
pypdf
tiktoken
```

### Prompts del agente RAG (`prompts.py`)
El agente hereda todo el conocimiento de `skating-expert.md` + `colombia-skating-reference.md` como system prompt base, y añade las instrucciones RAG de "responder solo con el contexto dado".

---

## Cambios de Frontend

### Componente principal
- `src/components/agents/RagChatWidget.tsx` — chat flotante
- `src/hooks/useRagChat.ts` — manejo de historial, llamadas a la API, estado de loading

### Integración en layouts
- Añadir `<RagChatWidget />` en `DashboardLayout.tsx` (solo visible si el usuario no es `athlete`)

---

## UI / Comportamiento Esperado

```
┌─────────────────────────────────────┐
│  ❓ Consulta los documentos          │
│─────────────────────────────────────│
│  Sugerencias:                        │
│  • ¿Qué rueda usa Infantil 12?       │
│  • Reglas AMEBA                      │
│  • Categorías de menores             │
│─────────────────────────────────────│
│  [Escribe tu pregunta...        ] 📤 │
└─────────────────────────────────────┘

Al responder:
┌─────────────────────────────────────┐
│  🤖 Respuesta del agente            │
│  Los Mini de 12 años pueden usar... │
│                                      │
│  📄 Fuentes:                         │
│  > Resolución 061 Liga Bogotá, p.3   │
│    "...el diámetro máximo para la   │
│     categoría Infantil 12 es 100mm" │
└─────────────────────────────────────┘
```

---

## Notas de Implementación

1. **Embeddings**: Usar `text-embedding-3-small` de OpenAI (más económico) para vectorizar. Claude no tiene API de embeddings propia aún.

2. **pgvector ya instalado**: La extensión `vector` ya está habilitada en Supabase según `20260104000000_audit_log_pgvector.sql`. Solo falta la tabla `knowledge_documents`.

3. **Sistema de categorías NO se vectoriza**: El algoritmo de categorías (July 1 cutoff) es código TypeScript y Python, no documento. Se incluye como tool directamente en el agente, no como chunk RAG.

4. **Imágenes de resultados NO son RAG**: Los JPEGs de resultados de competencias se procesan con Claude Vision (OCR), no con el pipeline RAG de texto. Ver SPEC-026.

5. **Primer despliegue**: Los documentos deben cargarse manualmente al bucket `documents/skating-knowledge/` y luego llamar a `ingest_documents.py` desde CLI. Después hay un botón en el admin para re-indexar.

6. **Anti-alucinación**: Crítico para fechas de corte y reglas de equipamiento. El nodo `check_hallucination` verifica que cada afirmación aparezca en algún chunk recuperado.

---

## Archivos a Crear/Modificar

```
backend/agents/skating_rag/graph.py            (NUEVO)
backend/agents/skating_rag/nodes/retrieve.py   (NUEVO)
backend/agents/skating_rag/nodes/generate.py   (NUEVO)
backend/agents/skating_rag/prompts.py          (NUEVO)
backend/agents/skating_rag/tools.py            (NUEVO)
backend/functions/ingest_documents.py          (NUEVO)
backend/api/routes/rag.py                      (NUEVO)
src/components/agents/RagChatWidget.tsx        (NUEVO)
src/hooks/useRagChat.ts                        (NUEVO)
src/components/layout/DashboardLayout.tsx      (MODIFICAR — añadir widget)
supabase/migrations/YYYYMMDD_knowledge_docs.sql (NUEVO)
```

---

## Dependencias

- Requiere backend Python LangGraph levantado (SPEC-010 a SPEC-015)
- Requiere pgvector habilitado (ya hecho en SPEC-004)
- Los documentos fuente deben estar en `documents/skating-knowledge/` en Supabase Storage
- `OPENAI_API_KEY` en variables de entorno del backend (para embeddings)
- `ANTHROPIC_API_KEY` en variables de entorno del backend (para generación)
