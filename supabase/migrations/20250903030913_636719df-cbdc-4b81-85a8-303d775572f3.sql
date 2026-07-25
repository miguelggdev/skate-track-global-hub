-- Add ID type enum
CREATE TYPE id_type AS ENUM (
  'Tarjeta de identidad',
  'Cedula de Ciudadania', 
  'Pasaporte',
  'Cedula de Extranjeria'
);

-- Add ID fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN id_type id_type,
ADD COLUMN id_number text;