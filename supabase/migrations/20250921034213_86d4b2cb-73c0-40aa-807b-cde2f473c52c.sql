-- Create unique index on training_kpis to fix ON CONFLICT error
CREATE UNIQUE INDEX IF NOT EXISTS training_kpis_athlete_month_unique 
ON training_kpis (athlete_id, month);