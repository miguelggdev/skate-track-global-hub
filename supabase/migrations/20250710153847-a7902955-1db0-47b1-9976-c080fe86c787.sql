-- Add new fields to club_settings table for club information
ALTER TABLE public.club_settings 
ADD COLUMN delegate_name TEXT,
ADD COLUMN delegate_phone TEXT,
ADD COLUMN delegate_email TEXT,
ADD COLUMN president_name TEXT,
ADD COLUMN president_phone TEXT,
ADD COLUMN president_email TEXT,
ADD COLUMN president_id TEXT,
ADD COLUMN doctor_name TEXT,
ADD COLUMN doctor_phone TEXT,
ADD COLUMN physiotherapist_name TEXT,
ADD COLUMN physiotherapist_phone TEXT,
ADD COLUMN league TEXT,
ADD COLUMN country TEXT,
ADD COLUMN coach_name TEXT,
ADD COLUMN coach_phone TEXT,
ADD COLUMN coach_email TEXT;