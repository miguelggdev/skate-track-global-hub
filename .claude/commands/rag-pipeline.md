# /rag-pipeline — Configurar Pipeline RAG Completo

Configura el sistema RAG (Retrieval Augmented Generation) con pgvector en Supabase y la API de Claude.

## Qué implementar

### 1. Migración SQL — Activar pgvector
Crear `supabase/migrations/[timestamp]_pgvector_knowledge_base.sql`:
```sql
-- Activar extensión
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de knowledge base
CREATE TABLE knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_tokens INT,
  embedding vector(1536),         -- Claude embeddings
  category TEXT NOT NULL,          -- 'reglamento', 'nutricion', 'tecnica', 'faq', etc.
  agent_scope TEXT[],              -- ['admin', 'coach', 'nutrition'] — qué agentes pueden usarlo
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda vectorial eficiente
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Función de búsqueda semántica
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_agent TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, title TEXT, content TEXT, category TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT kb.id, kb.title, kb.content, kb.category,
         1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE (filter_category IS NULL OR kb.category = filter_category)
    AND (filter_agent IS NULL OR filter_agent = ANY(kb.agent_scope))
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 2. Supabase Edge Function — Generar Embeddings
Crear `supabase/functions/generate-embedding/index.ts`:
- Recibe texto como input
- Usa `anthropic` SDK para generar embedding
- Retorna vector de 1536 dimensiones

### 3. Backend Python — RAG Retriever
Crear `backend/rag/retriever.py`:
- `embed_query(text)` → llama Edge Function para embedding
- `retrieve_documents(query, category, agent_scope, top_k=5)` → busca en pgvector
- `format_context(documents)` → formatea docs para incluir en prompt

### 4. Cargador de Documentos
Crear `backend/rag/loader.py`:
- `load_document(file_path, category, agent_scope)` → carga y divide documento
- `chunk_text(text, chunk_size=500, overlap=50)` → divide en chunks
- `embed_and_store(chunks)` → genera embeddings y guarda en Supabase

### 5. Hook React para RAG
Crear `src/hooks/useRAGSearch.ts`:
- Búsqueda semántica desde el frontend para el chat widget

## Documentos a cargar inicialmente
- Reglamento World Skate (patinaje de velocidad)
- Manual de categorías y distancias por edad
- Plan nutricional base para deportistas
- FAQ del club (preguntas frecuentes de padres)
- Protocolo de lesiones comunes en patinaje
- Tarifas y condiciones de membresía
- Reglamento interno del club

## Comandos para cargar docs
```bash
python backend/rag/loader.py --file reglamento_ws.pdf --category reglamento --agents admin,coach,athlete
python backend/rag/loader.py --file nutricion_base.pdf --category nutricion --agents nutrition,coach
```
