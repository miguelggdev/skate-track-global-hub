# SPEC-003 — Audit Log + pgvector
**Status:** `done`  
**Agente:** AG-CLAUDE-DB  
**Sprint:** 01  
**Prioridad:** ALTA  

---

## Propósito
Agregar auditoría de operaciones sensibles y activar pgvector para el sistema RAG de los agentes IA.

## Acceptance Criteria
- [ ] Tabla `audit_log` creada con migración propia
- [ ] Trigger `audit_trigger` en tablas: `athletes`, `transactions`, `user_roles`
- [ ] Extensión `vector` activada en Supabase
- [ ] Tabla `knowledge_base` creada con columna `embedding vector(1536)`
- [ ] RLS en `audit_log` (solo admin puede leer)
- [ ] RLS en `knowledge_base` (authenticated puede leer, solo admin inserta)

## Cambios de Base de Datos

### Migración: `20260101100000_audit_log.sql`
```sql
CREATE TABLE public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  text NOT NULL,
  operation   text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
```

### Migración: `20260101100001_pgvector.sql`
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.knowledge_base (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,
  embedding   vector(1536),
  category    text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops);
```

## Notas de Implementación
- pgvector debe habilitarse en Supabase Dashboard → Database → Extensions antes de correr la migración
- El vector(1536) corresponde a embeddings de Claude (text-embedding-3-small de OpenAI tiene 1536, Claude Embeddings también soporta esa dimensión)
- La función de trigger de auditoría debe ser `SECURITY DEFINER`
