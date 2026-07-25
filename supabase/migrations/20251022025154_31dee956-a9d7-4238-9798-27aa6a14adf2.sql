-- Fee Management Settings Migration
-- Add new payment settings to system_settings table

-- Insert monthly fee setting
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category)
VALUES 
  ('monthly_fee', '230000', 'number', 'Cuota mensual base por deportista (COP)', 'payments')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert registration fee setting
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category)
VALUES 
  ('registration_fee', '150000', 'number', 'Cuota de inscripción inicial (COP)', 'payments')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert enable extraordinary increment setting
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category)
VALUES 
  ('enable_extraordinary_increment', 'false', 'boolean', 'Activar incremento extraordinario de cuota', 'payments')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert increment start day setting
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category)
VALUES 
  ('increment_start_day', '15', 'number', 'Día del mes cuando inicia el incremento (1-31)', 'payments')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert increment percentage setting
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category)
VALUES 
  ('increment_percentage', '10', 'number', 'Porcentaje de incremento extraordinario (0-100)', 'payments')
ON CONFLICT (setting_key) DO NOTHING;

-- Add columns to financial_transactions for tracking increment application
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS base_amount numeric,
ADD COLUMN IF NOT EXISTS increment_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS increment_amount numeric DEFAULT 0;

-- Add comment to describe the increment tracking columns
COMMENT ON COLUMN public.financial_transactions.base_amount IS 'Cuota base sin incremento';
COMMENT ON COLUMN public.financial_transactions.increment_applied IS 'Indica si se aplicó incremento extraordinario';
COMMENT ON COLUMN public.financial_transactions.increment_amount IS 'Monto del incremento aplicado';