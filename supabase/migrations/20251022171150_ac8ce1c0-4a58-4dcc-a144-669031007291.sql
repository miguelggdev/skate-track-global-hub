-- Create function to recalculate athlete payment status
CREATE OR REPLACE FUNCTION public.recalc_athlete_payment_status(p_athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_payment record;
  v_payment_status text;
  v_current_month_start date;
BEGIN
  -- Get current month start
  v_current_month_start := date_trunc('month', CURRENT_DATE)::date;
  
  -- Find most recent paid monthly payment
  SELECT 
    id,
    transaction_date,
    date_trunc('month', transaction_date)::date as payment_month
  INTO v_recent_payment
  FROM financial_transactions
  WHERE athlete_id = p_athlete_id
    AND transaction_type = 'mensualidad'
    AND payment_status = 'paid'
  ORDER BY transaction_date DESC
  LIMIT 1;
  
  -- Update athlete based on payment status
  IF v_recent_payment.id IS NOT NULL THEN
    -- Determine status based on payment month
    IF v_recent_payment.payment_month >= v_current_month_start THEN
      v_payment_status := 'active';
    ELSE
      v_payment_status := 'overdue';
    END IF;
    
    -- Update athlete record
    UPDATE athletes
    SET 
      payment_status = v_payment_status,
      last_payment_month = v_recent_payment.payment_month,
      last_payment_date = v_recent_payment.transaction_date,
      updated_at = now()
    WHERE id = p_athlete_id;
  ELSE
    -- No payments found, set to pending
    UPDATE athletes
    SET 
      payment_status = 'pending',
      last_payment_month = NULL,
      last_payment_date = NULL,
      updated_at = now()
    WHERE id = p_athlete_id;
  END IF;
END;
$$;

-- Create trigger function that calls recalculation
CREATE OR REPLACE FUNCTION public.tg_recalc_athlete_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_athlete_id uuid;
BEGIN
  -- Determine athlete_id based on operation
  IF TG_OP = 'DELETE' THEN
    v_athlete_id := OLD.athlete_id;
  ELSE
    v_athlete_id := NEW.athlete_id;
  END IF;
  
  -- Only process if this is a mensualidad transaction
  IF (TG_OP = 'DELETE' AND OLD.transaction_type = 'mensualidad') OR
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.transaction_type = 'mensualidad') THEN
    -- Recalculate athlete payment status
    PERFORM recalc_athlete_payment_status(v_athlete_id);
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_recalc_payment_on_insert_update ON financial_transactions;
DROP TRIGGER IF EXISTS trg_recalc_payment_on_delete ON financial_transactions;

-- Create triggers for INSERT and UPDATE
CREATE TRIGGER trg_recalc_payment_on_insert_update
  AFTER INSERT OR UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION tg_recalc_athlete_payment_status();

-- Create trigger for DELETE
CREATE TRIGGER trg_recalc_payment_on_delete
  AFTER DELETE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION tg_recalc_athlete_payment_status();

-- Create performance index for paid monthly payments
CREATE INDEX IF NOT EXISTS idx_fin_tx_paid_monthly 
  ON financial_transactions (athlete_id, transaction_date) 
  WHERE transaction_type = 'mensualidad' AND payment_status = 'paid';

-- Add comment explaining the system
COMMENT ON FUNCTION public.recalc_athlete_payment_status IS 
  'Recalculates athlete payment status based on most recent paid monthly payment. Called automatically by triggers on financial_transactions.';

COMMENT ON FUNCTION public.tg_recalc_athlete_payment_status IS 
  'Trigger function that calls recalc_athlete_payment_status when financial_transactions change.';