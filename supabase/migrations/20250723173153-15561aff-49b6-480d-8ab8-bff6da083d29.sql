-- Add gender field to athletes table for PDF report categorization
DO $$ 
BEGIN
    -- Create gender enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'athlete_gender') THEN
        CREATE TYPE athlete_gender AS ENUM ('masculino', 'femenino');
    END IF;
END $$;

-- Add gender column to athletes table
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS gender athlete_gender;

-- Add UPDATE and DELETE policies for competitions
CREATE POLICY "Admins can update competitions" 
ON public.competitions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'delegate', 'leader')
  )
);

CREATE POLICY "Admins can delete competitions" 
ON public.competitions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'delegate', 'leader')
  )
);