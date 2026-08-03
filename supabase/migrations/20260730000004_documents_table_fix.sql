-- =============================================================
-- Fix documents table: add columns needed by DocumentsTab.tsx
-- and extend document_type enum with athlete document types
-- =============================================================

-- Make title optional (was NOT NULL with no default)
ALTER TABLE public.documents
  ALTER COLUMN title SET DEFAULT '';

-- Add file management columns used by DocumentsTab.tsx
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_size_kb  numeric,
  ADD COLUMN IF NOT EXISTS doc_status    text NOT NULL DEFAULT 'vigente'
    CHECK (doc_status IN ('vigente', 'vencido', 'no_aplica')),
  ADD COLUMN IF NOT EXISTS expiry_date   date;

-- Extend document_type enum with athlete document types
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'documento_identidad';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'tarjeta_eps';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'registro_civil';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'licencia_fedepatin';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'certificado_medico_deportivo';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'consentimiento_imagen';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'firma_digital';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'medical';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'contract';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'other';
