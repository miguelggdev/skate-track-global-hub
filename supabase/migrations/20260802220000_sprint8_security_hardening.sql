-- ════════════════════════════════════════════════════════════════════
-- Sprint 8 — Auditoría de Seguridad y Hardening (SPEC-033)
-- Fixes: 1 critical, 2 high, 2 medium from security audit
-- ════════════════════════════════════════════════════════════════════

-- ── FIX 1 (CRITICAL): security_audit_log INSERT policy ───────────────
-- The trigger fn_security_audit_trigger() is SECURITY DEFINER → owned by
-- postgres superuser → bypasses RLS entirely. The WITH CHECK (true)
-- INSERT policy was therefore only providing a vector for authenticated
-- users to forge audit entries. Replace with WITH CHECK (false).

DROP POLICY IF EXISTS "Service role inserts security audit" ON public.security_audit_log;

CREATE POLICY "Block direct authenticated inserts to security audit" ON public.security_audit_log
  FOR INSERT WITH CHECK (false);

-- ── FIX 2 (HIGH): athlete_cv_summary view — enable security_invoker ──
-- Without security_invoker, this view runs as the defining role (postgres),
-- bypassing the RLS of the underlying tables. Any authenticated user could
-- SELECT personal_phone, email, whatsapp, address from all athletes.
-- security_invoker = on makes the view respect the CALLING user's RLS.

ALTER VIEW public.athlete_cv_summary SET (security_invoker = on);

-- ── FIX 3 (HIGH): Coach access to medical_sessions ───────────────────
-- Current policy allows ALL coaches to see ALL medical sessions.
-- Must scope to assigned athletes only (same pattern as athlete_body_info).

DROP POLICY IF EXISTS "Staff views medical" ON public.medical_sessions;
DROP POLICY IF EXISTS "Staff manages medical" ON public.medical_sessions;

CREATE POLICY "Staff views medical restricted" ON public.medical_sessions
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (SELECT id FROM public.athletes WHERE coach_id = auth.uid())
    )
  );

CREATE POLICY "Staff manages medical restricted" ON public.medical_sessions
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (SELECT id FROM public.athletes WHERE coach_id = auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (SELECT id FROM public.athletes WHERE coach_id = auth.uid())
    )
  );

-- ── FIX 4 (HIGH): Coach access to vaccine_records and physical_fitness_tests ──
-- These Sprint 7 tables inherited the same broad coach scope. Restrict to assigned athletes.

DROP POLICY IF EXISTS "Admins and coaches manage vaccines" ON public.vaccine_records;

CREATE POLICY "Admins and coaches manage vaccines restricted" ON public.vaccine_records
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (SELECT id FROM public.athletes WHERE coach_id = auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (SELECT id FROM public.athletes WHERE coach_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and coaches manage fitness tests" ON public.physical_fitness_tests;

CREATE POLICY "Admins and coaches manage fitness tests restricted" ON public.physical_fitness_tests
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (SELECT id FROM public.athletes WHERE coach_id = auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (SELECT id FROM public.athletes WHERE coach_id = auth.uid())
    )
  );

-- ── FIX 5 (MEDIUM): Prevent self-assignment of privileged roles ───────
-- handle_new_user previously allowed anyone to self-register as coach,
-- leader, delegate, or finance via raw_user_meta_data.role — giving them
-- immediate access to sensitive data without admin approval.
-- New rule: only 'athlete' and 'parent' are self-assignable.
-- All other roles default to 'athlete' and must be elevated by an admin.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
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
BEGIN
  SELECT COUNT(*) INTO v_admin_count
  FROM public.user_roles WHERE role = 'admin';

  IF v_admin_count = 0 THEN
    v_role := 'admin';
  ELSE
    v_requested := NEW.raw_user_meta_data ->> 'role';
    -- Only 'athlete' and 'parent' may be self-assigned via registration.
    -- Privileged roles (coach, leader, delegate, finance) require admin elevation.
    v_role := CASE
      WHEN v_requested IN ('athlete', 'parent')
        THEN v_requested::user_role
      ELSE 'athlete'::user_role
    END;
  END IF;

  v_birth_date := CASE
    WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
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
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
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
EXCEPTION WHEN others THEN
  RAISE LOG 'handle_new_user error for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ── FIX 6 (MEDIUM): audit_log INSERT policy ───────────────────────────
-- The audit_trigger_fn() is SECURITY DEFINER (owned by postgres/superuser)
-- → it bypasses RLS entirely. The existing policy WITH CHECK (has_role(admin))
-- caused audit entries for non-admin user actions to fail silently.
-- Solution: block all direct authenticated INSERT (service role & SECURITY
-- DEFINER triggers bypass this check and always succeed).

DROP POLICY IF EXISTS "Triggers insert audit log" ON public.audit_log;

CREATE POLICY "Block direct authenticated inserts to audit log" ON public.audit_log
  FOR INSERT WITH CHECK (false);

-- Note: athletes self-view policy on federation_documents (LOW severity)
-- is intentionally omitted — federation documents are admin-only by design
-- and self-view would require additional workflow not in current scope.
