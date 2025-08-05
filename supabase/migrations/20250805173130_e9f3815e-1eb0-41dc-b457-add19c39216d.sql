-- Update training_type enum to include all training types
ALTER TYPE training_type ADD VALUE IF NOT EXISTS 'gym';
ALTER TYPE training_type ADD VALUE IF NOT EXISTS 'road_skating';
ALTER TYPE training_type ADD VALUE IF NOT EXISTS 'track_skating';
ALTER TYPE training_type ADD VALUE IF NOT EXISTS 'bicycle';
ALTER TYPE training_type ADD VALUE IF NOT EXISTS 'static_bicycle';
ALTER TYPE training_type ADD VALUE IF NOT EXISTS 'simulator';

-- Create training_kpis table for calculated metrics
CREATE TABLE public.training_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id),
  coach_id UUID REFERENCES public.coaches(id),
  month DATE NOT NULL,
  total_hours NUMERIC DEFAULT 0,
  attendance_percentage NUMERIC DEFAULT 0,
  training_type_distribution JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_summaries table for pre-calculated attendance
CREATE TABLE public.attendance_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id),
  training_session_id UUID REFERENCES public.training_sessions(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  attended_sessions INTEGER DEFAULT 0,
  attendance_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.training_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for training_kpis
CREATE POLICY "Athletes can view own KPIs" 
ON public.training_kpis 
FOR SELECT 
USING (
  athlete_id IN (
    SELECT athletes.id FROM athletes WHERE athletes.user_id = auth.uid()
  ) OR
  coach_id IN (
    SELECT coaches.id FROM coaches WHERE coaches.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'leader')
  )
);

CREATE POLICY "Coaches and admins can manage KPIs" 
ON public.training_kpis 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coach', 'leader')
  )
);

-- Create policies for attendance_summaries
CREATE POLICY "Athletes can view own attendance summaries" 
ON public.attendance_summaries 
FOR SELECT 
USING (
  athlete_id IN (
    SELECT athletes.id FROM athletes WHERE athletes.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coach', 'leader')
  )
);

CREATE POLICY "Coaches and admins can manage attendance summaries" 
ON public.attendance_summaries 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coach', 'leader')
  )
);

-- Create function to calculate training duration
CREATE OR REPLACE FUNCTION public.calculate_training_duration(
  start_time TIME,
  end_time TIME
) RETURNS NUMERIC AS $$
BEGIN
  RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0;
END;
$$ LANGUAGE plpgsql;

-- Create function to update attendance KPIs
CREATE OR REPLACE FUNCTION public.update_attendance_kpis()
RETURNS TRIGGER AS $$
DECLARE
  athlete_record RECORD;
  kpi_month DATE;
BEGIN
  -- Determine which athlete and month to update
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    kpi_month := DATE_TRUNC('month', 
      (SELECT date FROM training_sessions WHERE id = NEW.training_session_id)
    );
    
    -- Update KPIs for the athlete
    INSERT INTO training_kpis (athlete_id, month, total_hours, attendance_percentage)
    SELECT 
      NEW.athlete_id,
      kpi_month,
      COALESCE(SUM(calculate_training_duration(ts.start_time, ts.end_time)), 0),
      CASE 
        WHEN COUNT(ta.id) > 0 THEN 
          (COUNT(CASE WHEN ta.attended THEN 1 END) * 100.0 / COUNT(ta.id))
        ELSE 0 
      END
    FROM training_attendance ta
    JOIN training_sessions ts ON ta.training_session_id = ts.id
    WHERE ta.athlete_id = NEW.athlete_id
      AND DATE_TRUNC('month', ts.date) = kpi_month
    ON CONFLICT (athlete_id, month) 
    DO UPDATE SET
      total_hours = EXCLUDED.total_hours,
      attendance_percentage = EXCLUDED.attendance_percentage,
      updated_at = now();
      
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic KPI updates
CREATE TRIGGER update_attendance_kpis_trigger
  AFTER INSERT OR UPDATE OR DELETE ON training_attendance
  FOR EACH ROW EXECUTE FUNCTION update_attendance_kpis();

-- Create validation function for edit time limits
CREATE OR REPLACE FUNCTION public.validate_edit_time_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to edit anytime
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Check 48-hour limit for others
  IF TG_OP = 'UPDATE' AND OLD.created_at < (now() - INTERVAL '48 hours') THEN
    RAISE EXCEPTION 'Cannot edit attendance records older than 48 hours';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add edit time limit trigger to training_attendance
CREATE TRIGGER validate_attendance_edit_time
  BEFORE UPDATE ON training_attendance
  FOR EACH ROW EXECUTE FUNCTION validate_edit_time_limit();

-- Add triggers for updated_at
CREATE TRIGGER update_training_kpis_updated_at
  BEFORE UPDATE ON training_kpis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_summaries_updated_at
  BEFORE UPDATE ON attendance_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();