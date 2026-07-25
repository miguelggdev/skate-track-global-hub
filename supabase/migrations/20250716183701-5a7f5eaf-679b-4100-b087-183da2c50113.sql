-- Create test users with proper profile data and role assignments
-- This will help with testing different user roles and permissions

-- Insert test profiles for each role
INSERT INTO public.profiles (id, email, first_name, last_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@testclub.com', 'Admin', 'User', 'admin'),
('22222222-2222-2222-2222-222222222222', 'coach@testclub.com', 'Coach', 'Martinez', 'coach'),
('33333333-3333-3333-3333-333333333333', 'athlete@testclub.com', 'Maria', 'Rodriguez', 'athlete'),
('44444444-4444-4444-4444-444444444444', 'delegate@testclub.com', 'Carlos', 'Sanchez', 'delegate'),
('55555555-5555-5555-5555-555555555555', 'finance@testclub.com', 'Ana', 'Lopez', 'finance'),
('66666666-6666-6666-6666-666666666666', 'leader@testclub.com', 'Luis', 'Garcia', 'leader')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- Create athlete record for the athlete user
INSERT INTO public.athletes (id, user_id, first_name, last_name, email, athlete_number, level, category, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Maria', 'Rodriguez', 'athlete@testclub.com', 'ATH001', 'intermediate', 'junior', 'active')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  athlete_number = EXCLUDED.athlete_number,
  level = EXCLUDED.level,
  category = EXCLUDED.category,
  status = EXCLUDED.status;

-- Create coach record for the coach user
INSERT INTO public.coaches (id, user_id, specialization, certification_level, years_experience, hourly_rate) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Figure Skating', 'Level 4', 8, 45.00)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  specialization = EXCLUDED.specialization,
  certification_level = EXCLUDED.certification_level,
  years_experience = EXCLUDED.years_experience,
  hourly_rate = EXCLUDED.hourly_rate;

-- Create a team for testing team-related features
INSERT INTO public.teams (id, name, description, location, contact_email, contact_phone) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'Test Team', 'Test team for development purposes', 'Test Location', 'team@testclub.com', '+34 123 456 789')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone;

-- Create sample training session for testing
INSERT INTO public.training_sessions (id, name, description, date, start_time, end_time, training_type, coach_id, location, max_participants) VALUES
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Morning Training', 'Regular morning training session', CURRENT_DATE + INTERVAL '1 day', '09:00', '11:00', 'technique', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ice Rink A', 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  date = EXCLUDED.date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  training_type = EXCLUDED.training_type,
  coach_id = EXCLUDED.coach_id,
  location = EXCLUDED.location,
  max_participants = EXCLUDED.max_participants;

-- Create sample competition for testing
INSERT INTO public.competitions (id, name, description, start_date, end_date, location, status, level, category, entry_fee, max_participants, organizer_id) VALUES
('pppppppp-pppp-pppp-pppp-pppppppppppp', 'Test Championship', 'Test competition for development', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '32 days', 'Test Arena', 'upcoming', 'intermediate', 'junior', 25.00, 50, '44444444-4444-4444-4444-444444444444')
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
  max_participants = EXCLUDED.max_participants,
  organizer_id = EXCLUDED.organizer_id;

-- Ensure admin has comprehensive privileges by updating your current user to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = (
  SELECT email 
  FROM auth.users 
  WHERE id = auth.uid()
);

-- Grant admin role full access to storage buckets
INSERT INTO storage.objects (bucket_id, name, owner) VALUES 
('profiles', 'admin-test-folder/.keep', '11111111-1111-1111-1111-111111111111'),
('club-logos', 'admin-test-folder/.keep', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;