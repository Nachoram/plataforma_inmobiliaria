-- Fix for user profile creation function - Minimalist and robust approach
-- This resolves the 500 Internal Server Error during signup by only inserting essential data

-- Make optional columns nullable to allow users to complete their profiles later
ALTER TABLE public.profiles ALTER COLUMN paternal_last_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN maternal_last_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN rut DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN profession DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN marital_status SET DEFAULT 'soltero';
ALTER TABLE public.profiles ALTER COLUMN address_street DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address_number DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address_commune DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address_region DROP NOT NULL;

-- Set default values for columns that should have defaults
ALTER TABLE public.profiles ALTER COLUMN paternal_last_name SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN maternal_last_name SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN rut SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN profession SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN address_street SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN address_number SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN address_commune SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN address_region SET DEFAULT '';

-- Replace the function with a minimalist version that only inserts essential data
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to get the full name from metadata; if not available, use a default
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_public_profile_for_new_user();
