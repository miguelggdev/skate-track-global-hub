
-- 1) PROFILES: replace recursive staff/admin policies with has_role
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view profiles for management" ON public.profiles;

-- Admins and leaders can manage profiles (all commands)
CREATE POLICY "Admins and leaders can manage profiles"
  ON public.profiles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'leader'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'leader'));

-- Staff can view profiles (read-only)
CREATE POLICY "Staff can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'delegate')
  );

-- Keep existing self policies untouched:
-- "Users can insert own profile" (WITH CHECK auth.uid() = id)
-- "Users can update own profile" (USING auth.uid() = id)
-- "Users can view own profile" (USING auth.uid() = id)


-- 2) ATHLETES
DROP POLICY IF EXISTS "Coaches and admins can manage athletes" ON public.athletes;
DROP POLICY IF EXISTS "Staff can view all athletes" ON public.athletes;

CREATE POLICY "Coaches/leaders/admins manage athletes"
  ON public.athletes
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Staff view athletes"
  ON public.athletes
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'delegate')
  );

-- Self policies on athletes remain as they are:
-- "Athletes can view own record" (USING user_id = auth.uid())
-- "Athletes can update own record" (USING user_id = auth.uid())


-- 3) TRAINING ATTENDANCE
DROP POLICY IF EXISTS "Coaches can manage attendance" ON public.training_attendance;
DROP POLICY IF EXISTS "Athletes can view own attendance" ON public.training_attendance;

-- Recreate athlete self-view (unchanged semantics, no profiles subquery)
CREATE POLICY "Athletes can view own attendance"
  ON public.training_attendance
  FOR SELECT
  USING (
    athlete_id IN (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Coaches/leaders/admins manage attendance"
  ON public.training_attendance
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep existing insert/update self policies if present separately


-- 4) ATTENDANCE SUMMARIES
DROP POLICY IF EXISTS "Coaches and admins can manage attendance summaries" ON public.attendance_summaries;
DROP POLICY IF EXISTS "Athletes can view own attendance summaries" ON public.attendance_summaries;

CREATE POLICY "Athletes/staff can view attendance summaries"
  ON public.attendance_summaries
  FOR SELECT
  USING (
    athlete_id IN (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Coaches/leaders/admins manage attendance summaries"
  ON public.attendance_summaries
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  );


-- 5) COMPETITIONS
DROP POLICY IF EXISTS "Admins can delete competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins can manage competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins can update competitions" ON public.competitions;

CREATE POLICY "Admins/delegates/leaders manage competitions"
  ON public.competitions
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'delegate')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'delegate')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Anyone can view competitions" (SELECT USING true) as-is


-- 6) COMPETITION RESULTS
DROP POLICY IF EXISTS "Admins can manage results" ON public.competition_results;

CREATE POLICY "Admins/delegates manage competition results"
  ON public.competition_results
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'delegate')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'delegate')
  );

-- Keep "Anyone can view competition results" (SELECT USING true)


-- 7) COACHES
DROP POLICY IF EXISTS "Admins can manage coaches" ON public.coaches;

CREATE POLICY "Admins/leaders manage coaches"
  ON public.coaches
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Anyone can view coaches" (SELECT USING true)
-- Keep "Coaches can update own record" (USING user_id = auth.uid())


-- 8) COACH_ATHLETES
DROP POLICY IF EXISTS "Coaches and admins can manage relationships" ON public.coach_athletes;

CREATE POLICY "Admins/coaches/leaders manage coach_athletes"
  ON public.coach_athletes
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Anyone can view coach-athlete relationships" (SELECT USING true)


-- 9) EQUIPMENT
DROP POLICY IF EXISTS "Admins can manage equipment" ON public.equipment;

CREATE POLICY "Admins/leaders manage equipment"
  ON public.equipment
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Team members can view team equipment" (SELECT USING true)


-- 10) EQUIPMENT_MAINTENANCE
DROP POLICY IF EXISTS "Admins can manage equipment maintenance" ON public.equipment_maintenance;

CREATE POLICY "Admins/leaders manage equipment maintenance"
  ON public.equipment_maintenance
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Anyone can view equipment maintenance" (SELECT USING true)


-- 11) FINANCIAL_TRANSACTIONS
DROP POLICY IF EXISTS "Finance and admins can manage transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Athletes can view own transactions" ON public.financial_transactions;

