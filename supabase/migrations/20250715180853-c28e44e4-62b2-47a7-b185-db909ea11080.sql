-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public) VALUES ('club-logos', 'club-logos', true);

-- Create storage policies for club logo uploads
CREATE POLICY "Club logo images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'club-logos');

CREATE POLICY "Admins can upload club logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'club-logos' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update club logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'club-logos' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete club logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'club-logos' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);