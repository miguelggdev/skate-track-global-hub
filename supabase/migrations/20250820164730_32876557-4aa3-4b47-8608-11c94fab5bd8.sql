-- Ensure week_start_date exists and is always aligned to the session date's ISO week (Monday)
DO $$ BEGIN
  ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS week_start_date DATE;
EXCEPTION WHEN duplicate_column THEN
  -- ignore
  NULL;
END $$;

-- Backfill or correct all existing rows to guarantee consistency
UPDATE public.training_sessions
SET week_start_date = (date_trunc('week', "date"::timestamp)::date);

-- Create index for fast weekly lookups
CREATE INDEX IF NOT EXISTS idx_training_sessions_week_start_date
ON public.training_sessions (week_start_date);

-- Create or replace function that auto-sets week_start_date based on date
CREATE OR REPLACE FUNCTION public.set_training_week_start_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.week_start_date := (date_trunc('week', NEW."date"::timestamp)::date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to keep data correct on insert/update
DROP TRIGGER IF EXISTS trg_set_training_week_start_date ON public.training_sessions;
CREATE TRIGGER trg_set_training_week_start_date
BEFORE INSERT OR UPDATE OF "date"
ON public.training_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_training_week_start_date();