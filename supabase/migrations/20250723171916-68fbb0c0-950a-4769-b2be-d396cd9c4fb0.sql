-- Fix RLS policy for competition_registrations to allow admins/coaches to register athletes
CREATE POLICY "Admins and coaches can register athletes" 
ON public.competition_registrations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coach', 'delegate', 'leader')
  )
);

-- Also allow them to view all registrations for management
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.competition_registrations;
CREATE POLICY "Admins can view all registrations" 
ON public.competition_registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coach', 'delegate', 'leader')
  )
  OR 
  athlete_id IN (
    SELECT athletes.id FROM athletes WHERE athletes.user_id = auth.uid()
  )
);