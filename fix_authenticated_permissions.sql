-- =====================================================
-- FIX AUTHENTICATED ROLE PERMISSIONS
-- =====================================================
-- This script resolves 406 Not Acceptable errors by granting necessary
-- permissions to the authenticated role while maintaining RLS security
-- Execute this in Supabase SQL Editor

-- =====================================================
-- STEP 1: GRANT SCHEMA USAGE
-- =====================================================

-- Grant USAGE on the public schema to authenticated role
-- This allows the role to operate within the schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- STEP 2: GRANT PERMISSIONS ON PROFILES TABLE
-- =====================================================

-- Grant all necessary permissions on profiles table to authenticated users
-- RLS policies will still restrict access to appropriate rows
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- =====================================================
-- STEP 3: GRANT PERMISSIONS ON PROPERTIES TABLE
-- =====================================================

-- Grant all necessary permissions on properties table to authenticated users
-- This prevents future 406 errors for property operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;

-- =====================================================
-- STEP 4: GRANT PERMISSIONS ON RELATED TABLES (PREVENTIVE)
-- =====================================================

-- Grant permissions on other tables that authenticated users might need
-- These are preventive grants to avoid similar 406 errors

-- Guarantors table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guarantors TO authenticated;

-- Applications table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

-- Offers table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;

-- Documents table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;

-- Property images table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;

-- User favorites table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO authenticated;

-- =====================================================
-- STEP 5: GRANT PERMISSIONS ON SEQUENCES
-- =====================================================

-- Grant usage on sequences for auto-incrementing IDs
-- This is needed for INSERT operations on tables with SERIAL columns
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- STEP 6: VERIFY PERMISSIONS
-- =====================================================

-- Query to verify that permissions were granted correctly
SELECT
    grantee,
    privilege_type,
    table_name
FROM information_schema.role_table_grants
WHERE grantee = 'authenticated'
    AND table_name IN ('profiles', 'properties', 'guarantors', 'applications', 'offers', 'documents', 'property_images', 'user_favorites')
ORDER BY table_name, privilege_type;

-- =====================================================
-- STEP 7: CHECK SCHEMA USAGE
-- =====================================================

-- Verify schema usage permissions
SELECT
    grantee,
    privilege_type,
    object_name,
    object_type
FROM information_schema.role_usage_grants
WHERE grantee = 'authenticated'
    AND object_type = 'SCHEMA'
    AND object_name = 'public';

-- =====================================================
-- STEP 8: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles table - authenticated users have full CRUD permissions, restricted by RLS policies';
COMMENT ON TABLE properties IS 'Properties table - authenticated users have full CRUD permissions, restricted by RLS policies';

-- =====================================================
-- STEP 9: LOG COMPLETION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Authenticated Role Permissions Fix Completed Successfully!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'GRANTED PERMISSIONS:';
  RAISE NOTICE '  - USAGE on SCHEMA public';
  RAISE NOTICE '  - SELECT, INSERT, UPDATE, DELETE on profiles';
  RAISE NOTICE '  - SELECT, INSERT, UPDATE, DELETE on properties';
  RAISE NOTICE '  - SELECT, INSERT, UPDATE, DELETE on related tables';
  RAISE NOTICE '  - USAGE on ALL SEQUENCES';
  RAISE NOTICE '';
  RAISE NOTICE 'SECURITY NOTE:';
  RAISE NOTICE '  RLS policies still restrict row-level access';
  RAISE NOTICE '  These grants provide table-level permissions only';
  RAISE NOTICE '';
  RAISE NOTICE 'The 406 Not Acceptable errors should now be resolved.';
  RAISE NOTICE 'Test by updating your profile or creating/editing properties.';
END $$;

