-- =============================================================
-- Add missing columns to competitions and competition_results
-- Referenced throughout the frontend but absent from prior migrations.
-- =============================================================

-- competitions.status (used for filtering upcoming/ongoing/completed events)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'competitions'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.competitions
      ADD COLUMN status text NOT NULL DEFAULT 'upcoming'
        CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'));
  END IF;
END $$;

-- Derive initial status from dates for existing rows
UPDATE public.competitions SET status = CASE
  WHEN start_date > CURRENT_DATE THEN 'upcoming'
  WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 'completed'
  WHEN start_date <= CURRENT_DATE AND (end_date IS NULL OR end_date >= CURRENT_DATE) THEN 'ongoing'
  ELSE 'upcoming'
END
WHERE status = 'upcoming';  -- only update rows with default value

CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);

-- competition_results.medal_type (referenced by 20260728 migration index and frontend)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'competition_results'
      AND column_name = 'medal_type'
  ) THEN
    ALTER TABLE public.competition_results
      ADD COLUMN medal_type text
        CHECK (medal_type IN ('gold', 'silver', 'bronze', 'special', 'destacado'));
  END IF;
END $$;

-- Set medal_type based on position for existing results
UPDATE public.competition_results SET medal_type = CASE
  WHEN position = 1 THEN 'gold'
  WHEN position = 2 THEN 'silver'
  WHEN position = 3 THEN 'bronze'
  ELSE NULL
END
WHERE medal_type IS NULL AND position IS NOT NULL AND position <= 3;

-- Drop and recreate the index from 20260728 migration safely
DROP INDEX IF EXISTS idx_comp_results_medal_type;
DROP INDEX IF EXISTS idx_comp_results_medal_athlete;

CREATE INDEX IF NOT EXISTS idx_comp_results_medal_type
  ON public.competition_results(competition_id, medal_type)
  WHERE medal_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_results_medal_athlete
  ON public.competition_results(athlete_id, competition_id)
  WHERE medal_type IS NOT NULL;
