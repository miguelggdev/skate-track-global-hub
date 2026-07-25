-- Update current user to admin role and create test data with correct enum values
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

-- Create sample financial transactions for testing (using correct enum values)
INSERT INTO public.financial_transactions (amount, transaction_type, description, transaction_date, payment_status, created_by) VALUES
(150.00, 'registration_fee', 'Competition registration fee - Test Transaction', CURRENT_DATE, 'paid', auth.uid()),
(75.00, 'equipment', 'Equipment maintenance - Test Transaction', CURRENT_DATE - INTERVAL '5 days', 'paid', auth.uid()),
(200.00, 'coaching', 'Monthly coaching fees - Test Transaction', CURRENT_DATE - INTERVAL '10 days', 'pending', auth.uid());

-- Create a sample athlete record
INSERT INTO public.athletes (first_name, last_name, email, athlete_number, level, category, status, medical_notes, achievements) VALUES
('Sofia', 'Test Athlete', 'sofia.test@testclub.com', 'ATH001', 'intermediate', 'junior', 'active', 'No known allergies', 'Regional bronze medal 2024');

-- Create a sample coach record  
INSERT INTO public.coaches (specialization, certification_level, years_experience, hourly_rate) VALUES
('Figure Skating', 'Level 4 Certified', 8, 45.00);