-- Create club_settings table for general club configuration
CREATE TABLE public.club_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name TEXT NOT NULL DEFAULT 'Mi Club',
  club_logo_url TEXT,
  club_description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  website_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  timezone TEXT DEFAULT 'Europe/Madrid',
  currency TEXT DEFAULT 'EUR',
  language TEXT DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_settings table for app-specific settings
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- general, payments, training, competitions, notifications
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default club settings
INSERT INTO public.club_settings (club_name, club_description) 
VALUES ('Mi Club de Patinaje', 'Club de patinaje artístico y patinaje de velocidad');

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category) VALUES
('max_athletes_per_coach', '15', 'number', 'Máximo número de atletas por entrenador', 'training'),
('session_duration_default', '90', 'number', 'Duración por defecto de sesiones de entrenamiento (minutos)', 'training'),
('advance_payment_required', 'true', 'boolean', 'Requiere pago por adelantado para inscripciones', 'payments'),
('late_payment_fee', '10', 'number', 'Tarifa por pago tardío (€)', 'payments'),
('email_notifications', 'true', 'boolean', 'Enviar notificaciones por email', 'notifications'),
('sms_notifications', 'false', 'boolean', 'Enviar notificaciones por SMS', 'notifications'),
('auto_backup', 'true', 'boolean', 'Realizar copias de seguridad automáticas', 'general'),
('competition_registration_deadline', '7', 'number', 'Días de antelación para inscripción en competiciones', 'competitions');

-- Enable RLS
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for club_settings (only admins can manage)
CREATE POLICY "Admins can view club settings" 
ON public.club_settings 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
));

CREATE POLICY "Admins can update club settings" 
ON public.club_settings 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
));

-- Create policies for system_settings (only admins can manage)
CREATE POLICY "Admins can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
));

CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::user_role, 'leader'::user_role])
));

-- Create triggers for updated_at
CREATE TRIGGER update_club_settings_updated_at
BEFORE UPDATE ON public.club_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();