CREATE POLICY "Athletes view own transactions + staff"
  ON public.financial_transactions
  FOR SELECT
  USING (
    athlete_id IN (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'finance')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Admins/finance/leaders manage transactions"
  ON public.financial_transactions
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'finance')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'finance')
    OR public.has_role(auth.uid(), 'leader')
  );


-- 12) MEMBER_RETENTION
DROP POLICY IF EXISTS "Admins can manage retention data" ON public.member_retention;

CREATE POLICY "Admins/leaders manage retention"
  ON public.member_retention
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Anyone can view retention data" (SELECT USING true)


-- 13) MONTHLY_TARGETS
DROP POLICY IF EXISTS "Admins can manage monthly targets" ON public.monthly_targets;

CREATE POLICY "Admins/leaders manage monthly targets"
  ON public.monthly_targets
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );


-- 14) NOTIFICATIONS
DROP POLICY IF EXISTS "Coaches and admins can send notifications" ON public.notifications;
DROP POLICY IF EXISTS "Coaches and admins can view sent notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Staff can send notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'coach')
      OR public.has_role(auth.uid(), 'leader')
    )
  );

CREATE POLICY "Staff can view sent notifications"
  ON public.notifications
  FOR SELECT
  USING (
    auth.uid() = sender_id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'coach')
      OR public.has_role(auth.uid(), 'leader')
    )
  );

CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id);


-- 15) SYSTEM_SETTINGS
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;

CREATE POLICY "Admins/leaders manage system settings"
  ON public.system_settings
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Admins/leaders view system settings"
  ON public.system_settings
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );


-- 16) TRAINING_KPIS
DROP POLICY IF EXISTS "Coaches and admins can manage KPIs" ON public.training_kpis;
DROP POLICY IF EXISTS "Athletes can view own KPIs" ON public.training_kpis;

CREATE POLICY "View KPIs for self/coach/admin/leader"
  ON public.training_kpis
  FOR SELECT
  USING (
    athlete_id IN (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid())
    OR coach_id IN (SELECT c.id FROM public.coaches c WHERE c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Coaches/leaders/admins manage KPIs"
  ON public.training_kpis
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'leader')
  );


-- 17) TRAINING_SESSIONS
DROP POLICY IF EXISTS "Coaches can manage own sessions" ON public.training_sessions;

CREATE POLICY "Coaches/admins/leaders manage sessions"
  ON public.training_sessions
  FOR ALL
  USING (
    (EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Anyone can view training sessions" (SELECT USING true)


-- 18) COMPETITION_REGISTRATIONS
DROP POLICY IF EXISTS "Admins and coaches can register athletes" ON public.competition_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.competition_registrations;
DROP POLICY IF EXISTS "Athletes can register themselves" ON public.competition_registrations;
DROP POLICY IF EXISTS "Athletes can view own registrations" ON public.competition_registrations;

CREATE POLICY "Staff can register athletes"
  ON public.competition_registrations
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'delegate')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Staff view all registrations and athletes view own"
  ON public.competition_registrations
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'delegate')
    OR public.has_role(auth.uid(), 'leader')
    OR athlete_id IN (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid())
  );

CREATE POLICY "Athletes register themselves"
  ON public.competition_registrations
  FOR INSERT
  WITH CHECK (
    athlete_id IN (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid())
  );

CREATE POLICY "Athletes view own registrations"
  ON public.competition_registrations
  FOR SELECT
  USING (
    athlete_id IN (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid())
  );


-- 19) TEAMS
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;

CREATE POLICY "Admins/leaders manage teams"
  ON public.teams
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

-- Keep "Anyone can view teams" (SELECT USING true)


-- 20) CLUB_SETTINGS
DROP POLICY IF EXISTS "Admins can create club settings" ON public.club_settings;
DROP POLICY IF EXISTS "Admins can update club settings" ON public.club_settings;
DROP POLICY IF EXISTS "Admins can view club settings" ON public.club_settings;

CREATE POLICY "Admins/leaders create club settings"
  ON public.club_settings
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Admins/leaders update club settings"
  ON public.club_settings
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Admins/leaders view club settings"
  ON public.club_settings
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'leader')
  );

-- NOTE: We intentionally did not modify self-access policies or public SELECT=true ones above.
