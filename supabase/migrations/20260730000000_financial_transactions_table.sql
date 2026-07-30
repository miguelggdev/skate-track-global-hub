-- =============================================================
-- CREATE financial_transactions TABLE
-- The frontend uses this table throughout, but only the old
-- `transactions` table (different column names) existed.
-- This migration adds the expected table and migrates legacy data.
-- =============================================================

-- Additional transaction_type enum values used by delegate payments
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'competition_district';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'competition_departmental';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'competition_marathon';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'competition_panamerican';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'competition_interleague';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'accident_insurance';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'league_registration_renewal';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'federation_registration_renewal';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'registration_fee';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'equipment';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'travel';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'other';

-- Main financial_transactions table (matches what all frontend hooks expect)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  team_id          uuid,
  amount           numeric(12,2) NOT NULL DEFAULT 0,
  transaction_type transaction_type NOT NULL,
  payment_status   transaction_status NOT NULL DEFAULT 'pending',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date         date,
  description      text,
  payer_name       text,
  payer_phone      text,
  payer_email      text,
  notes            text,
  category         text,
  receipt_url      text,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Migrate data from legacy transactions table
INSERT INTO public.financial_transactions (
  id, athlete_id, amount, transaction_type, payment_status,
  transaction_date, due_date, payer_name, receipt_url, notes,
  created_by, created_at, updated_at
)
SELECT
  id,
  athlete_id,
  amount,
  type,
  status,
  COALESCE(paid_at::date, COALESCE(due_date, created_at::date)),
  due_date,
  payer_name,
  receipt_url,
  notes,
  created_by,
  created_at,
  updated_at
FROM public.transactions
ON CONFLICT (id) DO NOTHING;

-- DEPRECATION NOTICE: public.transactions is kept for backward compatibility
-- (FinanceCharts.tsx reads legacy data from it). All new writes go to
-- financial_transactions. Do NOT drop transactions until legacy data is
-- fully migrated and FinanceCharts.tsx is updated.
COMMENT ON TABLE public.transactions IS 'DEPRECATED — usar financial_transactions para nuevos registros';


-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ft_athlete_id        ON public.financial_transactions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_ft_payment_status    ON public.financial_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_ft_transaction_type  ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ft_transaction_date  ON public.financial_transactions(transaction_date DESC);

-- RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and finance can manage all transactions"
  ON public.financial_transactions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'leader'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "Delegates can view and create non-monthly transactions"
  ON public.financial_transactions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'delegate'));

CREATE POLICY "Delegates can insert non-monthly transactions"
  ON public.financial_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'delegate')
    AND transaction_type NOT IN ('mensualidad', 'anualidad')
  );

CREATE POLICY "Athletes can view own transactions"
  ON public.financial_transactions
  FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view transactions for their athletes"
  ON public.financial_transactions
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'coach')
    AND athlete_id IN (
      SELECT ca.athlete_id FROM public.coach_athletes ca
      JOIN public.coaches c ON c.id = ca.coach_id
      WHERE c.user_id = auth.uid()
    )
  );
