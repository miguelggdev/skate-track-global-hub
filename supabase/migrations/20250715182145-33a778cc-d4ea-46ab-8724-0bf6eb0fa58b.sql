-- Update athlete_level enum to use Spanish categories
-- First drop the existing enum constraint and recreate it with new values

-- Create new enum type with Spanish categories
CREATE TYPE athlete_level_new AS ENUM ('escuela_menores', 'transicion', 'mayores');

-- Update existing records to map to new values
UPDATE athletes 
SET level = CASE 
  WHEN level = 'beginner' THEN 'escuela_menores'::athlete_level_new
  WHEN level = 'intermediate' THEN 'transicion'::athlete_level_new  
  WHEN level = 'advanced' THEN 'mayores'::athlete_level_new
  WHEN level = 'professional' THEN 'mayores'::athlete_level_new
  ELSE 'escuela_menores'::athlete_level_new
END::text::athlete_level_new;

-- Update competitions table as well
UPDATE competitions 
SET level = CASE 
  WHEN level = 'beginner' THEN 'escuela_menores'::athlete_level_new
  WHEN level = 'intermediate' THEN 'transicion'::athlete_level_new  
  WHEN level = 'advanced' THEN 'mayores'::athlete_level_new
  WHEN level = 'professional' THEN 'mayores'::athlete_level_new
  ELSE 'escuela_menores'::athlete_level_new
END::text::athlete_level_new
WHERE level IS NOT NULL;

-- Drop the old enum and rename the new one
ALTER TABLE athletes ALTER COLUMN level TYPE athlete_level_new USING level::text::athlete_level_new;
ALTER TABLE competitions ALTER COLUMN level TYPE athlete_level_new USING level::text::athlete_level_new;

DROP TYPE athlete_level;
ALTER TYPE athlete_level_new RENAME TO athlete_level;