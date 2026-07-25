-- Create medal type enum
CREATE TYPE medal_type AS ENUM ('gold', 'silver', 'bronze');

-- Create event type enum
CREATE TYPE event_type AS ENUM (
  'speed_100m', 'speed_200m', 'speed_300m', 'speed_500m', 'speed_1000m', 'speed_1500m',
  'speed_3000m', 'speed_5000m', 'speed_10000m', 'speed_15000m', 'speed_20000m',
  'artistic_figures', 'artistic_freestyle', 'artistic_pairs', 'artistic_dance',
  'relay_4x100m', 'relay_4x200m', 'marathon', 'elimination', 'points_race'
);

-- Create competition_events table
CREATE TABLE public.competition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type event_type NOT NULL,
  category athlete_category,
  gender athlete_gender,
  age_group TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to competition_results table
ALTER TABLE public.competition_results 
  ADD COLUMN event_id UUID REFERENCES public.competition_events(id) ON DELETE SET NULL,
  ADD COLUMN medal_type medal_type,
  ADD COLUMN time_achieved INTERVAL,
  ADD COLUMN event_location TEXT,
  ADD COLUMN is_record BOOLEAN DEFAULT false,
  ADD COLUMN personal_best BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_competition_events_competition_id ON public.competition_events(competition_id);
CREATE INDEX idx_competition_events_event_type ON public.competition_events(event_type);
CREATE INDEX idx_competition_results_event_id ON public.competition_results(event_id);
CREATE INDEX idx_competition_results_medal_type ON public.competition_results(medal_type);
CREATE INDEX idx_competition_results_athlete_competition ON public.competition_results(athlete_id, competition_id);

-- Enable RLS on competition_events
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competition_events
CREATE POLICY "Anyone can view competition events"
  ON public.competition_events
  FOR SELECT
  USING (true);

CREATE POLICY "Admins/delegates/leaders manage competition events"
  ON public.competition_events
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'delegate'::user_role) OR 
    has_role(auth.uid(), 'leader'::user_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'delegate'::user_role) OR 
    has_role(auth.uid(), 'leader'::user_role)
  );

-- Add trigger for updated_at on competition_events
CREATE TRIGGER update_competition_events_updated_at
  BEFORE UPDATE ON public.competition_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint to ensure one medal per athlete per event
CREATE UNIQUE INDEX unique_athlete_event_medal 
  ON public.competition_results(athlete_id, event_id) 
  WHERE medal_type IS NOT NULL;

COMMENT ON TABLE public.competition_events IS 'Stores individual events within competitions with detailed information';
COMMENT ON TABLE public.competition_results IS 'Enhanced to track medals, times, and event-specific performance data';