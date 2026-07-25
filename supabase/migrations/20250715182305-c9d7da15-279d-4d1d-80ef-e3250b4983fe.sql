-- Update athlete_level enum to use Spanish categories
-- Step 1: Add new enum values to existing enum
ALTER TYPE athlete_level ADD VALUE 'escuela_menores';
ALTER TYPE athlete_level ADD VALUE 'transicion'; 
ALTER TYPE athlete_level ADD VALUE 'mayores';

-- Step 2: Update existing records to use new values
UPDATE athletes 
SET level = CASE 
  WHEN level = 'beginner' THEN 'escuela_menores'
  WHEN level = 'intermediate' THEN 'transicion'  
  WHEN level = 'advanced' THEN 'mayores'
  WHEN level = 'professional' THEN 'mayores'
  ELSE 'escuela_menores'
END;

-- Update competitions table as well
UPDATE competitions 
SET level = CASE 
  WHEN level = 'beginner' THEN 'escuela_menores'
  WHEN level = 'intermediate' THEN 'transicion'  
  WHEN level = 'advanced' THEN 'mayores'
  WHEN level = 'professional' THEN 'mayores'
  ELSE level
END
WHERE level IS NOT NULL;

-- Note: PostgreSQL doesn't allow removing enum values, so old values will remain
-- but we'll update the frontend to only use the new Spanish values