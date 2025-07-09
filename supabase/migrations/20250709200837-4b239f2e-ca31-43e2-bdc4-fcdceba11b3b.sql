-- Update auth settings to disable email confirmation for testing
-- Note: In production, you should keep email confirmation enabled
UPDATE auth.config 
SET value = 'false' 
WHERE parameter = 'enable_signup';

-- Check current auth configuration
SELECT parameter, value FROM auth.config WHERE parameter IN ('enable_signup', 'enable_email_confirmations', 'site_url');