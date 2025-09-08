-- Fix for Properties RLS Policies and Status Enum Inconsistency
-- This migration addresses the 403 Forbidden and 406 Not Acceptable errors
-- by ensuring consistent RLS policies and status enum values

-- =====================================================
-- STEP 1: UPDATE PROPERTY STATUS ENUM
-- =====================================================

-- Drop the existing enum and recreate it with 'disponible' included
-- This ensures consistency between the enum values and the active_properties view
DO $$
BEGIN
  -- Check if 'disponible' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'property_status_enum'
    AND e.enumlabel = 'disponible'
  ) THEN
    -- Add 'disponible' to the enum
    ALTER TYPE property_status_enum ADD VALUE 'disponible';
  END IF;
END $$;

-- =====================================================
-- STEP 2: UPDATE DEFAULT STATUS
-- =====================================================

-- Change the default status from 'activa' to 'disponible' to match the active_properties view
ALTER TABLE properties ALTER COLUMN status SET DEFAULT 'disponible';

-- Update existing properties with 'activa' status to 'disponible'
UPDATE properties SET status = 'disponible' WHERE status = 'activa';

-- =====================================================
-- STEP 3: DROP EXISTING POLICIES
-- =====================================================

-- Drop all existing policies for properties table to recreate them cleanly
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

-- =====================================================
-- STEP 4: CREATE UPDATED RLS POLICIES
-- =====================================================

-- Policy 1: SELECT - Public can view active properties, authenticated users can view their own
-- This allows public access to properties with status 'disponible' and authenticated users to see all their properties
CREATE POLICY "properties_select_policy"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (
    -- Public can view properties with status 'disponible' (active properties)
    (status = 'disponible' AND auth.role() = 'anon') OR
    -- Authenticated users can view all their own properties regardless of status
    (auth.role() = 'authenticated' AND auth.uid() = owner_id) OR
    -- Authenticated users can also view active properties from others
    (auth.role() = 'authenticated' AND status = 'disponible')
  );

-- Policy 2: INSERT - Authenticated users can create properties where they are the owner
-- Uses auth.uid() to ensure the user can only create properties they own
CREATE POLICY "properties_insert_policy"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    auth.uid() IS NOT NULL
  );

-- Policy 3: UPDATE - Authenticated users can only update their own properties
-- Uses both USING (for existing rows) and WITH CHECK (for new values) clauses
CREATE POLICY "properties_update_policy"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: DELETE - Authenticated users can only delete their own properties
-- Uses auth.uid() to ensure ownership verification
CREATE POLICY "properties_delete_policy"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =====================================================
-- STEP 5: VERIFY PROFILES POLICIES
-- =====================================================

-- Ensure profiles policies are correct for the property creation flow
-- These policies should allow users to read and update their own profile

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate profiles policies
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 6: UPDATE ACTIVE PROPERTIES VIEW
-- =====================================================

-- Recreate the active_properties view to use the correct status
DROP VIEW IF EXISTS active_properties;
CREATE OR REPLACE VIEW active_properties AS
SELECT *
FROM properties
WHERE is_visible = true AND status = 'disponible'
ORDER BY is_featured DESC, created_at DESC;

-- =====================================================
-- STEP 7: ADD HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user can access a property (for debugging)
CREATE OR REPLACE FUNCTION can_user_access_property(user_id UUID, property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id
    AND (
      p.status = 'disponible' OR
      (user_id IS NOT NULL AND p.owner_id = user_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure authenticated users have necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on the view
GRANT SELECT ON active_properties TO authenticated, anon;

-- =====================================================
-- STEP 9: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "properties_select_policy" ON properties IS 'Allows public to view active properties and authenticated users to view their own properties';
COMMENT ON POLICY "properties_insert_policy" ON properties IS 'Allows authenticated users to create properties they own';
COMMENT ON POLICY "properties_update_policy" ON properties IS 'Allows authenticated users to update only their own properties';
COMMENT ON POLICY "properties_delete_policy" ON properties IS 'Allows authenticated users to delete only their own properties';

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 'Allows users to view their own profile';
COMMENT ON POLICY "profiles_insert_policy" ON profiles IS 'Allows users to create their own profile';
COMMENT ON POLICY "profiles_update_policy" ON profiles IS 'Allows users to update their own profile';

COMMENT ON FUNCTION can_user_access_property(UUID, UUID) IS 'Helper function to check if a user can access a specific property';

-- =====================================================
-- STEP 10: LOG COMPLETION
-- =====================================================

-- Log that the migration completed successfully
DO $$
BEGIN
  RAISE NOTICE 'Properties RLS policies migration completed successfully';
  RAISE NOTICE 'New enum values: activa, arrendada, vendida, pausada, disponible';
  RAISE NOTICE 'Default status changed to: disponible';
  RAISE NOTICE 'All RLS policies recreated with proper auth.uid() usage';
END $$;
