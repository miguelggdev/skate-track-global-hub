-- Add ON DELETE SET NULL to foreign key constraints that reference profiles.id
-- This ensures that when a user is deleted, related records are not orphaned

-- 1. financial_transactions.created_by
ALTER TABLE public.financial_transactions 
DROP CONSTRAINT IF EXISTS financial_transactions_created_by_fkey;

ALTER TABLE public.financial_transactions
ADD CONSTRAINT financial_transactions_created_by_fkey
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 2. competitions.organizer_id
ALTER TABLE public.competitions 
DROP CONSTRAINT IF EXISTS competitions_organizer_id_fkey;

ALTER TABLE public.competitions
ADD CONSTRAINT competitions_organizer_id_fkey
FOREIGN KEY (organizer_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 3. user_documents.uploaded_by
ALTER TABLE public.user_documents 
DROP CONSTRAINT IF EXISTS user_documents_uploaded_by_fkey;

ALTER TABLE public.user_documents
ADD CONSTRAINT user_documents_uploaded_by_fkey
FOREIGN KEY (uploaded_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 4. profiles.registered_by (self-reference)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_registered_by_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_registered_by_fkey
FOREIGN KEY (registered_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;