-- =============================================================
-- Add missing columns to athletes table
-- Referenced by multiple frontend hooks and pages but absent
-- from all prior migrations.
-- =============================================================

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS athlete_number  text,
  ADD COLUMN IF NOT EXISTS join_date       date,
  ADD COLUMN IF NOT EXISTS main_discipline text;

-- Default join_date to created_at for existing athletes
UPDATE public.athletes
  SET join_date = created_at::date
  WHERE join_date IS NULL;

-- Index for athlete_number search (used in TopNavigation)
CREATE INDEX IF NOT EXISTS idx_athletes_athlete_number
  ON public.athletes (athlete_number)
  WHERE athlete_number IS NOT NULL;
