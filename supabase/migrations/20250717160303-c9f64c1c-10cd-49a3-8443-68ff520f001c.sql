-- Remove redundant RLS policy for club_settings viewing
-- since admins already have explicit view access
DROP POLICY IF EXISTS "Anyone can view club settings" ON public.club_settings;