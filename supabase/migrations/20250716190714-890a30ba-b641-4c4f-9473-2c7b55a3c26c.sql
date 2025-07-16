-- Manually confirm the test user account to bypass email confirmation
-- This allows immediate login for testing purposes
UPDATE auth.users 
SET email_confirmed_at = now(),
    confirmed_at = now()
WHERE email = 'example@admin.com';