-- ============================================================
-- Audit Round 2 Fixes — 2026-08-05
-- 12 targeted fixes identified in second security/correctness audit
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- FIX 1 — handle_new_user references non-existent profiles.full_name
-- The previous version (20260803000000_security_audit_fixes.sql)
-- still referenced full_name / avatar_url on the profiles table,
-- which only has first_name and last_name.  The version in
-- 20260802220000_sprint8_security_hardening.sql is the correct
-- one and is reproduced here as the authoritative replacement.
-- Supports splitting a legacy "full_name" meta field into parts.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role        user_role;
  v_birth_date  date;
  v_age         integer;
  v_category    athlete_category;
  v_level       athlete_level;
  v_gender      athlete_gender;
  v_admin_count integer;
  v_requested   text;
  v_first_name  text;
  v_last_name   text;
  v_full_name   text;
BEGIN
  -- Resolve first_name / last_name from meta (supports both split and
  -- legacy full_name formats sent by external OAuth providers).
  v_first_name := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ' ', 1),
    ''
  );
  v_last_name := COALESCE(
    NEW.raw_user_meta_data ->> 'last_name',
    CASE
      WHEN (NEW.raw_user_meta_data ->> 'full_name') IS NOT NULL
           AND position(' ' IN (NEW.raw_user_meta_data ->> 'full_name')) > 0
      THEN substring(
             NEW.raw_user_meta_data ->> 'full_name'
             FROM position(' ' IN (NEW.raw_user_meta_data ->> 'full_name')) + 1
           )
      ELSE ''
    END,
    ''
  );

  -- Determine role (first user becomes admin; privileged roles require elevation)
  SELECT COUNT(*) INTO v_admin_count
  FROM public.user_roles WHERE role = 'admin';

  IF v_admin_count = 0 THEN
    v_role := 'admin';
  ELSE
    v_requested := NEW.raw_user_meta_data ->> 'role';
    v_role := CASE
      WHEN v_requested IN ('athlete', 'parent') THEN v_requested::user_role
      ELSE 'athlete'::user_role
    END;
  END IF;

  -- Resolve date_of_birth
  v_birth_date := CASE
    WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
    ELSE NULL
  END;

  -- Upsert into profiles using correct columns (no full_name, no avatar_url)
  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_birth_date
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    first_name    = EXCLUDED.first_name,
    last_name     = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    updated_at    = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Auto-create athlete record for 'athlete' role
  IF v_role = 'athlete' THEN
    IF v_birth_date IS NOT NULL THEN
      v_age := EXTRACT(YEAR FROM AGE(v_birth_date))::integer;
      v_category := CASE
        WHEN v_age <= 6  THEN 'escuela'
        WHEN v_age <= 8  THEN 'menores'
        WHEN v_age <= 10 THEN 'transicion'
        WHEN v_age <= 12 THEN 'prejuvenil'
        WHEN v_age <= 17 THEN 'juvenil'
        ELSE 'mayores'
      END::athlete_category;
      v_level := CASE
        WHEN v_age <= 6  THEN 'escuela'
        WHEN v_age <= 8  THEN 'escuela_menores'
        WHEN v_age <= 10 THEN 'transicion'
        WHEN v_age <= 12 THEN 'pre_juvenil'
        WHEN v_age <= 14 THEN 'juvenil_primer_ano'
        WHEN v_age <= 16 THEN 'juvenil_segundo_ano'
        WHEN v_age <= 17 THEN 'juvenil_tercer_ano'
        ELSE 'mayores_unica'
      END::athlete_level;
    ELSE
      v_category := 'mayores';
      v_level    := 'mayores_unica';
    END IF;

    BEGIN
      v_gender := (NEW.raw_user_meta_data ->> 'gender')::athlete_gender;
    EXCEPTION WHEN others THEN
      v_gender := NULL;
    END;

    INSERT INTO public.athletes (
      user_id, first_name, last_name, email,
      date_of_birth, gender, category, level, status, performance_score
    ) VALUES (
      NEW.id,
      v_first_name,
      v_last_name,
      NEW.email,
      v_birth_date, v_gender, v_category, v_level, 'active', 0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      first_name    = EXCLUDED.first_name,
      last_name     = EXCLUDED.last_name,
      email         = EXCLUDED.email,
      date_of_birth = EXCLUDED.date_of_birth,
      gender        = EXCLUDED.gender,
      category      = EXCLUDED.category,
      level         = EXCLUDED.level,
      updated_at    = now();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Expected conflict (ON CONFLICT handles it, but belt-and-suspenders)
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- FIX 2 — athlete_cv_summary view uses wrong JOIN key
-- Previously: JOIN public.coaches c2 ON c2.id = a.coach_id
-- coaches.id is the coaches PK; athletes.coach_id references
-- auth.users(id).  The correct join key is coaches.user_id.
-- All other columns/subqueries are preserved exactly.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.athlete_cv_summary AS
SELECT
  a.id,
  a.first_name,
  a.last_name,
  a.date_of_birth,
  a.category,
  a.level,
  a.gender,
  a.specialty,
  a.fedepatin_license,
  a.world_skate_id,
  a.is_elite_athlete,
  a.photo_url,
  a.bio,
  a.short_term_goals,
  a.long_term_goals,
  a.personal_values,
  a.dominant_distances,
  a.city,
  a.department,
  a.country,
  a.personal_phone,
  a.email,
  -- Has the athlete represented Colombia in internationals?
  COALESCE((
    SELECT bool_or(ic.is_national_team_rep)
    FROM public.athlete_international_competitions ic
    WHERE ic.athlete_id = a.id
  ), false) AS is_national_team_rep,
  -- Coach name via correct join: coaches.user_id = athletes.coach_id
  (SELECT (p2.first_name || ' ' || p2.last_name)
   FROM public.profiles p2
   JOIN public.coaches c2 ON c2.user_id = p2.id
   WHERE c2.user_id = a.coach_id
   LIMIT 1
  ) AS coach_name,
  -- Personal bests per event (time_ms in milliseconds)
  (SELECT jsonb_agg(
      jsonb_build_object(
        'event',       re2.name,
        'time_ms',     tr2.time_ms,
        'time_fmt',    tr2.time_formatted,
        'competition', co2.name,
        'date',        tr2.recorded_at
      ) ORDER BY re2.name
    )
   FROM public.time_records tr2
   JOIN public.race_events re2 ON re2.id = tr2.race_event_id
   LEFT JOIN public.competitions co2 ON co2.id = tr2.competition_id
   WHERE tr2.athlete_id = a.id AND tr2.is_personal_best = true
  ) AS personal_bests,
  -- Medal summary
  (SELECT jsonb_build_object(
      'gold',   COUNT(*) FILTER (WHERE aw.medal_type = 'gold'),
      'silver', COUNT(*) FILTER (WHERE aw.medal_type = 'silver'),
      'bronze', COUNT(*) FILTER (WHERE aw.medal_type = 'bronze')
    )
   FROM public.awards aw
   WHERE aw.athlete_id = a.id
  ) AS medals_summary,
  -- Athletic history
  ah.years_experience,
  ah.club_entry_date,
  ah.is_in_league,
  ah.is_federated,
  ah.federation_number,
  ah.is_national_team,
  ah.national_team_years,
  ah.category_history,
  ah.previous_clubs,
  -- Social media
  aso.instagram,
  aso.tiktok,
  aso.youtube,
  aso.facebook,
  aso.whatsapp
FROM public.athletes a
LEFT JOIN public.athlete_history ah  ON ah.athlete_id  = a.id
LEFT JOIN public.athlete_socials aso ON aso.athlete_id = a.id;

-- Restore security_invoker (set by sprint8 hardening migration)
ALTER VIEW public.athlete_cv_summary SET (security_invoker = on);


-- ══════════════════════════════════════════════════════════════
-- FIX 3 — get_athlete_by_nfc_uid exposes checkin_token
-- Remove checkin_token from result set and gate on coach/admin role.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_athlete_by_nfc_uid(p_uid TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only coaches and admins may look up athletes by NFC tag
  IF NOT (
    has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  RETURN (
    SELECT json_build_object(
      'id',             a.id,
      'first_name',     a.first_name,
      'last_name',      a.last_name,
      'category',       a.category,
      'level',          a.level,
      -- checkin_token intentionally omitted (security fix)
      'sessions_count', (
        SELECT COUNT(*)::int
        FROM training_attendance ta
        WHERE ta.athlete_id = a.id AND ta.attended = true
      ),
      'last_session_at', (
        SELECT ts.scheduled_at
        FROM training_attendance ta
        JOIN training_sessions ts ON ta.training_session_id = ts.id
        WHERE ta.athlete_id = a.id AND ta.attended = true
        ORDER BY ts.scheduled_at DESC
        LIMIT 1
      )
    )
    FROM public.athletes a
    WHERE a.nfc_tag_uid = p_uid
      AND a.status = 'active'
    LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_athlete_by_nfc_uid(TEXT) TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- FIX 4 — document_signatures FK ON DELETE CASCADE → SET NULL
-- Legal signatures (image authorizations, contracts) must survive
-- parent document deletion.  The FK was added in
-- 20260803200000_db_fk_and_constraints.sql with CASCADE.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.document_signatures
  DROP CONSTRAINT IF EXISTS fk_document_signatures_document_id;

ALTER TABLE public.document_signatures
  DROP CONSTRAINT IF EXISTS document_signatures_document_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'documents' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.document_signatures
      ADD CONSTRAINT document_signatures_document_id_fkey
      FOREIGN KEY (document_id)
      REFERENCES public.documents(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- FIX 5 — vaccine_records and physical_fitness_tests policies
-- missing TO authenticated role clause.
-- Current policy names (from 20260802220000_sprint8_security_hardening.sql):
--   "Admins and coaches manage vaccines restricted"   (vaccine_records)
--   "Admins and coaches manage fitness tests restricted" (physical_fitness_tests)
-- These were created without TO authenticated, making them apply to anon.
-- ══════════════════════════════════════════════════════════════

-- vaccine_records
DROP POLICY IF EXISTS "Admins and coaches manage vaccines restricted" ON public.vaccine_records;

CREATE POLICY "manage_vaccines_authenticated" ON public.vaccine_records
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  );

-- physical_fitness_tests
DROP POLICY IF EXISTS "Admins and coaches manage fitness tests restricted" ON public.physical_fitness_tests;

CREATE POLICY "manage_fitness_tests_authenticated" ON public.physical_fitness_tests
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  );


-- ══════════════════════════════════════════════════════════════
-- FIX 6 — translations_manage_admin missing TO authenticated
-- Policy "translations_manage_admin" on ui_translations was created
-- without a role clause (applies to anon too).
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "translations_manage_admin" ON public.ui_translations;

CREATE POLICY "translations_manage_admin" ON public.ui_translations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));


-- ══════════════════════════════════════════════════════════════
-- FIX 7 — attendance_alerts and retention_campaigns coach policies
-- unscoped (any coach sees all records).
-- Scope to coach_athletes junction (authoritative model).
-- Original policy names:
--   attendance_alerts:    "coach_admin_read_attendance_alerts"
--   retention_campaigns:  "admin_coach_read_retention"
-- ══════════════════════════════════════════════════════════════

-- attendance_alerts
DROP POLICY IF EXISTS "coach_admin_read_attendance_alerts" ON public.attendance_alerts;

CREATE POLICY "admin_manage_attendance_alerts" ON public.attendance_alerts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "coach_own_athletes_attendance_alerts" ON public.attendance_alerts
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'coach') AND
    athlete_id IN (
      SELECT ca.athlete_id FROM public.coach_athletes ca
      JOIN public.coaches c ON c.id = ca.coach_id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'coach') AND
    athlete_id IN (
      SELECT ca.athlete_id FROM public.coach_athletes ca
      JOIN public.coaches c ON c.id = ca.coach_id
      WHERE c.user_id = auth.uid()
    )
  );

