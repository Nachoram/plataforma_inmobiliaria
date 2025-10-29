-- =====================================================
-- FIX CHARACTERISTIC IDS FORMAT
-- Convert existing UUID characteristic_ids to proper format (APP_, PROP_, etc.)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting characteristic IDs format fix...';
END $$;

-- =====================================================
-- STEP 1: CHANGE COLUMN TYPES FROM UUID TO TEXT
-- =====================================================

-- 1.1 Change application_characteristic_id type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'application_characteristic_id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE applications ALTER COLUMN application_characteristic_id TYPE TEXT;
    RAISE NOTICE 'Changed applications.application_characteristic_id from UUID to TEXT';
  END IF;
END $$;

-- 1.2 Change guarantor_characteristic_id type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'guarantor_characteristic_id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE applications ALTER COLUMN guarantor_characteristic_id TYPE TEXT;
    RAISE NOTICE 'Changed applications.guarantor_characteristic_id from UUID to TEXT';
  END IF;
END $$;

-- 1.3 Change property_characteristic_id type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'property_characteristic_id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE properties ALTER COLUMN property_characteristic_id TYPE TEXT;
    RAISE NOTICE 'Changed properties.property_characteristic_id from UUID to TEXT';
  END IF;
END $$;

-- 1.4 Change rental_owner_characteristic_id type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_owners' AND column_name = 'rental_owner_characteristic_id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE rental_owners ALTER COLUMN rental_owner_characteristic_id TYPE TEXT;
    RAISE NOTICE 'Changed rental_owners.rental_owner_characteristic_id from UUID to TEXT';
  END IF;
END $$;

-- 1.5 Change contract_conditions_characteristic_id type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'contract_conditions_characteristic_id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE rental_contract_conditions ALTER COLUMN contract_conditions_characteristic_id TYPE TEXT;
    RAISE NOTICE 'Changed rental_contract_conditions.contract_conditions_characteristic_id from UUID to TEXT';
  END IF;
END $$;

-- =====================================================
-- STEP 2: FIX CHARACTERISTIC IDS FORMAT
-- =====================================================

-- 2.1 Fix applications table
UPDATE applications
SET application_characteristic_id = 'APP_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE application_characteristic_id IS NOT NULL
  AND application_characteristic_id NOT LIKE 'APP_%';

-- 2.2 Fix properties table
UPDATE properties
SET property_characteristic_id = 'PROP_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE property_characteristic_id IS NOT NULL
  AND property_characteristic_id NOT LIKE 'PROP_%';

-- 2.3 Fix rental_owners table
UPDATE rental_owners
SET rental_owner_characteristic_id = 'RENTAL_OWNER_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE rental_owner_characteristic_id IS NOT NULL
  AND rental_owner_characteristic_id NOT LIKE 'RENTAL_OWNER_%';

-- 2.4 Fix guarantor_characteristic_id in applications
UPDATE applications
SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE guarantor_characteristic_id IS NOT NULL
  AND guarantor_characteristic_id NOT LIKE 'GUAR_%'
  AND guarantor_id IS NOT NULL;

-- 2.5 Fix contract_conditions_characteristic_id in rental_contract_conditions
UPDATE rental_contract_conditions
SET contract_conditions_characteristic_id = 'CONTRACT_COND_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE contract_conditions_characteristic_id IS NOT NULL
  AND contract_conditions_characteristic_id NOT LIKE 'CONTRACT_COND_%';

-- =====================================================
-- STEP 3: VERIFICATION
-- =====================================================

DO $$
DECLARE
  app_count INTEGER;
  prop_count INTEGER;
  owner_count INTEGER;
  guarantor_count INTEGER;
  contract_count INTEGER;
  total_apps INTEGER;
  total_props INTEGER;
  total_owners INTEGER;
  total_guarantors INTEGER;
  total_contracts INTEGER;
BEGIN
  -- Count properly formatted IDs
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

  RAISE NOTICE 'Characteristic IDs format fix completed:';
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
  END IF;
END $$;
