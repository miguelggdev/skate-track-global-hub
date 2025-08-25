-- Create athlete_history table for skating history information
CREATE TABLE public.athlete_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    previous_club TEXT,
    years_experience INTEGER DEFAULT 0,
    start_date DATE,
    league_date DATE,
    federation_date DATE,
    is_league BOOLEAN DEFAULT false,
    is_federated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create athlete_studies table for educational information
CREATE TABLE public.athlete_studies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    education_level TEXT,
    current_grade TEXT,
    school_name TEXT,
    school_address TEXT,
    school_phone TEXT,
    school_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create athlete_body_info table for body measurements and medical information
CREATE TABLE public.athlete_body_info (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    weight NUMERIC,
    height NUMERIC,
    size TEXT,
    blood_type TEXT,
    allergies TEXT,
    surgeries TEXT,
    injuries TEXT,
    limitations TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create athlete_equipment table for skating equipment information
CREATE TABLE public.athlete_equipment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    boot_brand TEXT,
    boot_size INTEGER,
    frame_brand TEXT,
    frame_size TEXT,
    track_wheels_brand TEXT,
    wheel_diameter INTEGER,
    helmet_brand TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create athlete_family table for family contact information
CREATE TABLE public.athlete_family (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    guardian_name TEXT,
    guardian_relationship TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.athlete_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_body_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_family ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for athlete_history
CREATE POLICY "Athletes can view own history"
ON public.athlete_history
FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert own history"
ON public.athlete_history
FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can update own history"
ON public.athlete_history
FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all history"
ON public.athlete_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- Create RLS policies for athlete_studies
CREATE POLICY "Athletes can view own studies"
ON public.athlete_studies
FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert own studies"
ON public.athlete_studies
FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can update own studies"
ON public.athlete_studies
FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all studies"
ON public.athlete_studies
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- Create RLS policies for athlete_body_info
CREATE POLICY "Athletes can view own body info"
ON public.athlete_body_info
FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert own body info"
ON public.athlete_body_info
FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can update own body info"
ON public.athlete_body_info
FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all body info"
ON public.athlete_body_info
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- Create RLS policies for athlete_equipment
CREATE POLICY "Athletes can view own equipment"
ON public.athlete_equipment
FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert own equipment"
ON public.athlete_equipment
FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can update own equipment"
ON public.athlete_equipment
FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all equipment"
ON public.athlete_equipment
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- Create RLS policies for athlete_family
CREATE POLICY "Athletes can view own family"
ON public.athlete_family
FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert own family"
ON public.athlete_family
FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can update own family"
ON public.athlete_family
FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all family"
ON public.athlete_family
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'coach'::user_role) OR has_role(auth.uid(), 'leader'::user_role));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_athlete_history_updated_at
BEFORE UPDATE ON public.athlete_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_athlete_studies_updated_at
BEFORE UPDATE ON public.athlete_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_athlete_body_info_updated_at
BEFORE UPDATE ON public.athlete_body_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_athlete_equipment_updated_at
BEFORE UPDATE ON public.athlete_equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_athlete_family_updated_at
BEFORE UPDATE ON public.athlete_family
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();