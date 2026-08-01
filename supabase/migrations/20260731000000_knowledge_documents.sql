-- SPEC-025: Tabla de documentos indexados y función de búsqueda vectorial

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      text         NOT NULL,
  title         text         NOT NULL,
  document_type text         NOT NULL CHECK (document_type IN ('reglamento', 'resolucion', 'manual', 'planilla', 'otro')),
  file_url      text         NOT NULL DEFAULT '',
  chunks_count  integer      NOT NULL DEFAULT 0,
  indexed_at    timestamptz,
  created_by    uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_knowledge_documents"
  ON public.knowledge_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_manage_knowledge_documents"
  ON public.knowledge_documents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS para document_chunks (ya existe la tabla, solo agregar si faltan policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_chunks' AND policyname = 'authenticated_read_chunks'
  ) THEN
    EXECUTE 'CREATE POLICY "authenticated_read_chunks" ON public.document_chunks FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- Función pgvector para búsqueda semántica
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(1536),
  match_threshold  float   DEFAULT 0.70,
  match_count      integer DEFAULT 5
)
RETURNS TABLE (
  id          uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON TABLE public.knowledge_documents IS 'Registro de documentos PDF indexados para RAG (SPEC-025)';
COMMENT ON FUNCTION public.match_document_chunks IS 'Búsqueda vectorial de chunks con umbral de similitud coseno';
