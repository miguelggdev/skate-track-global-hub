-- Update current user to admin role and create sample data for testing
-- First, ensure your current user has admin privileges

-- Update current user to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Create sample team for testing
INSERT INTO public.teams (id, name, description, location, contact_email, contact_phone) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'Test Team Alpha', 'Main test team for development and testing', 'Test Ice Rink', 'team@testclub.com', '+34 123 456 789')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone;

-- Create sample competitions for testing
INSERT INTO public.competitions (id, name, description, start_date, end_date, location, status, level, category, entry_fee, max_participants) VALUES
('pppppppp-pppp-pppp-pppp-pppppppppppp', 'Test Championship 2025', 'Annual test competition for development', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '32 days', 'Test Arena', 'upcoming', 'intermediate', 'junior', 25.00, 50, NULL),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'Spring Training Cup', 'Spring season competition', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '62 days', 'Regional Arena', 'upcoming', 'advanced', 'senior', 40.00, 30, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  location = EXCLUDED.location,
  status = EXCLUDED.status,
  level = EXCLUDED.level,
  category = EXCLUDED.category,
  entry_fee = EXCLUDED.entry_fee,
  max_participants = EXCLUDED.max_participants;

-- Create sample equipment for testing
INSERT INTO public.equipment (id, name, category, brand, model, condition, cost, purchase_date, team_id) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Professional Skates Set A', 'skates', 'Riedell', 'Eclipse Aria', 'excellent', 450.00, CURRENT_DATE - INTERVAL '6 months', 'tttttttt-tttt-tttt-tttt-tttttttttttt'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Training Cones Set', 'training', 'SportCones', 'Pro Series', 'good', 85.00, CURRENT_DATE - INTERVAL '1 year', 'tttttttt-tttt-tttt-tttt-tttttttttttt')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  condition = EXCLUDED.condition,
  cost = EXCLUDED.cost,
  purchase_date = EXCLUDED.purchase_date,
  team_id = EXCLUDED.team_id;

-- Create sample financial transactions for testing
INSERT INTO public.financial_transactions (id, amount, transaction_type, description, transaction_date, payment_status, created_by) VALUES
('gggggggg-gggg-gggg-gggg-gggggggggggg', 150.00, 'income', 'Monthly membership fee - Test Transaction', CURRENT_DATE, 'completed', auth.uid()),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 75.00, 'expense', 'Equipment maintenance - Test Transaction', CURRENT_DATE - INTERVAL '5 days', 'completed', auth.uid())
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  transaction_type = EXCLUDED.transaction_type,
  description = EXCLUDED.description,
  transaction_date = EXCLUDED.transaction_date,
  payment_status = EXCLUDED.payment_status,
  created_by = EXCLUDED.created_by;