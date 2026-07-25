-- First, let's check if there are any club settings without authentication requirements
-- Add a policy to allow reading club settings without authentication (for public display)
CREATE POLICY "Anyone can view club settings" 
ON public.club_settings 
FOR SELECT 
USING (true);

-- Also ensure that the storage policies are correct for club logo uploads
-- Let's update the storage policies to handle the authentication properly
DROP POLICY IF EXISTS "Club logos are publicly viewable" ON storage.objects;

CREATE POLICY "Club logos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'club-logos');

-- Also ensure that if no club settings exist, we can create them
DROP POLICY IF EXISTS "Admins can create club settings" ON public.club_settings;

CREATE POLICY "Admins can create club settings" 
ON public.club_settings 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
  )
);