-- =====================================================
-- SAFE CHARACTERISTIC IDS FORMAT FIX
-- Step-by-step approach to avoid errors
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting SAFE characteristic IDs format fix...';
END $$;

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA (Optional but recommended)
-- =====================================================

-- Create backup tables (uncomment if needed)
-- CREATE TABLE backup_applications_characteristic_ids AS
-- SELECT id, application_characteristic_id, guarantor_characteristic_id FROM applications;
-- CREATE TABLE backup_properties_characteristic_ids AS
-- SELECT id, property_characteristic_id FROM properties;
-- CREATE TABLE backup_rental_owners_characteristic_ids AS
-- SELECT id, rental_owner_characteristic_id FROM rental_owners;
-- CREATE TABLE backup_contract_conditions_characteristic_ids AS
-- SELECT id, contract_conditions_characteristic_id FROM rental_contract_conditions;

-- =====================================================
-- STEP 2: CHANGE COLUMN TYPES SAFELY
-- =====================================================

DO $$
DECLARE
    column_record RECORD;
BEGIN
    RAISE NOTICE 'Checking and converting column types...';

    -- Check and convert each column type
    FOR column_record IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE (table_name = 'applications' AND column_name IN ('application_characteristic_id', 'guarantor_characteristic_id'))
           OR (table_name = 'properties' AND column_name = 'property_characteristic_id')
           OR (table_name = 'rental_owners' AND column_name = 'rental_owner_characteristic_id')
           OR (table_name = 'rental_contract_conditions' AND column_name = 'contract_conditions_characteristic_id')
    LOOP
        -- Check if column is UUID type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = column_record.table_name
            AND column_name = column_record.column_name
            AND data_type = 'uuid'
        ) THEN
            -- Convert to TEXT
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TEXT', column_record.table_name, column_record.column_name);
            RAISE NOTICE 'Converted %.% from UUID to TEXT', column_record.table_name, column_record.column_name;
        ELSE
            RAISE NOTICE 'Column %.% is already TEXT type', column_record.table_name, column_record.column_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: FIX FORMAT USING SAFE STRING OPERATIONS
-- =====================================================

DO $$
DECLARE
    app_record RECORD;
    prop_record RECORD;
    owner_record RECORD;
    contract_record RECORD;
BEGIN
    RAISE NOTICE 'Fixing characteristic ID formats...';

    -- Fix applications
    FOR app_record IN
        SELECT id, created_at, application_characteristic_id
        FROM applications
        WHERE application_characteristic_id IS NOT NULL
        AND (application_characteristic_id NOT LIKE 'APP_%' OR length(application_characteristic_id) < 10)
    LOOP
        UPDATE applications
        SET application_characteristic_id = 'APP_' || LPAD(EXTRACT(EPOCH FROM app_record.created_at)::text, 10, '0') || '_' || SUBSTRING(app_record.id::text, 1, 8)
        WHERE id = app_record.id;
    END LOOP;
    RAISE NOTICE 'Fixed application_characteristic_id formats';

    -- Fix properties
    FOR prop_record IN
        SELECT id, created_at, property_characteristic_id
        FROM properties
        WHERE property_characteristic_id IS NOT NULL
        AND (property_characteristic_id NOT LIKE 'PROP_%' OR length(property_characteristic_id) < 10)
    LOOP
        UPDATE properties
        SET property_characteristic_id = 'PROP_' || LPAD(EXTRACT(EPOCH FROM prop_record.created_at)::text, 10, '0') || '_' || SUBSTRING(prop_record.id::text, 1, 8)
        WHERE id = prop_record.id;
    END LOOP;
    RAISE NOTICE 'Fixed property_characteristic_id formats';

    -- Fix rental owners
    FOR owner_record IN
        SELECT id, created_at, rental_owner_characteristic_id
        FROM rental_owners
        WHERE rental_owner_characteristic_id IS NOT NULL
        AND (rental_owner_characteristic_id NOT LIKE 'RENTAL_OWNER_%' OR length(rental_owner_characteristic_id) < 15)
    LOOP
        UPDATE rental_owners
        SET rental_owner_characteristic_id = 'RENTAL_OWNER_' || LPAD(EXTRACT(EPOCH FROM owner_record.created_at)::text, 10, '0') || '_' || SUBSTRING(owner_record.id::text, 1, 8)
        WHERE id = owner_record.id;
    END LOOP;
    RAISE NOTICE 'Fixed rental_owner_characteristic_id formats';

    -- Fix guarantors
    UPDATE applications
    SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE guarantor_characteristic_id IS NOT NULL
      AND guarantor_id IS NOT NULL
      AND (guarantor_characteristic_id NOT LIKE 'GUAR_%' OR length(guarantor_characteristic_id) < 10);
    RAISE NOTICE 'Fixed guarantor_characteristic_id formats';

    -- Fix contract conditions
    FOR contract_record IN
        SELECT id, created_at, contract_conditions_characteristic_id
        FROM rental_contract_conditions
        WHERE contract_conditions_characteristic_id IS NOT NULL
        AND (contract_conditions_characteristic_id NOT LIKE 'CONTRACT_COND_%' OR length(contract_conditions_characteristic_id) < 15)
    LOOP
        UPDATE rental_contract_conditions
        SET contract_conditions_characteristic_id = 'CONTRACT_COND_' || LPAD(EXTRACT(EPOCH FROM contract_record.created_at)::text, 10, '0') || '_' || SUBSTRING(contract_record.id::text, 1, 8)
        WHERE id = contract_record.id;
    END LOOP;
    RAISE NOTICE 'Fixed contract_conditions_characteristic_id formats';

