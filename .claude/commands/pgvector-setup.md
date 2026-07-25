# /pgvector-setup — Configurar pgvector para RAG

Activa y configura la extensión pgvector en Supabase para el sistema RAG de los agentes IA.

## Pasos

1. **Verificar** si pgvector ya está activo:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

2. **Crear migración** `supabase/migrations/[timestamp]_enable_pgvector.sql`:
   ```sql
   -- Activar pgvector
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Tabla principal del knowledge base
   CREATE TABLE IF NOT EXISTS knowledge_base (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     chunk_index INT DEFAULT 0,
     embedding vector(1536),
     category TEXT NOT NULL DEFAULT 'general',
     agent_scope TEXT[] DEFAULT ARRAY['all'],
     metadata JSONB DEFAULT '{}',
     source_file TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Índice vectorial (HNSW más eficiente que IVFFlat)
   CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
     ON knowledge_base USING hnsw (embedding vector_cosine_ops)
     WITH (m = 16, ef_construction = 64);
   
   -- Función de búsqueda semántica
   CREATE OR REPLACE FUNCTION match_knowledge_base(
     query_embedding vector(1536),
     match_count INT DEFAULT 5,
     min_similarity FLOAT DEFAULT 0.6,
     filter_category TEXT DEFAULT NULL,
     filter_agent TEXT DEFAULT NULL
   )
   RETURNS TABLE (
     id UUID, title TEXT, content TEXT, category TEXT,
     metadata JSONB, similarity FLOAT
   ) LANGUAGE sql STABLE AS $$
     SELECT id, title, content, category, metadata,
            1 - (embedding <=> query_embedding) AS similarity
     FROM knowledge_base
     WHERE (filter_category IS NULL OR category = filter_category)
       AND (filter_agent IS NULL OR filter_agent = ANY(agent_scope) OR 'all' = ANY(agent_scope))
       AND (1 - (embedding <=> query_embedding)) >= min_similarity
     ORDER BY embedding <=> query_embedding
     LIMIT match_count;
   $$;
   ```

3. **Edge Function** para generar embeddings:
   Crear `supabase/functions/embed-text/index.ts` que:
   - Recibe `{ text: string }`
   - Usa el SDK de Anthropic para generar embedding
   - Retorna `{ embedding: number[] }`

4. **Script de carga** `backend/rag/load_documents.py`:
   ```python
   # Uso: python load_documents.py --dir ./knowledge_docs --category tecnica --agents coach,athlete
   ```

5. **Verificar** con una query de prueba que la búsqueda funciona correctamente.

## Dimensión de embeddings
- Claude genera embeddings de **1536 dimensiones**
- Compatible con `text-embedding-3-small` de OpenAI también (por si se necesita migrar)
