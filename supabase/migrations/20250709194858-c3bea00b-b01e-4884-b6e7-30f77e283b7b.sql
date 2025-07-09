-- Drop the trigger and function with CASCADE, then recreate them
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value text;
BEGIN
  -- Get the role from metadata, default to 'athlete' if not provided  
  user_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'athlete');
  
  -- Ensure the role value is valid
  IF user_role_value NOT IN ('admin', 'coach', 'athlete', 'delegate', 'leader', 'finance') THEN
    user_role_value := 'athlete';
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    user_role_value::user_role
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error for debugging
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Still return NEW to allow the auth user creation to succeed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();