END $$;

-- =====================================================
-- STEP 4: VERIFICATION WITH SAFE STRING OPERATIONS
-- =====================================================

DO $$
DECLARE
  app_count INTEGER := 0;
  prop_count INTEGER := 0;
  owner_count INTEGER := 0;
  guarantor_count INTEGER := 0;
  contract_count INTEGER := 0;
  total_apps INTEGER := 0;
  total_props INTEGER := 0;
  total_owners INTEGER := 0;
  total_guarantors INTEGER := 0;
  total_contracts INTEGER := 0;
BEGIN
  -- Count properly formatted IDs using safe string operations
  SELECT COUNT(*) INTO app_count FROM applications WHERE application_characteristic_id LIKE 'APP_%';
  SELECT COUNT(*) INTO prop_count FROM properties WHERE property_characteristic_id LIKE 'PROP_%';
  SELECT COUNT(*) INTO owner_count FROM rental_owners WHERE rental_owner_characteristic_id LIKE 'RENTAL_OWNER_%';
  SELECT COUNT(*) INTO guarantor_count FROM applications WHERE guarantor_characteristic_id LIKE 'GUAR_%';
  SELECT COUNT(*) INTO contract_count FROM rental_contract_conditions WHERE contract_conditions_characteristic_id LIKE 'CONTRACT_COND_%';

  -- Count total records with characteristic_ids
  SELECT COUNT(*) INTO total_apps FROM applications WHERE application_characteristic_id IS NOT NULL;
  SELECT COUNT(*) INTO total_props FROM properties WHERE property_characteristic_id IS NOT NULL;
  SELECT COUNT(*) INTO total_owners FROM rental_owners WHERE rental_owner_characteristic_id IS NOT NULL;
  SELECT COUNT(*) INTO total_guarantors FROM applications WHERE guarantor_characteristic_id IS NOT NULL;
  SELECT COUNT(*) INTO total_contracts FROM rental_contract_conditions WHERE contract_conditions_characteristic_id IS NOT NULL;

  RAISE NOTICE 'SAFE Characteristic IDs format fix completed:';
  RAISE NOTICE '  Applications: %/% with APP_ format', app_count, total_apps;
  RAISE NOTICE '  Properties: %/% with PROP_ format', prop_count, total_props;
  RAISE NOTICE '  Owners: %/% with RENTAL_OWNER_ format', owner_count, total_owners;
  RAISE NOTICE '  Guarantors: %/% with GUAR_ format', guarantor_count, total_guarantors;
  RAISE NOTICE '  Contract conditions: %/% with CONTRACT_COND_ format', contract_count, total_contracts;

  -- Check if all are properly formatted
  IF app_count = total_apps AND prop_count = total_props AND owner_count = total_owners
     AND guarantor_count = total_guarantors AND contract_count = total_contracts THEN
    RAISE NOTICE '✅ SUCCESS: All characteristic_ids are properly formatted!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Some characteristic_ids still need formatting';
    RAISE NOTICE '   Run this script again if needed.';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'SAFE characteristic IDs format fix completed successfully!';
END $$;












