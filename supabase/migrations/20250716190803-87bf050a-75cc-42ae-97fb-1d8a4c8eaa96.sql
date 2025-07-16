-- Manually confirm the test user account by setting email_confirmed_at
-- This allows immediate login for testing purposes
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'example@admin.com' 
AND email_confirmed_at IS NULL;