-- =============================================================
-- SPEC-003 — Audit Log + pgvector / Knowledge Base
-- pgvector activado desde Supabase Dashboard (extensions schema)
-- =============================================================

-- Asegurar que el tipo vector esté disponible en el search path
SET search_path TO public, extensions;

-- =============================================================
-- 1. AUDIT LOG
-- =============================================================

CREATE TABLE public.audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text        NOT NULL,
  operation    text        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id    uuid,
  old_data     jsonb,
  new_data     jsonb,
  performed_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_table     ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_record    ON public.audit_log(record_id);
CREATE INDEX idx_audit_log_performed ON public.audit_log(performed_at DESC);
CREATE INDEX idx_audit_log_user      ON public.audit_log(performed_by);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- =============================================================
-- 2. FUNCIÓN DE TRIGGER DE AUDITORÍA
-- =============================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, operation, record_id, new_data, performed_by)
    VALUES (TG_TABLE_NAME, TG_OP, (NEW.id)::uuid, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, operation, record_id, old_data, new_data, performed_by)
    VALUES (TG_TABLE_NAME, TG_OP, (NEW.id)::uuid, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, operation, record_id, old_data, performed_by)
    VALUES (TG_TABLE_NAME, TG_OP, (OLD.id)::uuid, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$$;

-- =============================================================
-- 3. TRIGGERS EN TABLAS SENSIBLES
-- =============================================================

CREATE TRIGGER audit_athletes
  AFTER INSERT OR UPDATE OR DELETE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_medical_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- =============================================================
-- 4. KNOWLEDGE BASE con pgvector
-- extensions.vector porque Supabase instala pgvector en extensions schema
-- =============================================================

CREATE TABLE public.knowledge_base (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL,
  content    text        NOT NULL,
  embedding  extensions.vector(1536),
  category   text        NOT NULL DEFAULT 'general'
             CHECK (category IN (
               'general','reglamento','nutricion','entrenamiento',
               'medico','finanzas','competencias','equipamiento',
               'psicologia','ciclismo','fuerza','recuperacion'
             )),
  agent_ids  text[]      NOT NULL DEFAULT '{}',
  source_url text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_base_embedding
  ON public.knowledge_base
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX idx_knowledge_base_active   ON public.knowledge_base(is_active);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read knowledge base" ON public.knowledge_base
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin manages knowledge base" ON public.knowledge_base
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================================
-- 5. FUNCIÓN DE BÚSQUEDA SEMÁNTICA (usada por el backend Python)
-- =============================================================

CREATE OR REPLACE FUNCTION public.search_knowledge_base(
  query_embedding extensions.vector(1536),
  match_threshold  float   DEFAULT 0.7,
  match_count      int     DEFAULT 5,
  filter_category  text    DEFAULT NULL
)
RETURNS TABLE (
  id         uuid,
  title      text,
  content    text,
  category   text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE
    kb.is_active = true
    AND (filter_category IS NULL OR kb.category = filter_category)
    AND 1 - (kb.embedding <=> query_embedding) >= match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
