-- =====================================================
-- VERIFY RLS POLICIES AND PERMISSIONS
-- =====================================================
-- This script checks if all RLS policies and permissions are correctly applied

-- =====================================================
-- STEP 1: CHECK RLS STATUS
-- =====================================================

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'properties', 'applications', 'offers', 'documents', 'property_images', 'user_favorites', 'guarantors')
ORDER BY tablename;

-- =====================================================
-- STEP 2: CHECK EXISTING POLICIES
-- =====================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'properties')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 3: CHECK PERMISSIONS
-- =====================================================

SELECT
    grantee,
    privilege_type,
    table_name,
    table_schema
FROM information_schema.role_table_grants
WHERE grantee = 'authenticated'
    AND table_name IN ('profiles', 'properties', 'applications', 'offers', 'documents', 'property_images', 'user_favorites', 'guarantors')
ORDER BY table_name, privilege_type;

-- =====================================================
-- STEP 4: CHECK SCHEMA USAGE
-- =====================================================

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
-- STEP 5: CHECK SEQUENCE PERMISSIONS
-- =====================================================

SELECT
    grantee,
    privilege_type,
    object_name,
    object_type
FROM information_schema.role_usage_grants
WHERE grantee = 'authenticated'
    AND object_type = 'SEQUENCE'
ORDER BY object_name;

-- =====================================================
-- STEP 6: TEST POLICIES WITH SAMPLE QUERIES
-- =====================================================

-- Test 1: Check if authenticated role can SELECT from profiles
-- (This should work if policies are correct)
SELECT
    'Test 1 - Can authenticated role SELECT from profiles?' as test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.role_table_grants
            WHERE grantee = 'authenticated'
                AND table_name = 'profiles'
                AND privilege_type = 'SELECT'
        ) THEN 'PASS - SELECT permission granted'
        ELSE 'FAIL - SELECT permission missing'
    END as result;

-- Test 2: Check if authenticated role can UPDATE profiles
SELECT
    'Test 2 - Can authenticated role UPDATE profiles?' as test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.role_table_grants
            WHERE grantee = 'authenticated'
                AND table_name = 'profiles'
                AND privilege_type = 'UPDATE'
        ) THEN 'PASS - UPDATE permission granted'
        ELSE 'FAIL - UPDATE permission missing'
    END as result;

-- Test 3: Check if RLS is enabled on profiles
SELECT
    'Test 3 - Is RLS enabled on profiles?' as test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_tables
            WHERE schemaname = 'public'
                AND tablename = 'profiles'
                AND rowsecurity = true
        ) THEN 'PASS - RLS enabled'
        ELSE 'FAIL - RLS disabled'
    END as result;

-- Test 4: Check if RLS is enabled on properties
SELECT
    'Test 4 - Is RLS enabled on properties?' as test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_tables
            WHERE schemaname = 'public'
                AND tablename = 'properties'
                AND rowsecurity = true
        ) THEN 'PASS - RLS enabled'
        ELSE 'FAIL - RLS disabled'
    END as result;

-- Test 5: Check if profiles policies exist
SELECT
    'Test 5 - Do profiles policies exist?' as test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
                AND tablename = 'profiles'
                AND policyname LIKE '%profiles%'
        ) THEN 'PASS - Profiles policies exist'
        ELSE 'FAIL - Profiles policies missing'
    END as result;

-- Test 6: Check if properties policies exist
SELECT
    'Test 6 - Do properties policies exist?' as test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
                AND tablename = 'properties'
                AND policyname LIKE '%properties%'
        ) THEN 'PASS - Properties policies exist'
        ELSE 'FAIL - Properties policies missing'
    END as result;

-- =====================================================
-- STEP 7: SUMMARY REPORT
-- =====================================================

DO $$
DECLARE
    rls_profiles BOOLEAN;
    rls_properties BOOLEAN;
    perm_select BOOLEAN;
    perm_update BOOLEAN;
    policies_count INTEGER;
BEGIN
    -- Check RLS status
    SELECT rowsecurity INTO rls_profiles
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'profiles';

    SELECT rowsecurity INTO rls_properties
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'properties';

    -- Check permissions
    SELECT EXISTS(
        SELECT 1 FROM information_schema.role_table_grants
        WHERE grantee = 'authenticated' AND table_name = 'profiles' AND privilege_type = 'SELECT'
    ) INTO perm_select;

    SELECT EXISTS(
        SELECT 1 FROM information_schema.role_table_grants
        WHERE grantee = 'authenticated' AND table_name = 'profiles' AND privilege_type = 'UPDATE'
    ) INTO perm_update;

    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename IN ('profiles', 'properties');

    -- Generate report
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'RLS AND PERMISSIONS VERIFICATION REPORT';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'RLS Status:';
    RAISE NOTICE '  - Profiles RLS: %', CASE WHEN rls_profiles THEN 'ENABLED' ELSE 'DISABLED' END;
    RAISE NOTICE '  - Properties RLS: %', CASE WHEN rls_properties THEN 'ENABLED' ELSE 'DISABLED' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions:';
    RAISE NOTICE '  - SELECT on profiles: %', CASE WHEN perm_select THEN 'GRANTED' ELSE 'MISSING' END;
    RAISE NOTICE '  - UPDATE on profiles: %', CASE WHEN perm_update THEN 'GRANTED' ELSE 'MISSING' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Policies: % policies found', policies_count;
    RAISE NOTICE '';

    IF rls_profiles AND rls_properties AND perm_select AND perm_update AND policies_count >= 4 THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED - System should work correctly';
        RAISE NOTICE 'If you still get 406 errors, the issue might be in your application code';
    ELSE
        RAISE NOTICE '❌ SOME CHECKS FAILED - Need to fix issues above';
        RAISE NOTICE 'Run the fix scripts again or check your application code';
    END IF;

    RAISE NOTICE '=====================================';
END $$;

