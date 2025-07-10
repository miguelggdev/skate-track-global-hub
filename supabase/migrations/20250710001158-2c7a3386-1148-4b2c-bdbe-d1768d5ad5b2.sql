-- Add athlete personal information fields to athletes table
ALTER TABLE public.athletes 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN email TEXT;