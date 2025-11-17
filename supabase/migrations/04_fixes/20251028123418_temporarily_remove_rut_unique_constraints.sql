/*
  Temporarily Remove RUT UNIQUE Constraints for Development and Testing

  This migration temporarily removes all UNIQUE constraints on RUT fields across the database
  to facilitate development and testing with duplicate data.

  Constraints to Remove:
  1. profiles.rut - UNIQUE constraint
  2. guarantors.rut - UNIQUE constraint
  3. applicants.rut - UNIQUE constraint (if exists)
  4. property_owners.rut - UNIQUE constraint (if exists)
  5. rental_owner_characteristics.rut - UNIQUE index

  IMPORTANT: These constraints MUST be restored before production deployment.
  TODO: Restore all RUT UNIQUE constraints before going to production.
*/

-- =====================================================
-- STEP 1: REMOVE UNIQUE CONSTRAINT FROM PROFILES TABLE
-- =====================================================

-- Check if the constraint exists and drop it
DO $$
BEGIN
  -- Try to drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%rut%'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rut_key;
    RAISE NOTICE '✅ Dropped UNIQUE constraint from profiles.rut';
  ELSE
    RAISE NOTICE '⚠️  No UNIQUE constraint found on profiles.rut';
  END IF;
END $$;

-- =====================================================
-- STEP 2: REMOVE UNIQUE CONSTRAINT FROM GUARANTORS TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'guarantors'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%rut%'
  ) THEN
    ALTER TABLE guarantors DROP CONSTRAINT IF EXISTS guarantors_rut_key;
    RAISE NOTICE '✅ Dropped UNIQUE constraint from guarantors.rut';
  ELSE
    RAISE NOTICE '⚠️  No UNIQUE constraint found on guarantors.rut';
  END IF;
END $$;

-- =====================================================
-- STEP 3: REMOVE UNIQUE CONSTRAINT FROM APPLICANTS TABLE (IF EXISTS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'applicants'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%rut%'
  ) THEN
    ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_rut_key;
    RAISE NOTICE '✅ Dropped UNIQUE constraint from applicants.rut';
  ELSE
    RAISE NOTICE '⚠️  No UNIQUE constraint found on applicants.rut';
  END IF;
END $$;

-- =====================================================
-- STEP 4: REMOVE UNIQUE CONSTRAINT FROM PROPERTY_OWNERS TABLE (IF EXISTS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'property_owners'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%rut%'
  ) THEN
    ALTER TABLE property_owners DROP CONSTRAINT IF EXISTS property_owners_rut_key;
    RAISE NOTICE '✅ Dropped UNIQUE constraint from property_owners.rut';
  ELSE
    RAISE NOTICE '⚠️  No UNIQUE constraint found on property_owners.rut';
  END IF;
END $$;

-- =====================================================
-- STEP 5: REMOVE UNIQUE INDEX FROM RENTAL_OWNER_CHARACTERISTICS TABLE
-- =====================================================

-- Drop the unique index on rental_owner_characteristics.rut
DROP INDEX IF EXISTS idx_rental_owner_characteristics_rut;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped UNIQUE index idx_rental_owner_characteristics_rut';
END $$;

-- =====================================================
-- STEP 6: LOG COMPLETION AND REMINDERS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 RUT UNIQUE constraints temporarily removed for development/testing';
  RAISE NOTICE '⚠️  REMEMBER: Restore all RUT UNIQUE constraints before production deployment!';
  RAISE NOTICE '📝 TODO: Add back UNIQUE constraints on profiles.rut, guarantors.rut, applicants.rut, property_owners.rut, and rental_owner_characteristics.rut';
END $$;
