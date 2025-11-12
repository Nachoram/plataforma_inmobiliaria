-- =====================================================
-- FIX MISSING GUARANTOR_CHARACTERISTIC_ID VALUES
-- =====================================================
-- This migration fixes the issue where applications with guarantor_id
-- don't have corresponding guarantor_characteristic_id values.
-- This affects the completed_processes_characteristics view.

DO $$
BEGIN
  RAISE NOTICE 'Starting migration: Fix missing guarantor_characteristic_id values';
END $$;

-- =====================================================
-- 1. VERIFY COLUMN EXISTS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'guarantor_characteristic_id'
  ) THEN
    RAISE EXCEPTION '❌ Column guarantor_characteristic_id does not exist in applications table. Run migration 20251027150000_ensure_all_characteristic_ids.sql first.';
  ELSE
    RAISE NOTICE '✅ Column guarantor_characteristic_id exists in applications table';
  END IF;
END $$;

-- =====================================================
-- 2. GENERATE MISSING GUARANTOR_CHARACTERISTIC_ID VALUES
-- =====================================================

-- Update applications that have guarantor_id but missing guarantor_characteristic_id
UPDATE applications
SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE guarantor_characteristic_id IS NULL
  AND guarantor_id IS NOT NULL;

-- Log the number of records updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Updated % applications with missing guarantor_characteristic_id', updated_count;
END $$;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

DO $$
DECLARE
  total_with_guarantor INTEGER;
  missing_characteristic_id INTEGER;
  correct_format_count INTEGER;
BEGIN
  -- Count total applications with guarantor_id
  SELECT COUNT(*) INTO total_with_guarantor
  FROM applications
  WHERE guarantor_id IS NOT NULL;

  -- Count applications with guarantor_id but missing guarantor_characteristic_id
  SELECT COUNT(*) INTO missing_characteristic_id
  FROM applications
  WHERE guarantor_id IS NOT NULL
    AND guarantor_characteristic_id IS NULL;

  -- Count applications with correct GUAR_ format
  SELECT COUNT(*) INTO correct_format_count
  FROM applications
  WHERE guarantor_characteristic_id LIKE 'GUAR_%'
    AND guarantor_id IS NOT NULL;

  RAISE NOTICE '📊 Verification Results:';
  RAISE NOTICE '  Total applications with guarantor_id: %', total_with_guarantor;
  RAISE NOTICE '  Applications still missing guarantor_characteristic_id: %', missing_characteristic_id;
  RAISE NOTICE '  Applications with correct GUAR_ format: %', correct_format_count;

  IF missing_characteristic_id = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All applications with guarantor_id now have guarantor_characteristic_id!';
  ELSE
    RAISE EXCEPTION '❌ FAILURE: Still % applications missing guarantor_characteristic_id', missing_characteristic_id;
  END IF;

  IF correct_format_count = total_with_guarantor THEN
    RAISE NOTICE '✅ SUCCESS: All guarantor_characteristic_id values follow the correct GUAR_ format!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: % applications have incorrect format', (total_with_guarantor - correct_format_count);
  END IF;
END $$;

-- =====================================================
-- 4. UPDATE VIEW (if needed)
-- =====================================================

-- The completed_processes_characteristics view should now show the guarantor_characteristic_id values
-- Let's verify the view is working correctly

DO $$
DECLARE
  view_record_count INTEGER;
  view_with_guarantor_id INTEGER;
BEGIN
  -- Count total records in view
  SELECT COUNT(*) INTO view_record_count FROM completed_processes_characteristics;

  -- Count records in view that have guarantor_characteristic_id
  SELECT COUNT(*) INTO view_with_guarantor_id
  FROM completed_processes_characteristics
  WHERE guarantor_characteristic_id IS NOT NULL;

  RAISE NOTICE '📋 View verification:';
  RAISE NOTICE '  Total records in completed_processes_characteristics: %', view_record_count;
  RAISE NOTICE '  Records with guarantor_characteristic_id: %', view_with_guarantor_id;

  IF view_with_guarantor_id > 0 THEN
    RAISE NOTICE '✅ SUCCESS: completed_processes_characteristics view now shows guarantor_characteristic_id values!';
  ELSE
    RAISE NOTICE '⚠️  INFO: No records in view have guarantor_characteristic_id (this may be expected if no contracts have guarantors)';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Fixed missing guarantor_characteristic_id values in applications table';
  RAISE NOTICE 'The completed_processes_characteristics view should now display guarantor_characteristic_id correctly.';
END $$;













