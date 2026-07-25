-- Update the test user to have admin role so they can upload logos
-- The email from the test is admin@example.com
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'admin@example.com';