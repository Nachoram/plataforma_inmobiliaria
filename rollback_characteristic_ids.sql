-- =====================================================
-- ROLLBACK CHARACTERISTIC IDS CHANGES
-- In case the format fix needs to be reverted
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting rollback of characteristic IDs changes...';
END $$;

-- =====================================================
-- ROLLBACK STEP 1: RESTORE FROM BACKUP (if backup was created)
-- =====================================================

-- Uncomment these lines if backup tables were created in safe_fix_characteristic_ids.sql

-- Restore applications
-- UPDATE applications
-- SET application_characteristic_id = backup.application_characteristic_id,
--     guarantor_characteristic_id = backup.guarantor_characteristic_id
-- FROM backup_applications_characteristic_ids backup
-- WHERE applications.id = backup.id;

-- Restore properties
-- UPDATE properties
-- SET property_characteristic_id = backup.property_characteristic_id
-- FROM backup_properties_characteristic_ids backup
-- WHERE properties.id = backup.id;

-- Restore rental owners
-- UPDATE rental_owners
-- SET rental_owner_characteristic_id = backup.rental_owner_characteristic_id
-- FROM backup_rental_owners_characteristic_ids backup
-- WHERE rental_owners.id = backup.id;

-- Restore contract conditions
-- UPDATE rental_contract_conditions
-- SET contract_conditions_characteristic_id = backup.contract_conditions_characteristic_id
-- FROM backup_contract_conditions_characteristic_ids backup
-- WHERE rental_contract_conditions.id = backup.id;

-- =====================================================
-- ROLLBACK STEP 2: ALTERNATIVE - RESET TO UUID FORMAT
-- =====================================================

-- If no backup was made, reset to gen_random_uuid() format
-- (This will break webhook compatibility but restore basic functionality)

DO $$
DECLARE
    column_record RECORD;
BEGIN
    RAISE NOTICE 'Resetting characteristic IDs to UUID format...';

    -- Reset applications
    UPDATE applications
    SET application_characteristic_id = gen_random_uuid()::text
    WHERE application_characteristic_id IS NOT NULL;

    UPDATE applications
    SET guarantor_characteristic_id = gen_random_uuid()::text
    WHERE guarantor_characteristic_id IS NOT NULL;

    -- Reset properties
    UPDATE properties
    SET property_characteristic_id = gen_random_uuid()::text
    WHERE property_characteristic_id IS NOT NULL;

    -- Reset rental owners
    UPDATE rental_owners
    SET rental_owner_characteristic_id = gen_random_uuid()::text
    WHERE rental_owner_characteristic_id IS NOT NULL;

    -- Reset contract conditions
    UPDATE rental_contract_conditions
    SET contract_conditions_characteristic_id = gen_random_uuid()::text
    WHERE contract_conditions_characteristic_id IS NOT NULL;

    RAISE NOTICE 'All characteristic IDs reset to UUID format';
END $$;

-- =====================================================
-- ROLLBACK STEP 3: CLEANUP BACKUP TABLES
-- =====================================================

-- Uncomment to drop backup tables
-- DROP TABLE IF EXISTS backup_applications_characteristic_ids;
-- DROP TABLE IF EXISTS backup_properties_characteristic_ids;
-- DROP TABLE IF EXISTS backup_rental_owners_characteristic_ids;
-- DROP TABLE IF EXISTS backup_contract_conditions_characteristic_ids;

DO $$
BEGIN
  RAISE NOTICE 'Rollback completed. Characteristic IDs reset to basic UUID format.';
  RAISE NOTICE '⚠️  WARNING: Webhook compatibility may be affected. Re-run the fix script if needed.';
END $$;






