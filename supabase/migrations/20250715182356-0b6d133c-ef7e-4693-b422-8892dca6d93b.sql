-- Update athlete_level enum to use Spanish categories
-- Step 1: Add new enum values to existing enum
ALTER TYPE athlete_level ADD VALUE 'escuela_menores';
ALTER TYPE athlete_level ADD VALUE 'transicion'; 
ALTER TYPE athlete_level ADD VALUE 'mayores';

-- Step 2: Update existing records to use new values with proper type casting
UPDATE athletes 
SET level = CASE 
  WHEN level = 'beginner' THEN 'escuela_menores'::athlete_level
  WHEN level = 'intermediate' THEN 'transicion'::athlete_level  
  WHEN level = 'advanced' THEN 'mayores'::athlete_level
  WHEN level = 'professional' THEN 'mayores'::athlete_level
  ELSE 'escuela_menores'::athlete_level
END;

-- Update competitions table as well
UPDATE competitions 
SET level = CASE 
  WHEN level = 'beginner' THEN 'escuela_menores'::athlete_level
  WHEN level = 'intermediate' THEN 'transicion'::athlete_level  
  WHEN level = 'advanced' THEN 'mayores'::athlete_level
  WHEN level = 'professional' THEN 'mayores'::athlete_level
  ELSE level
END
WHERE level IS NOT NULL;