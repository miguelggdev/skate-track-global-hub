-- Drop the overly permissive policy that lets anyone see all competition results
DROP POLICY IF EXISTS "Anyone can view competition results" ON public.competition_results;

-- Create new policy: Athletes can only see their own results, staff can see all
CREATE POLICY "Athletes view own results and staff view all" 
ON public.competition_results
FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM public.athletes WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
  OR has_role(auth.uid(), 'coach'::user_role)
  OR has_role(auth.uid(), 'leader'::user_role)
  OR has_role(auth.uid(), 'delegate'::user_role)
);