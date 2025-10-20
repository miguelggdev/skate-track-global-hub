-- ============================================
-- Phase 1: Extend profiles table with common fields
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('masculino', 'femenino', 'otro')),
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS landline_phone text,
ADD COLUMN IF NOT EXISTS id_document_photo_url text,
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS observations text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS registered_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS digital_signature_url text,
ADD COLUMN IF NOT EXISTS data_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accepts_regulations boolean DEFAULT false;

-- ============================================
-- Phase 2: Create user_medical_info table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_medical_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blood_type text CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
  rh_factor text CHECK (rh_factor IN ('+', '-')),
  diseases text,
  allergies text,
  disability text,
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  health_insurance text,
  sports_insurance_policy text,
  insurance_expiry_date date,
  insurance_document_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on user_medical_info
ALTER TABLE public.user_medical_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_medical_info
CREATE POLICY "Users can view own medical info"
ON public.user_medical_info FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical info"
ON public.user_medical_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical info"
ON public.user_medical_info FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all medical info"
ON public.user_medical_info FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Staff can manage medical info"
ON public.user_medical_info FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- Trigger for updated_at on user_medical_info
CREATE TRIGGER update_user_medical_info_updated_at
BEFORE UPDATE ON public.user_medical_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Phase 3: Extend coaches table
-- ============================================
ALTER TABLE public.coaches
ADD COLUMN IF NOT EXISTS academic_level text CHECK (academic_level IN ('bachiller', 'tecnico', 'profesional', 'licenciado', 'posgrado')),
ADD COLUMN IF NOT EXISTS degree_title text,
ADD COLUMN IF NOT EXISTS education_institution text,
ADD COLUMN IF NOT EXISTS training_certifications text,
ADD COLUMN IF NOT EXISTS experience_description text,
ADD COLUMN IF NOT EXISTS coach_category text CHECK (coach_category IN ('formador', 'tecnico', 'asistente', 'alto_rendimiento')),
ADD COLUMN IF NOT EXISTS federation_license_expiry date,
ADD COLUMN IF NOT EXISTS license_photo_url text;

-- ============================================
-- Phase 4: Create user_documents table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('cv', 'contract', 'certificate', 'reference', 'other')),
  document_name text NOT NULL,
  document_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS on user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_documents
CREATE POLICY "Users can view own documents"
ON public.user_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
ON public.user_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
ON public.user_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON public.user_documents FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all documents"
ON public.user_documents FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Staff can manage all documents"
ON public.user_documents FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

-- ============================================
-- Phase 5: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_medical_info_user_id ON public.user_medical_info(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_registered_by ON public.profiles(registered_by);

-- ============================================
-- Phase 6: Create storage buckets
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('licenses', 'licenses', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Phase 7: Storage policies for user-documents bucket
-- ============================================
CREATE POLICY "Users can view own documents in storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents in storage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents in storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Staff can view all user documents in storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-documents' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')));

-- ============================================
-- Storage policies for id-documents bucket
-- ============================================
CREATE POLICY "Users can view own id documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own id documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own id documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Staff can view all id documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')));

-- ============================================
-- Storage policies for licenses bucket
-- ============================================
CREATE POLICY "Users can view own licenses"
ON storage.objects FOR SELECT
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own licenses"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own licenses"
ON storage.objects FOR UPDATE
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Staff can view all licenses"
ON storage.objects FOR SELECT
USING (bucket_id = 'licenses' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')));