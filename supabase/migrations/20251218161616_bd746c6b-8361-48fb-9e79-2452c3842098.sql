-- Create athlete_socials table
CREATE TABLE public.athlete_socials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  whatsapp TEXT,
  youtube TEXT,
  twitter TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(athlete_id)
);

-- Create medical_sessions table
CREATE TABLE public.medical_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  session_date DATE NOT NULL,
  provider_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to athletes table
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS main_discipline TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS personal_values TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS short_term_goals TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS long_term_goals TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS club_name TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Enable RLS on new tables
ALTER TABLE public.athlete_socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for athlete_socials
CREATE POLICY "Athletes can view own socials"
ON public.athlete_socials FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert own socials"
ON public.athlete_socials FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can update own socials"
ON public.athlete_socials FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all socials"
ON public.athlete_socials FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- RLS policies for medical_sessions
CREATE POLICY "Athletes can view own medical sessions"
ON public.medical_sessions FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert own medical sessions"
ON public.medical_sessions FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can update own medical sessions"
ON public.medical_sessions FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all medical sessions"
ON public.medical_sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- Create updated_at triggers
CREATE TRIGGER update_athlete_socials_updated_at
BEFORE UPDATE ON public.athlete_socials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_sessions_updated_at
BEFORE UPDATE ON public.medical_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();