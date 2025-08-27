-- Clean up duplicate records for athlete_body_info table, keep only the most recent record per athlete
WITH ranked_records AS (
  SELECT id, 
         athlete_id,
         ROW_NUMBER() OVER (PARTITION BY athlete_id ORDER BY created_at DESC) as rn
  FROM athlete_body_info
)
DELETE FROM athlete_body_info 
WHERE id IN (
  SELECT id 
  FROM ranked_records 
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE athlete_body_info 
ADD CONSTRAINT unique_athlete_body_info 
UNIQUE (athlete_id);