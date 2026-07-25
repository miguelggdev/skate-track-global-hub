-- Add RLS policies for profiles storage bucket to allow staff to manage photos for other users

-- Public read access for profile images
CREATE POLICY "profiles_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Users can upload to their own folder
CREATE POLICY "profiles_user_upload_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can update files in their own folder (needed for upsert)
CREATE POLICY "profiles_user_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
)
WITH CHECK (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can delete files in their own folder
CREATE POLICY "profiles_user_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
);

-- Staff (admin/leader/coach) can upload anywhere
CREATE POLICY "profiles_staff_upload_any"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND (public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'leader')
       OR public.has_role(auth.uid(), 'coach'))
);

-- Staff (admin/leader/coach) can update anywhere (needed for upsert)
CREATE POLICY "profiles_staff_update_any"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'leader')
       OR public.has_role(auth.uid(), 'coach'))
)
WITH CHECK (
  bucket_id = 'profiles'
  AND (public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'leader')
       OR public.has_role(auth.uid(), 'coach'))
);

-- Staff (admin/leader/coach) can delete anywhere
CREATE POLICY "profiles_staff_delete_any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'leader')
       OR public.has_role(auth.uid(), 'coach'))
);