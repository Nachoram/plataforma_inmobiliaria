-- =====================================================
-- FIX RLS POLICIES FOR PROFILES AND PROPERTIES TABLES
-- =====================================================
-- This script addresses 403 Forbidden errors by ensuring proper RLS policies
-- Execute this in Supabase SQL Editor

-- =====================================================
-- STEP 1: ENSURE RLS IS ENABLED
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Drop existing properties policies
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON properties;

-- =====================================================
-- STEP 3: CREATE PROFILES POLICIES
-- =====================================================

-- Policy for SELECT: Users can only view their own profile
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for INSERT: Users can only insert their own profile
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 4: CREATE PROPERTIES POLICIES
-- =====================================================

-- Policy for SELECT: Public can view active properties, authenticated users can view their own
CREATE POLICY "properties_public_select_policy"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (status = 'disponible');

-- Policy for SELECT: Authenticated users can also view their own properties (any status)
CREATE POLICY "properties_own_select_policy"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy for INSERT: Authenticated users can create properties they own
CREATE POLICY "properties_insert_policy"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy for UPDATE: Authenticated users can only update their own properties
CREATE POLICY "properties_update_policy"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy for DELETE: Authenticated users can only delete their own properties
CREATE POLICY "properties_delete_policy"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =====================================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;

-- Grant public read access to properties (for marketplace)
GRANT SELECT ON properties TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- =====================================================
-- STEP 6: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 'Allows authenticated users to view only their own profile';
COMMENT ON POLICY "profiles_insert_policy" ON profiles IS 'Allows authenticated users to create only their own profile';
COMMENT ON POLICY "profiles_update_policy" ON profiles IS 'Allows authenticated users to update only their own profile';

COMMENT ON POLICY "properties_public_select_policy" ON properties IS 'Allows anyone to view properties with status disponible (marketplace)';
COMMENT ON POLICY "properties_own_select_policy" ON properties IS 'Allows authenticated users to view their own properties regardless of status';
COMMENT ON POLICY "properties_insert_policy" ON properties IS 'Allows authenticated users to create properties they own';
COMMENT ON POLICY "properties_update_policy" ON properties IS 'Allows authenticated users to update only their own properties';
COMMENT ON POLICY "properties_delete_policy" ON properties IS 'Allows authenticated users to delete only their own properties';

-- =====================================================
-- STEP 7: VERIFICATION QUERIES
-- =====================================================

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties')
ORDER BY tablename;

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 8: LOG COMPLETION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS Policies Fix Completed Successfully!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'PROFILES POLICIES:';
  RAISE NOTICE '  - SELECT: auth.uid() = id';
  RAISE NOTICE '  - INSERT: auth.uid() = id';
  RAISE NOTICE '  - UPDATE: auth.uid() = id';
  RAISE NOTICE '';
  RAISE NOTICE 'PROPERTIES POLICIES:';
  RAISE NOTICE '  - SELECT (public): status = disponible';
  RAISE NOTICE '  - SELECT (own): auth.uid() = owner_id';
  RAISE NOTICE '  - INSERT: auth.uid() = owner_id';
  RAISE NOTICE '  - UPDATE: auth.uid() = owner_id';
  RAISE NOTICE '  - DELETE: auth.uid() = owner_id';
  RAISE NOTICE '';
  RAISE NOTICE 'The 403 Forbidden errors should now be resolved.';
  RAISE NOTICE 'Test by logging in and trying to load your profile and properties.';
END $$;

