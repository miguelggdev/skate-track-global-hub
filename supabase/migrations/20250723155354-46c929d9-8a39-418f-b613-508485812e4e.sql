-- Add unique constraint to athletes.user_id to fix ON CONFLICT clause
-- This ensures one user can only have one athlete record
ALTER TABLE public.athletes 
ADD CONSTRAINT athletes_user_id_unique UNIQUE (user_id);