-- retention_campaigns
DROP POLICY IF EXISTS "admin_coach_read_retention" ON public.retention_campaigns;

CREATE POLICY "admin_manage_retention_campaigns" ON public.retention_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "coach_own_athletes_retention_campaigns" ON public.retention_campaigns
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'coach') AND
    athlete_id IN (
      SELECT ca.athlete_id FROM public.coach_athletes ca
      JOIN public.coaches c ON c.id = ca.coach_id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'coach') AND
    athlete_id IN (
      SELECT ca.athlete_id FROM public.coach_athletes ca
      JOIN public.coaches c ON c.id = ca.coach_id
      WHERE c.user_id = auth.uid()
    )
  );


-- ══════════════════════════════════════════════════════════════
-- FIX 8 — Parents locked out of financial_transactions
-- No parent SELECT policy exists on this table.
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "parent_view_child_financial_transactions" ON public.financial_transactions;

CREATE POLICY "parent_view_child_financial_transactions"
  ON public.financial_transactions
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'parent') AND
    athlete_id IN (
      SELECT pa.athlete_id FROM public.parent_athletes pa
      WHERE pa.parent_user_id = auth.uid()
    )
  );


-- ══════════════════════════════════════════════════════════════
-- FIX 9 — created_at nullable on vaccine_records and physical_fitness_tests
-- Both tables were created with DEFAULT now() but without NOT NULL,
-- leaving the door open for explicit NULL inserts.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.vaccine_records
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.physical_fitness_tests
  ALTER COLUMN created_at SET NOT NULL;


