-- Secure athletes table: remove public read, add role-based access
-- 1) Drop overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view athletes" ON public.athletes;

-- 2) Allow athletes to view their own record
CREATE POLICY "Athletes can view own record"
ON public.athletes
FOR SELECT
USING (user_id = auth.uid());

-- 3) Allow staff roles to view all athletes
CREATE POLICY "Staff can view all athletes"
ON public.athletes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'coach'::user_role, 'leader'::user_role, 'delegate'::user_role])
  )
);
