-- Allow athletes to self-register for training sessions
CREATE POLICY "Athletes can register own attendance" 
ON public.training_attendance 
FOR INSERT 
WITH CHECK (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

-- Allow athletes to view available training sessions for registration
-- (This policy already exists as "Anyone can view training sessions" but ensuring it's clear)

-- Allow athletes to update their own attendance records (in case they need to modify notes, etc.)
CREATE POLICY "Athletes can update own attendance records" 
ON public.training_attendance 
FOR UPDATE 
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);