-- Fix Profiles RLS Policy to allow viewing other users' public information
-- This migration addresses the 406 Not Acceptable error when trying to view profile information
-- of property owners or other users in the application

-- =====================================================
-- STEP 1: DROP EXISTING PROFILES POLICIES
-- =====================================================

-- Drop all existing policies before recreating them
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- =====================================================
-- STEP 2: CREATE UPDATED RLS POLICIES FOR PROFILES
-- =====================================================

-- Policy 1: SELECT - Authenticated users can view all profiles (for public information like names)
-- This allows users to see basic profile information of property owners and other users
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Policy 2: INSERT - Users can only create their own profile
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: UPDATE - Users can only update their own profile
CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: DELETE - Users can only delete their own profile (if needed)
CREATE POLICY "profiles_delete_policy"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- STEP 3: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure authenticated users have necessary permissions on profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;

-- =====================================================
-- STEP 4: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 'Allows authenticated users to view all profiles for public information (names, etc.)';
COMMENT ON POLICY "profiles_insert_policy" ON profiles IS 'Allows users to create their own profile';
COMMENT ON POLICY "profiles_update_policy" ON profiles IS 'Allows users to update their own profile';
COMMENT ON POLICY "profiles_delete_policy" ON profiles IS 'Allows users to delete their own profile';

-- =====================================================
-- STEP 5: LOG COMPLETION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Profiles RLS policies updated successfully';
  RAISE NOTICE 'Authenticated users can now view public profile information from other users';
  RAISE NOTICE 'This fixes the 406 Not Acceptable error when displaying property owner information';
END $$;
