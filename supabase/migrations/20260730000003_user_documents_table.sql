-- =============================================================
-- user_documents: stores references to user-uploaded documents
-- (CVs, certifications, ID copies, etc.)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.user_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type   text NOT NULL,
  document_name   text NOT NULL,
  document_url    text NOT NULL,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user ON public.user_documents(user_id);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Admins and the document owner can read
CREATE POLICY "user_documents_select" ON public.user_documents
  FOR SELECT USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'leader')
  );

-- Admins, leaders, and the user themselves can insert
CREATE POLICY "user_documents_insert" ON public.user_documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'leader')
  );

-- Only the owner or admins can delete
CREATE POLICY "user_documents_delete" ON public.user_documents
  FOR DELETE USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin')
  );
