-- Create tables for enhanced KPI tracking

-- Sponsorship tracking table
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_name TEXT NOT NULL,
  sponsor_type TEXT NOT NULL CHECK (sponsor_type IN ('title', 'equipment', 'financial', 'media')),
  contract_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'cancelled')),
  roi_metrics JSONB,
  contact_person TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monthly targets table for KPI tracking
CREATE TABLE IF NOT EXISTS public.monthly_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  revenue_target NUMERIC(10,2) NOT NULL DEFAULT 0,
  athlete_target INTEGER NOT NULL DEFAULT 0,
  attendance_target NUMERIC(5,2) NOT NULL DEFAULT 0,
  retention_target NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month)
);

-- Member retention tracking
CREATE TABLE IF NOT EXISTS public.member_retention (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  retention_period TEXT NOT NULL CHECK (retention_period IN ('monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'churned', 'suspended')),
  churn_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Awards and achievements tracking
CREATE TABLE IF NOT EXISTS public.awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  award_type TEXT NOT NULL CHECK (award_type IN ('gold', 'silver', 'bronze', 'participation', 'special')),
  award_name TEXT NOT NULL,
  award_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment maintenance tracking
CREATE TABLE IF NOT EXISTS public.equipment_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'replacement', 'inspection')),
  maintenance_date DATE NOT NULL,
  cost NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  next_maintenance_date DATE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add updated_at triggers
CREATE TRIGGER update_sponsorships_updated_at
  BEFORE UPDATE ON public.sponsorships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_targets_updated_at
  BEFORE UPDATE ON public.monthly_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_retention ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage sponsorships" ON public.sponsorships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'leader'::user_role])
    )
  );

CREATE POLICY "Admins can manage monthly targets" ON public.monthly_targets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'leader'::user_role])
    )
  );

CREATE POLICY "Anyone can view awards" ON public.awards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage awards" ON public.awards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'coach'::user_role, 'leader'::user_role])
    )
  );

CREATE POLICY "Anyone can view retention data" ON public.member_retention
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage retention data" ON public.member_retention
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'leader'::user_role])
    )
  );

CREATE POLICY "Anyone can view equipment maintenance" ON public.equipment_maintenance
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage equipment maintenance" ON public.equipment_maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'leader'::user_role])
    )
  );

-- Insert sample data for demonstration
INSERT INTO public.sponsorships (sponsor_name, sponsor_type, contract_value, start_date, end_date, status) VALUES
  ('SportsTech Solutions', 'equipment', 25000.00, '2024-01-01', '2024-12-31', 'active'),
  ('Local Bank Corp', 'financial', 50000.00, '2024-01-01', '2024-12-31', 'active'),
  ('Energy Drink Co', 'title', 75000.00, '2024-01-01', '2025-12-31', 'active'),
  ('Sports Media Network', 'media', 15000.00, '2024-06-01', '2024-12-31', 'active');

INSERT INTO public.monthly_targets (month, revenue_target, athlete_target, attendance_target, retention_target) VALUES
  ('2024-01-01', 45000.00, 160, 85.0, 92.0),
  ('2024-02-01', 47000.00, 165, 87.0, 93.0),
  ('2024-03-01', 50000.00, 170, 88.0, 94.0),
  ('2024-04-01', 52000.00, 175, 90.0, 95.0);

-- Insert sample awards data (needs existing athletes)
DO $$
DECLARE
    athlete_record RECORD;
BEGIN
    FOR athlete_record IN 
        SELECT id FROM public.athletes LIMIT 5
    LOOP
        INSERT INTO public.awards (athlete_id, award_type, award_name, award_date, points_earned) VALUES
            (athlete_record.id, 'gold', 'Regional Championship Gold', '2024-03-15', 100),
            (athlete_record.id, 'silver', 'State Competition Silver', '2024-02-20', 75);
    END LOOP;
END $$;