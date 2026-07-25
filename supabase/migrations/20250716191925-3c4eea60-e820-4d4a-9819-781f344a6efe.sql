-- Create missing profile for the admin user to fix logo upload RLS issues
INSERT INTO public.profiles (id, email, first_name, last_name, role)
VALUES (
  '4ac61567-8c5c-4666-be46-f602713aaa92',
  'example@admin.com',
  'Admin',
  'User',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;