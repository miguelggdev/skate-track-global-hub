-- Update current user to admin role and create basic test data
-- First, ensure your current user has admin privileges

-- Update current user to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Create sample team for testing
INSERT INTO public.teams (name, description, location, contact_email, contact_phone) VALUES
('Test Team Alpha', 'Main test team for development and testing', 'Test Ice Rink', 'team@testclub.com', '+34 123 456 789');

-- Create sample competitions for testing
INSERT INTO public.competitions (name, description, start_date, end_date, location, status, level, category, entry_fee, max_participants) VALUES
('Test Championship 2025', 'Annual test competition for development', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '32 days', 'Test Arena', 'upcoming', 'intermediate', 'junior', 25.00, 50),
('Spring Training Cup', 'Spring season competition', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '62 days', 'Regional Arena', 'upcoming', 'advanced', 'senior', 40.00, 30);

-- Create sample equipment for testing
INSERT INTO public.equipment (name, category, brand, model, condition, cost, purchase_date) VALUES
('Professional Skates Set A', 'skates', 'Riedell', 'Eclipse Aria', 'excellent', 450.00, CURRENT_DATE - INTERVAL '6 months'),
('Training Cones Set', 'training', 'SportCones', 'Pro Series', 'good', 85.00, CURRENT_DATE - INTERVAL '1 year');

-- Create sample financial transactions for testing
INSERT INTO public.financial_transactions (amount, transaction_type, description, transaction_date, payment_status, created_by) VALUES
(150.00, 'income', 'Monthly membership fee - Test Transaction', CURRENT_DATE, 'completed', auth.uid()),
(75.00, 'expense', 'Equipment maintenance - Test Transaction', CURRENT_DATE - INTERVAL '5 days', 'completed', auth.uid());