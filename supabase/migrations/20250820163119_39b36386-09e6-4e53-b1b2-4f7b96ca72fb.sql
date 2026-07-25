-- Add week_start_date to anchor sessions to the selected week's Monday
-- This helps ensure schedules are grouped and queried correctly
ALTER TABLE public.training_sessions
ADD COLUMN IF NOT EXISTS week_start_date DATE;

-- Backfill existing rows using ISO week (Monday start)
UPDATE public.training_sessions
SET week_start_date = (date_trunc('week', "date"::timestamp)::date)
WHERE week_start_date IS NULL AND "date" IS NOT NULL;

-- Index for faster weekly queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_week_start_date
ON public.training_sessions (week_start_date);
