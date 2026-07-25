-- Update club logo storage policies to allow leaders as well as admins
DROP POLICY IF EXISTS "Admins can upload club logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update club logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete club logos" ON storage.objects;

-- Create updated policies that allow both admin and leader roles
CREATE POLICY "Admins and leaders can upload club logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'club-logos' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
  )
);

CREATE POLICY "Admins and leaders can update club logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'club-logos' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
  )
);

CREATE POLICY "Admins and leaders can delete club logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'club-logos' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
  )
);