-- Update existing records to use new Spanish categories
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