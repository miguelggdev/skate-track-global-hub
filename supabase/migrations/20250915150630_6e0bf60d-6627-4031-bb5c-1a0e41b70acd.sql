-- Update existing athletes with sample gender data to populate the gender distribution chart
-- This will add gender values to athletes who currently have NULL gender

-- Update roughly half the athletes to 'masculino' (male)
UPDATE athletes 
SET gender = 'masculino'
WHERE id IN (
  SELECT id 
  FROM athletes 
  WHERE gender IS NULL 
  ORDER BY created_at 
  LIMIT (SELECT COUNT(*) / 2 FROM athletes WHERE gender IS NULL)
);

-- Update the remaining athletes to 'femenino' (female)  
UPDATE athletes 
SET gender = 'femenino'
WHERE gender IS NULL;