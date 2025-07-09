-- Create the user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'coach', 'athlete', 'delegate', 'leader', 'finance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recreate the handle_new_user function with the correct enum reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_value text;
BEGIN
  -- Get the role from metadata, default to 'athlete' if not provided  
  user_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'athlete');
  
  -- Ensure the role value is valid
  IF user_role_value NOT IN ('admin', 'coach', 'athlete', 'delegate', 'leader', 'finance') THEN
    user_role_value := 'athlete';
  END IF;

  -- Insert into profiles regardless of email confirmation status
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    user_role_value::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;