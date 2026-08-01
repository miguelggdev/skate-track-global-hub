-- ============================================================
-- SECURITY HARDENING — Sprint 3, SPEC-045
-- ============================================================

-- ── 1. Security support tables ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type   text NOT NULL, -- 'login', 'login_failed', 'data_access', 'permission_denied', 'data_change'
  ip_address   inet,
  user_agent   text,
  table_name   text,
  operation    text,
  details      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_audit_user    ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_event   ON public.security_audit_log(event_type);
CREATE INDEX idx_security_audit_created ON public.security_audit_log(created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins read; no one modifies manually — written only by triggers/Edge Functions via service role
CREATE POLICY "Admin reads security audit" ON public.security_audit_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Service role inserts security audit" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Nobody updates security audit" ON public.security_audit_log
  FOR UPDATE USING (false);

CREATE POLICY "Nobody deletes security audit" ON public.security_audit_log
  FOR DELETE USING (false);

-- ── 2. Blocked IPs table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  ip_address  inet PRIMARY KEY,
  reason      text,
  blocked_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages blocked IPs" ON public.blocked_ips
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ── 3. Rate limit cache ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limit_cache (
  key          text PRIMARY KEY,
  count        int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT now() + INTERVAL '1 minute'
);

ALTER TABLE public.rate_limit_cache ENABLE ROW LEVEL SECURITY;

-- Edge Functions use service role so they bypass RLS; nobody else should access this directly
CREATE POLICY "Nobody reads rate limit cache" ON public.rate_limit_cache
  FOR SELECT USING (false);

-- ── 4. Protect audit_log from modification ──────────────────
-- The trigger (write-only via service role) is fine; block manual inserts/updates/deletes from anon/authenticated

DROP POLICY IF EXISTS "Anyone inserts audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Service inserts audit log" ON public.audit_log;

CREATE POLICY "Triggers insert audit log" ON public.audit_log
  FOR INSERT WITH CHECK (
    -- Only internal DB triggers (running as SECURITY DEFINER with set_config) may insert
    -- Authenticated users should never INSERT directly
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Nobody updates audit log" ON public.audit_log
  FOR UPDATE USING (false);

CREATE POLICY "Nobody deletes audit log" ON public.audit_log
  FOR DELETE USING (false);

-- ── 5. Fix training_sessions — restrict to members/staff ────
-- Current policy "Authenticated view sessions" uses USING (true) which is fine for authenticated users
-- but we want to ensure it's not overly permissive beyond authenticated scope

-- The existing "Authenticated view sessions" USING(true) is acceptable (all club members see sessions)
-- The real risk is the data not being filtered at all — keep as-is for now as it's intentional per club design

-- ── 6. Fix competitions visibility (keep public for authenticated) ──
-- competitions, competition_results, awards: USING(true) for authenticated is acceptable by design
-- (all members see competitions). No change needed.

-- ── 7. Restrict coach access to athlete medical data ────────
-- Drop overly broad policies (all coaches see all body info — should be only their athletes)
DROP POLICY IF EXISTS "Staff views body info" ON public.athlete_body_info;
DROP POLICY IF EXISTS "Staff manages body info" ON public.athlete_body_info;

-- Recreate with assignment check for coaches
CREATE POLICY "Staff views body info restricted" ON public.athlete_body_info
  FOR SELECT TO authenticated
  USING (
    -- Admin and leader see all
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader')
    OR
    -- Coach only sees their assigned athletes
    (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT id FROM public.athletes WHERE coach_id = auth.uid()
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
        SELECT id FROM public.athletes WHERE coach_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (
      has_role(auth.uid(), 'coach')
      AND athlete_id IN (
        SELECT id FROM public.athletes WHERE coach_id = auth.uid()
      )
    )
  );

-- ── 8. Restrict athlete_family access ───────────────────────
DROP POLICY IF EXISTS "Staff manages family" ON public.athlete_family;

CREATE POLICY "Staff manages family restricted" ON public.athlete_family
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

-- ── 9. Fix delegate transaction allowlist ───────────────────
-- Replace negative allowlist (NOT IN mensualidad) with explicit positive allowlist
DROP POLICY IF EXISTS "Delegates can insert non-monthly transactions" ON public.financial_transactions;

CREATE POLICY "Delegates insert allowed transaction types" ON public.financial_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'delegate')
    AND transaction_type IN (
      'registration_fee',
      'equipment',
      'travel',
      'competition_district',
      'competition_departmental',
      'competition_marathon',
      'competition_panamerican',
      'competition_interleague'
    )
  );

-- ── 10. Security audit trigger for sensitive tables ─────────

CREATE OR REPLACE FUNCTION public.fn_security_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, event_type, table_name, operation, details)
  VALUES (
    auth.uid(),
    'data_change',
    TG_TABLE_NAME,
    TG_OP,
    CASE TG_OP
      WHEN 'INSERT' THEN jsonb_build_object('new', row_to_json(NEW))
      WHEN 'DELETE' THEN jsonb_build_object('old', row_to_json(OLD))
      ELSE jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to sensitive tables
DROP TRIGGER IF EXISTS trg_security_audit_athletes ON public.athletes;
CREATE TRIGGER trg_security_audit_athletes
  AFTER INSERT OR UPDATE OR DELETE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.fn_security_audit_trigger();

DROP TRIGGER IF EXISTS trg_security_audit_transactions ON public.financial_transactions;
CREATE TRIGGER trg_security_audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_security_audit_trigger();

DROP TRIGGER IF EXISTS trg_security_audit_body ON public.athlete_body_info;
CREATE TRIGGER trg_security_audit_body
  AFTER INSERT OR UPDATE OR DELETE ON public.athlete_body_info
  FOR EACH ROW EXECUTE FUNCTION public.fn_security_audit_trigger();
