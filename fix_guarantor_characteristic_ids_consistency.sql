-- =====================================================
-- FIX GUARANTOR_CHARACTERISTIC_ID CONSISTENCY
-- =====================================================
-- This script fixes the inconsistency where applications.guarantor_characteristic_id
-- doesn't match guarantors.guarantor_characteristic_id for the same guarantor.
--
-- The issue: applications.guarantor_characteristic_id was being generated with
-- application-based data instead of using the guarantor's actual characteristic_id.

DO $$
BEGIN
  RAISE NOTICE 'Starting fix for guarantor_characteristic_id consistency';
END $$;

-- =====================================================
-- 1. BACKUP CURRENT DATA
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating backup of current guarantor_characteristic_id values...';
END $$;

-- Create a temporary table to store current values
CREATE TEMP TABLE temp_guarantor_ids_backup AS
SELECT
  a.id as application_id,
  a.guarantor_id,
  a.guarantor_characteristic_id as current_app_guarantor_char_id,
  g.guarantor_characteristic_id as correct_guarantor_char_id,
  g.first_name as guarantor_first_name,
  g.paternal_last_name as guarantor_last_name
FROM applications a
LEFT JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.guarantor_id IS NOT NULL;

DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM temp_guarantor_ids_backup;
  RAISE NOTICE 'Backed up % records with guarantor relationships', backup_count;
END $$;

-- =====================================================
-- 2. IDENTIFY INCONSISTENCIES
-- =====================================================

DO $$
DECLARE
  total_with_guarantor INTEGER;
  inconsistent_count INTEGER;
BEGIN
  -- Count total applications with guarantors
  SELECT COUNT(*) INTO total_with_guarantor
  FROM temp_guarantor_ids_backup;

  -- Count inconsistent records
  SELECT COUNT(*) INTO inconsistent_count
  FROM temp_guarantor_ids_backup
  WHERE current_app_guarantor_char_id != correct_guarantor_char_id;

  RAISE NOTICE 'Found % applications with guarantors', total_with_guarantor;
  RAISE NOTICE 'Found % inconsistent guarantor_characteristic_id values', inconsistent_count;

  IF inconsistent_count > 0 THEN
    RAISE NOTICE 'Listing first 10 inconsistent records:';
    -- Show sample of inconsistent data
    FOR i IN 1..LEAST(10, inconsistent_count) LOOP
      DECLARE
        rec RECORD;
      BEGIN
        SELECT * INTO rec
        FROM temp_guarantor_ids_backup
        WHERE current_app_guarantor_char_id != correct_guarantor_char_id
        LIMIT 1 OFFSET (i-1);

        IF FOUND THEN
          RAISE NOTICE '  App ID: %', rec.application_id;
          RAISE NOTICE '  Guarantor: % %', rec.guarantor_first_name, rec.guarantor_last_name;
          RAISE NOTICE '  Current (wrong): %', rec.current_app_guarantor_char_id;
          RAISE NOTICE '  Correct: %', rec.correct_guarantor_char_id;
          RAISE NOTICE '';
        END IF;
      END;
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 3. FIX THE INCONSISTENCIES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing inconsistent guarantor_characteristic_id values...';
END $$;

-- Update applications to use the correct guarantor_characteristic_id from guarantors table
UPDATE applications
SET guarantor_characteristic_id = g.guarantor_characteristic_id
FROM guarantors g
WHERE applications.guarantor_id = g.id
  AND applications.guarantor_id IS NOT NULL
  AND (applications.guarantor_characteristic_id IS NULL
       OR applications.guarantor_characteristic_id != g.guarantor_characteristic_id);

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % applications with correct guarantor_characteristic_id values', updated_count;
END $$;

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

DO $$
DECLARE
  total_with_guarantor INTEGER;
  now_consistent INTEGER;
  still_inconsistent INTEGER;
BEGIN
  -- Count total applications with guarantors
  SELECT COUNT(*) INTO total_with_guarantor
  FROM applications
  WHERE guarantor_id IS NOT NULL;

  -- Count now consistent records
  SELECT COUNT(*) INTO now_consistent
  FROM applications a
  JOIN guarantors g ON a.guarantor_id = g.id
  WHERE a.guarantor_characteristic_id = g.guarantor_characteristic_id;

  -- Count still inconsistent records
  SELECT COUNT(*) INTO still_inconsistent
  FROM applications a
  JOIN guarantors g ON a.guarantor_id = g.id
  WHERE a.guarantor_characteristic_id != g.guarantor_characteristic_id;

  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '  Total applications with guarantors: %', total_with_guarantor;
  RAISE NOTICE '  Now consistent: %', now_consistent;
  RAISE NOTICE '  Still inconsistent: %', still_inconsistent;

  IF still_inconsistent = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All guarantor_characteristic_id values are now consistent!';
  ELSE
    RAISE NOTICE '❌ FAILURE: Still % applications with inconsistent guarantor_characteristic_id', still_inconsistent;
  END IF;
END $$;

-- =====================================================
-- 5. CHECK VIEW CONSISTENCY
-- =====================================================

DO $$
DECLARE
  view_total INTEGER;
  view_with_guarantor INTEGER;
  view_consistent INTEGER;
BEGIN
  -- Count total records in view
  SELECT COUNT(*) INTO view_total FROM completed_processes_characteristics;

  -- Count records in view with guarantor_characteristic_id
  SELECT COUNT(*) INTO view_with_guarantor
  FROM completed_processes_characteristics
  WHERE guarantor_characteristic_id IS NOT NULL;

  -- Count records where view guarantor_characteristic_id matches guarantor's
  SELECT COUNT(*) INTO view_consistent
  FROM completed_processes_characteristics cpc
  JOIN guarantors g ON cpc.guarantor_id = g.id
  WHERE cpc.guarantor_characteristic_id = g.guarantor_characteristic_id;

  RAISE NOTICE 'VIEW CONSISTENCY CHECK:';
  RAISE NOTICE '  Total records in completed_processes_characteristics: %', view_total;
  RAISE NOTICE '  Records with guarantor_characteristic_id: %', view_with_guarantor;
  RAISE NOTICE '  Records with consistent guarantor_characteristic_id: %', view_consistent;

  IF view_with_guarantor = view_consistent THEN
    RAISE NOTICE '✅ SUCCESS: completed_processes_characteristics view now shows consistent guarantor_characteristic_id values!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: View still has % inconsistent records', (view_with_guarantor - view_consistent);
  END IF;
END $$;

-- =====================================================
-- CLEANUP
-- =====================================================

DROP TABLE IF EXISTS temp_guarantor_ids_backup;

DO $$
BEGIN
  RAISE NOTICE 'Fix completed! guarantor_characteristic_id values are now consistent between applications and guarantors tables.';
  RAISE NOTICE 'The completed_processes_characteristics view should now display correct guarantor_characteristic_id values.';
END $$;











