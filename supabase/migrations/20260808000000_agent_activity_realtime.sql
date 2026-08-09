-- =============================================================
-- SPEC-046 — Galería de agentes en vivo
-- 1) SELECT en agent_activity_log también para 'leader' (ya existe para 'admin')
-- 2) Añadir la tabla a la publicación Realtime (INSERTs en vivo)
-- =============================================================

-- 1. Política SELECT para leader (aditiva; la de admin ya existe)
DROP POLICY IF EXISTS "leader_read_agent_activity_log" ON public.agent_activity_log;
CREATE POLICY "leader_read_agent_activity_log"
  ON public.agent_activity_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'leader'));

-- 2. Realtime — añadir a supabase_realtime si no está (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'agent_activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_activity_log;
  END IF;
END $$;
