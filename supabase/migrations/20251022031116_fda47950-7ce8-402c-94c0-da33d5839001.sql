-- Phase 1: Add payment status tracking columns to athletes table
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('active', 'pending', 'overdue')),
ADD COLUMN IF NOT EXISTS last_payment_month date,
ADD COLUMN IF NOT EXISTS last_payment_date date;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_athletes_payment_status ON athletes(payment_status);
CREATE INDEX IF NOT EXISTS idx_athletes_last_payment_month ON athletes(last_payment_month);

-- Phase 2: Create trigger function to auto-update payment status
CREATE OR REPLACE FUNCTION update_athlete_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update for paid monthly payments (mensualidad)
  IF NEW.transaction_type = 'mensualidad' AND NEW.payment_status = 'paid' THEN
    UPDATE athletes
    SET 
      payment_status = 'active',
      last_payment_month = DATE_TRUNC('month', NEW.transaction_date)::date,
      last_payment_date = NEW.transaction_date,
      updated_at = NOW()
    WHERE id = NEW.athlete_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for insert and update
CREATE TRIGGER after_transaction_insert
  AFTER INSERT ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_athlete_payment_status();

CREATE TRIGGER after_transaction_update
  AFTER UPDATE ON financial_transactions
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR OLD.transaction_date IS DISTINCT FROM NEW.transaction_date)
  EXECUTE FUNCTION update_athlete_payment_status();

-- Phase 3: Create function to mark overdue athletes
CREATE OR REPLACE FUNCTION mark_overdue_athletes()
RETURNS void AS $$
BEGIN
  UPDATE athletes
  SET payment_status = 'overdue',
      updated_at = NOW()
  WHERE payment_status = 'active'
    AND (
      last_payment_month IS NULL 
      OR last_payment_month < DATE_TRUNC('month', CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phase 4: Backfill existing data
WITH latest_payments AS (
  SELECT DISTINCT ON (athlete_id)
    athlete_id,
    transaction_date,
    DATE_TRUNC('month', transaction_date)::date as payment_month
  FROM financial_transactions
  WHERE transaction_type = 'mensualidad'
    AND payment_status = 'paid'
  ORDER BY athlete_id, transaction_date DESC
)
UPDATE athletes a
SET 
  payment_status = CASE 
    WHEN lp.payment_month >= DATE_TRUNC('month', CURRENT_DATE) THEN 'active'
    WHEN lp.payment_month IS NOT NULL THEN 'overdue'
    ELSE 'pending'
  END,
  last_payment_month = lp.payment_month,
  last_payment_date = lp.transaction_date,
  updated_at = NOW()
FROM latest_payments lp
WHERE a.id = lp.athlete_id;

-- Mark athletes with no payments as pending
UPDATE athletes
SET payment_status = COALESCE(payment_status, 'pending'),
    updated_at = NOW()
WHERE last_payment_month IS NULL;