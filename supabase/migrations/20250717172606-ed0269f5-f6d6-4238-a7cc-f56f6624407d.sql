-- Phase 1: Fix zamir@gmail.com role from admin to athlete
UPDATE public.profiles 
SET role = 'athlete'::user_role 
WHERE email = 'zamir@gmail.com';

-- Phase 2: Link orphaned athlete records to existing user accounts
-- First, link zamir@gmail.com to their athlete record
UPDATE public.athletes 
SET user_id = (SELECT id FROM public.profiles WHERE email = 'zamir@gmail.com')
WHERE email = 'zamir@gmail.com' AND user_id IS NULL;

-- Link other orphaned athletes to existing profiles with matching emails
UPDATE public.athletes 
SET user_id = p.id
FROM public.profiles p
WHERE athletes.email = p.email 
  AND athletes.user_id IS NULL;

-- Phase 3: For remaining orphaned athletes, create user accounts
-- Insert missing profiles for athletes without user accounts
INSERT INTO public.profiles (id, email, first_name, last_name, role)
SELECT 
  gen_random_uuid(),
  a.email,
  a.first_name,
  a.last_name,
  'athlete'::user_role
FROM public.athletes a
LEFT JOIN public.profiles p ON a.email = p.email
WHERE p.id IS NULL 
  AND a.email IS NOT NULL 
  AND a.user_id IS NULL;

-- Link the newly created profiles to their athlete records
UPDATE public.athletes 
SET user_id = p.id
FROM public.profiles p
WHERE athletes.email = p.email 
  AND athletes.user_id IS NULL;

-- Phase 4: Clean up any remaining inconsistencies
-- Ensure all athletes have proper status
UPDATE public.athletes 
SET status = 'active'::athlete_status 
WHERE status IS NULL;

-- Ensure all athletes have default performance scores
UPDATE public.athletes 
SET performance_score = 0 
WHERE performance_score IS NULL;