-- ══════════════════════════════════════════════════════════════
-- FIX 10 — league_standings UNIQUE constraints allow duplicate NULLs
-- Standard UNIQUE constraints treat NULL = NULL as distinct, so two
-- rows with athlete_id = NULL and the same league_id would pass.
-- Replace with partial unique indexes.
-- Constraint names from 20260105000000_competitions_full_model.sql:
--   UNIQUE (league_id, athlete_id)          → league_standings_league_id_athlete_id_key
--   UNIQUE (league_id, external_athlete_id) → league_standings_league_id_external_athlete_id_key
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.league_standings
  DROP CONSTRAINT IF EXISTS league_standings_league_id_athlete_id_key;

ALTER TABLE public.league_standings
  DROP CONSTRAINT IF EXISTS league_standings_league_id_external_athlete_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_league_standings_internal
  ON public.league_standings(league_id, athlete_id)
  WHERE athlete_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_league_standings_external
  ON public.league_standings(league_id, external_athlete_id)
  WHERE external_athlete_id IS NOT NULL;


-- ══════════════════════════════════════════════════════════════
-- FIX 11 — Rewrite coach-sensitive policies to use coach_athletes
-- junction table (authoritative model per architecture decision).
-- Affects:
--   athlete_body_info    — "Staff views body info restricted" /
--                          "Staff manages body info restricted"
--   athlete_family       — "Staff manages family restricted"
--   medical_sessions     — "Staff views medical restricted" /
--                          "Staff manages medical restricted"
-- vaccine_records and physical_fitness_tests are handled in FIX 5.
-- ══════════════════════════════════════════════════════════════

