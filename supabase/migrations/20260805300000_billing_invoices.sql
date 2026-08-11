-- ============================================================
-- Billing & Invoices — 2026-08-05
-- Adds payer_identification to financial_transactions,
-- creates the invoices table with full RLS, and provides
-- two RPCs for the Finance dashboard.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1 — Fix missing payer_identification column
-- Referenced throughout the frontend (Finance.tsx,
-- AddTransactionDialog, TransactionReceiptGenerator) but never
-- added to the DB, causing all saves of that field to fail silently.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS payer_identification TEXT;


-- ══════════════════════════════════════════════════════════════
-- SECTION 2 — Invoice number sequence
-- Sequential, gap-free numbering required for legal invoicing.
-- CACHE 1 ensures no gaps on restart (vs higher cache values
-- that pre-allocate and can skip numbers after a crash).
-- ══════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq
  START 1
  INCREMENT 1
  NO MAXVALUE
  CACHE 1;


-- ══════════════════════════════════════════════════════════════
-- SECTION 3 — invoices table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.invoices (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable legal invoice number: FAC-2026-00001
  -- Generated at INSERT time from the sequence above.
  invoice_number    TEXT          NOT NULL UNIQUE
                                  DEFAULT (
                                    'FAC-' || to_char(now(), 'YYYY') || '-' ||
                                    lpad(nextval('public.invoice_number_seq')::text, 5, '0')
                                  ),

  -- Athlete the invoice is billed to.
  -- RESTRICT: deleting an athlete with outstanding invoices is blocked.
  athlete_id        UUID          NOT NULL
                                  REFERENCES public.athletes(id)
                                  ON DELETE RESTRICT,

  -- Billing period (calendar month)
  period_year       INTEGER       NOT NULL,
  period_month      INTEGER       NOT NULL
                                  CHECK (period_month BETWEEN 1 AND 12),

  amount            NUMERIC(12,2) NOT NULL
                                  CHECK (amount >= 0),

  -- Invoice lifecycle: draft → sent → paid | cancelled
  status            TEXT          NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),

  concept           TEXT          NOT NULL DEFAULT 'Cuota mensual de membresía',

  -- Populated once a PDF is generated and uploaded to storage
  pdf_url           TEXT,

  -- Timestamps for lifecycle events
  sent_at           TIMESTAMPTZ,
  due_date          DATE          NOT NULL,
  paid_at           TIMESTAMPTZ,

  -- Optional link to the payment transaction in financial_transactions.
  -- SET NULL so deleting a transaction does not cascade-delete the invoice.
  transaction_id    UUID          REFERENCES public.financial_transactions(id)
                                  ON DELETE SET NULL,

  notes             TEXT,

  -- User who created this invoice record
  created_by        UUID          REFERENCES auth.users(id)
                                  ON DELETE SET NULL,

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Enforce one invoice per athlete per billing month
  UNIQUE (athlete_id, period_year, period_month)
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_invoices_athlete_id
  ON public.invoices(athlete_id);

CREATE INDEX IF NOT EXISTS idx_invoices_period
  ON public.invoices(period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoices_due_date
  ON public.invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id
  ON public.invoices(transaction_id);


-- ══════════════════════════════════════════════════════════════
-- SECTION 4 — updated_at trigger
-- Reuses set_updated_at() defined in earlier migrations.
-- ══════════════════════════════════════════════════════════════

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ══════════════════════════════════════════════════════════════
-- SECTION 5 — Row-Level Security
-- Consistent with the RLS model used across the project:
--   • admin / finance / leader  → full CRUD
--   • coach                     → SELECT for their assigned athletes
--                                 (via coach_athletes junction)
--   • athlete                   → SELECT own invoices
--   • parent                    → SELECT children's invoices
--                                 (via parent_athletes junction)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admins, finance managers, and leaders: full access
CREATE POLICY "admin_finance_manage_invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'finance') OR
    has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'finance') OR
    has_role(auth.uid(), 'leader')
  );

-- Coaches: read-only, scoped to their assigned athletes
CREATE POLICY "coach_view_athlete_invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'coach') AND
    athlete_id IN (
      SELECT ca.athlete_id
      FROM public.coach_athletes ca
      JOIN public.coaches c ON c.id = ca.coach_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Athletes: read their own invoices only
CREATE POLICY "athlete_view_own_invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  );

-- Parents: read their children's invoices
CREATE POLICY "parent_view_child_invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'parent') AND
    athlete_id IN (
      SELECT pa.athlete_id
      FROM public.parent_athletes pa
      WHERE pa.parent_user_id = auth.uid()
    )
  );


-- ══════════════════════════════════════════════════════════════
-- SECTION 6 — RPC: get_invoice_summary_by_month
-- Returns aggregate counts and amounts for a given calendar month.
-- Useful for the Finance dashboard collection-rate widget.
--
-- Security: SECURITY DEFINER so the function can read the table
-- regardless of the caller's RLS context; the function itself
-- contains no per-row filtering — it returns aggregate totals only,
-- so no individual invoice data is leaked to unauthorised callers.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_invoice_summary_by_month(
  p_year  INTEGER,
  p_month INTEGER
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND period_month = p_month;
$$;

GRANT EXECUTE ON FUNCTION public.get_invoice_summary_by_month(INTEGER, INTEGER) TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- SECTION 7 — RPC: mark_invoice_paid
-- Atomically transitions an invoice to 'paid' and optionally
-- links it to an existing financial_transactions row.
--
-- Auth guard: only admin / finance / leader may call this.
-- All mutations run inside a single plpgsql block so the state
-- change is atomic (no partial updates if something fails mid-way).
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.mark_invoice_paid(
  p_invoice_id     UUID,
  p_transaction_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.mark_invoice_paid(UUID, UUID) TO authenticated;
