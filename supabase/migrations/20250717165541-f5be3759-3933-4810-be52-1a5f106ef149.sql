-- Add date_of_birth column to athletes table
ALTER TABLE public.athletes ADD COLUMN date_of_birth DATE;

-- Update athlete_category enum to include new categories
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'escuela';
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'menores';
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'transicion';
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'prejuvenil';
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'juvenil';
ALTER TYPE public.athlete_category ADD VALUE IF NOT EXISTS 'mayores';

-- Update athlete_level enum to include new levels
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'escuela';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'mini_infantil';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'pre_infantil';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'infantil';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'junior';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'pre_juvenil';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'prejuveniles';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'juvenil_primer_ano';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'juvenil_segundo_ano';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'juvenil_tercer_ano';
ALTER TYPE public.athlete_level ADD VALUE IF NOT EXISTS 'mayores_unica';