-- =============================================================
-- HOTFIX CRÍTICO — fuga cross-tenant encontrada en auditoría de
-- seguridad del 26-ago-2026 (mismo patrón que los incidentes de
-- Fase 3 y Storage: falta el filtro de club_id).
--
-- 1) user_roles era la ÚNICA tabla de negocio con club_id que no
--    tenía la policy RESTRICTIVE `tenant_isolation`. Un admin de
--    un club podía leer/escribir/borrar user_roles de CUALQUIER
--    club — incluida la posibilidad de auto-asignarse admin en
--    un club ajeno (escalación de privilegios completa).
--
-- 2) Tres funciones SECURITY DEFINER (ignoran RLS por diseño)
--    no filtraban por club_id, exponiendo datos financieros de
--    TODOS los clubes a cualquier usuario autenticado, o
--    permitiendo marcar facturas de otro club como pagadas.
--
-- get_user_club_id() es SECURITY DEFINER sobre user_claims (no
-- sobre user_roles), así que usarla en una policy de user_roles
-- no genera la recursión RLS del incidente de Fase 3.
-- =============================================================

-- ── 1) user_roles: agregar el aislamiento que faltaba ──────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON public.user_roles;
CREATE POLICY "tenant_isolation"
  ON public.user_roles AS RESTRICTIVE
  FOR ALL
  USING (club_id = public.get_user_club_id(auth.uid()))
  WITH CHECK (club_id = public.get_user_club_id(auth.uid()));

-- ── 2) get_financial_summary(): agregar filtro de club ──────────────────────

CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT json_build_object(
        'total_income',
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        'total_expenses',
            COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0),
        'net_profit',
            COALESCE(SUM(amount), 0),
        'pending_amount',
            COALESCE(SUM(CASE WHEN payment_status = 'pending'
                              THEN ABS(amount) ELSE 0 END), 0),
        'pending_count',
            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END),
        'current_month_income',
            COALESCE(SUM(CASE
                WHEN amount > 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE)
                THEN amount ELSE 0 END), 0),
        'prev_month_income',
            COALESCE(SUM(CASE
                WHEN amount > 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                THEN amount ELSE 0 END), 0),
        'current_month_expenses',
            COALESCE(ABS(SUM(CASE
                WHEN amount < 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE)
                THEN amount ELSE 0 END)), 0),
        'prev_month_expenses',
            COALESCE(ABS(SUM(CASE
                WHEN amount < 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                THEN amount ELSE 0 END)), 0),
        'pending_count_current',
            COUNT(CASE WHEN payment_status IN ('pending','overdue') THEN 1 END)
    )
    FROM financial_transactions
    WHERE club_id = public.get_user_club_id(auth.uid());
$function$;

-- ── 3) get_invoice_summary_by_month(): agregar filtro de club ──────────────

CREATE OR REPLACE FUNCTION public.get_invoice_summary_by_month(p_year integer, p_month integer)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'total_invoices',  COUNT(*),
    'paid',            COUNT(*) FILTER (WHERE status = 'paid'),
    'pending',         COUNT(*) FILTER (WHERE status IN ('draft', 'sent')),
    'cancelled',       COUNT(*) FILTER (WHERE status = 'cancelled'),
    'total_amount',    COALESCE(SUM(amount), 0),
    'paid_amount',     COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
    'pending_amount',  COALESCE(SUM(amount) FILTER (WHERE status IN ('draft', 'sent')), 0),
    'collection_rate', CASE
                         WHEN COUNT(*) > 0
                         THEN ROUND(
                           100.0 * COUNT(*) FILTER (WHERE status = 'paid') / COUNT(*),
                           1
                         )
                         ELSE 0
                       END
  )
  FROM public.invoices
  WHERE period_year  = p_year
    AND period_month = p_month
    AND club_id = public.get_user_club_id(auth.uid());
$function$;

-- ── 4) mark_invoice_paid(): validar que la factura sea del propio club ─────

CREATE OR REPLACE FUNCTION public.mark_invoice_paid(p_invoice_id uuid, p_transaction_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice public.invoices%ROWTYPE;
BEGIN
  -- Role gate: only privileged roles may mark invoices as paid
  IF NOT (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'finance') OR
    has_role(auth.uid(), 'leader')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  -- Fetch the target invoice
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Factura no encontrada');
  END IF;

  -- Club gate: la factura debe pertenecer al club del caller
  IF v_invoice.club_id IS DISTINCT FROM public.get_user_club_id(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Factura no encontrada');
  END IF;

  -- Guard: do not re-pay an already-paid invoice
  IF v_invoice.status = 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'La factura ya está pagada');
  END IF;

  -- Atomically update status, paid_at, and optional transaction link
  UPDATE public.invoices
  SET
    status         = 'paid',
    paid_at        = now(),
    transaction_id = p_transaction_id
  WHERE id = p_invoice_id;

  RETURN json_build_object(
    'success',        true,
    'invoice_number', v_invoice.invoice_number
  );
END;
$function$;

-- ── 5) get_athlete_by_nfc_uid(): agregar filtro de club ─────────────────────

CREATE OR REPLACE FUNCTION public.get_athlete_by_nfc_uid(p_uid text)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      AND a.club_id = public.get_user_club_id(auth.uid())
    LIMIT 1
  );
END;
$function$;
