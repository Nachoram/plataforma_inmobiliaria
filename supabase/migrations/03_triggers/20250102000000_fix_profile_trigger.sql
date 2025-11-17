-- =====================================================
-- FIX: Profile Trigger Constraints
-- =====================================================
-- This migration fixes the 500 Internal Server Error during user registration
-- by making the profile creation trigger more resilient to missing user metadata

-- 1. Make problematic columns nullable initially (users will fill them later)
ALTER TABLE public.profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN paternal_last_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN rut DROP NOT NULL;

-- 2. Replace the trigger function with a minimal version
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Only insert first_name if available in metadata, otherwise NULL
    CASE
      WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL
      THEN NEW.raw_user_meta_data->>'first_name'
      ELSE NULL
    END,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_public_profile_for_new_user();

-- =====================================================
-- VERIFICATION QUERIES (Run these after applying the migration)
-- =====================================================

-- Check if trigger function exists and is correct:
-- SELECT * FROM pg_proc WHERE proname = 'create_public_profile_for_new_user';

-- Check if trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check table constraints:
-- SELECT column_name, is_nullable FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name IN ('first_name', 'paternal_last_name', 'rut');

