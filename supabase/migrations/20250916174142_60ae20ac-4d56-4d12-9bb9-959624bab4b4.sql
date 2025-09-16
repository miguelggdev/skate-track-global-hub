-- Fix training_attendance table issues

-- First, remove any duplicate records, keeping the most recent one
DELETE FROM training_attendance 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY training_session_id, athlete_id 
             ORDER BY created_at DESC
           ) as rn
    FROM training_attendance
  ) t 
  WHERE t.rn > 1
);

-- Add unique constraint on training_session_id and athlete_id
ALTER TABLE training_attendance 
ADD CONSTRAINT training_attendance_session_athlete_unique 
UNIQUE (training_session_id, athlete_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_training_attendance_session_id 
ON training_attendance(training_session_id);

CREATE INDEX IF NOT EXISTS idx_training_attendance_athlete_id 
ON training_attendance(athlete_id);

-- Add trigger for edit time validation
CREATE TRIGGER validate_attendance_edit_time
  BEFORE UPDATE ON training_attendance
  FOR EACH ROW
  EXECUTE FUNCTION validate_edit_time_limit();

-- Add trigger for KPI updates
CREATE TRIGGER update_kpis_on_attendance_change
  AFTER INSERT OR UPDATE ON training_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_kpis();

-- Update RLS policy to include delegates in attendance management
DROP POLICY IF EXISTS "Coaches/leaders/admins manage attendance" ON training_attendance;

CREATE POLICY "Staff can manage attendance" ON training_attendance
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'coach'::user_role) OR 
  has_role(auth.uid(), 'leader'::user_role) OR
  has_role(auth.uid(), 'delegate'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'coach'::user_role) OR 
  has_role(auth.uid(), 'leader'::user_role) OR
  has_role(auth.uid(), 'delegate'::user_role)
);