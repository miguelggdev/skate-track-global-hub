-- Add the correct unique constraint with proper column names
ALTER TABLE training_attendance
ADD CONSTRAINT training_attendance_session_athlete_unique 
UNIQUE (training_session_id, athlete_id);