-- Helper subquery (used inline each time to keep policies readable)
-- coach_athletes junction scope:
--   athlete_id IN (
--     SELECT ca.athlete_id FROM public.coach_athletes ca
--     JOIN public.coaches c ON c.id = ca.coach_id
--     WHERE c.user_id = auth.uid()
--   )

-- ── athlete_body_info ─────────────────────────────────────────
DROP POLICY IF EXISTS "Staff views body info restricted" ON public.athlete_body_info;
DROP POLICY IF EXISTS "Staff manages body info restricted" ON public.athlete_body_info;

CREATE POLICY "Staff views body info restricted" ON public.athlete_body_info
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff manages body info restricted" ON public.athlete_body_info
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  );

-- ── athlete_family ────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff manages family restricted" ON public.athlete_family;

CREATE POLICY "Staff manages family restricted" ON public.athlete_family
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  );

-- ── medical_sessions ──────────────────────────────────────────
DROP POLICY IF EXISTS "Staff views medical restricted" ON public.medical_sessions;
DROP POLICY IF EXISTS "Staff manages medical restricted" ON public.medical_sessions;

CREATE POLICY "Staff views medical restricted" ON public.medical_sessions
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff manages medical restricted" ON public.medical_sessions
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT ca.athlete_id FROM public.coach_athletes ca
        JOIN public.coaches c ON c.id = ca.coach_id
        WHERE c.user_id = auth.uid()
      )
    )
  );


-- ══════════════════════════════════════════════════════════════
-- FIX 12 — idx_athletes_coach_id without IF NOT EXISTS
-- The original CREATE INDEX in 20260102000000_full_requirements_expansion.sql
-- already used IF NOT EXISTS, but this migration makes the re-creation
-- explicit and idempotent in case the index was dropped manually.
-- ══════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_athletes_coach_id;
CREATE INDEX IF NOT EXISTS idx_athletes_coach_id ON public.athletes(coach_id);
