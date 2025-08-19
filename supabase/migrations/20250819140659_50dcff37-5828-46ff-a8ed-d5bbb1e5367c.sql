-- Add unique constraint to training_attendance table to prevent duplicate attendance records
-- This will allow UPSERT operations to work correctly

-- First, remove any existing duplicate records (if any exist)
DELETE FROM training_attendance a USING training_attendance b 
WHERE a.id < b.id 
  AND a.training_session_id = b.training_session_id 
  AND a.athlete_id = b.athlete_id;

-- Add unique constraint on (training_session_id, athlete_id)
ALTER TABLE training_attendance 
ADD CONSTRAINT unique_attendance_per_session 
UNIQUE (training_session_id, athlete_id);