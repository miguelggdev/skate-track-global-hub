-- Add new transaction types for delegate-specific payments
-- Note: PostgreSQL ENUM types require separate ALTER statements for each value

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'competition_district';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'competition_departmental';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'competition_marathon';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'competition_panamerican';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'competition_interleague';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'accident_insurance';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'league_registration_renewal';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'federation_registration_renewal';

-- Allow delegates to create external competition payments (not monthly fees)
CREATE POLICY "Delegates can create external payments"
ON public.financial_transactions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'delegate'::user_role) AND
  transaction_type NOT IN ('mensualidad', 'anualidad')
);

-- Allow delegates to view all competition-related payments (not monthly fees)
CREATE POLICY "Delegates can view competition payments"
ON public.financial_transactions
FOR SELECT
USING (
  has_role(auth.uid(), 'delegate'::user_role) AND
  transaction_type NOT IN ('mensualidad', 'anualidad')
);

-- Allow delegates to update payments they created (for competition/external payments only)
CREATE POLICY "Delegates can update own created payments"
ON public.financial_transactions
FOR UPDATE
USING (
  has_role(auth.uid(), 'delegate'::user_role) AND
  created_by = auth.uid() AND
  transaction_type NOT IN ('mensualidad', 'anualidad')
);

-- Allow delegates to view all athletes
CREATE POLICY "Delegates can view all athletes"
ON public.athletes
FOR SELECT
USING (has_role(auth.uid(), 'delegate'::user_role));

-- Allow delegates to update athlete sports information
CREATE POLICY "Delegates can update athletes"
ON public.athletes
FOR UPDATE
USING (has_role(auth.uid(), 'delegate'::user_role));

-- Allow delegates to view all profiles
CREATE POLICY "Delegates can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'delegate'::user_role));

-- Allow delegates to view training sessions
CREATE POLICY "Delegates can view training sessions"
ON public.training_sessions
FOR SELECT
USING (has_role(auth.uid(), 'delegate'::user_role));

-- Allow delegates to view athlete body info
CREATE POLICY "Delegates can view body info"
ON public.athlete_body_info
FOR SELECT
USING (has_role(auth.uid(), 'delegate'::user_role));

-- Allow delegates to view athlete family info
CREATE POLICY "Delegates can view family info"
ON public.athlete_family
FOR SELECT
USING (has_role(auth.uid(), 'delegate'::user_role));

-- Allow delegates to view athlete history
CREATE POLICY "Delegates can view athlete history"
ON public.athlete_history
FOR SELECT
USING (has_role(auth.uid(), 'delegate'::user_role));

-- Allow delegates to view athlete studies
CREATE POLICY "Delegates can view athlete studies"
ON public.athlete_studies
FOR SELECT
USING (has_role(auth.uid(), 'delegate'::user_role));