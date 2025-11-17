-- =====================================================
-- BULLETPROOF PROFILE TRIGGER - SOLUTION DEFINITIVE
-- =====================================================
-- This migration creates an ultra-safe trigger that cannot fail
-- by only inserting guaranteed fields (id, email) from Supabase Auth

-- 1. Create the bulletproof function that only uses guaranteed data
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger is connected and active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_public_profile_for_new_user();

-- 3. Make sure the profiles table allows NULL values for optional fields
-- (This ensures the trigger won't fail even if other constraints exist)
ALTER TABLE public.profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN paternal_last_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN maternal_last_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN rut DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN profession DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address_street DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address_number DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address_commune DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address_region DROP NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'create_public_profile_for_new_user';

-- Check if trigger exists:
-- SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check table constraints after migration:
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
