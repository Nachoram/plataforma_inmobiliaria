/*
  # Add Contract Characteristic ID to rental_contracts
  
  This migration adds a contract_characteristic_id column to the rental_contracts
  table to facilitate automated searches in webhooks and external systems like N8N.
  
  ## Changes:
  1. Add contract_characteristic_id column to rental_contracts table
  2. Update generate_characteristic_id() function to handle rental_contracts
  3. Create trigger for auto-generation on INSERT
  4. Populate existing contracts with characteristic IDs
  5. Create index for performance
  
  ## Format:
  CONTRACT_[timestamp]_[first 8 chars of UUID]
  Example: CONTRACT_1704067200_a1b2c3d4
*/

-- =====================================================
-- STEP 1: ADD CONTRACT_CHARACTERISTIC_ID COLUMN
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contracts' AND table_schema = 'public') THEN
    ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS contract_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added contract_characteristic_id column to rental_contracts table';
  ELSE
    RAISE NOTICE 'rental_contracts table does not exist - skipping';
  END IF;
END $$;

-- =====================================================
-- STEP 2: POPULATE EXISTING CONTRACTS WITH CHARACTERISTIC IDs
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contracts' AND table_schema = 'public') THEN
    UPDATE rental_contracts 
    SET contract_characteristic_id = 'CONTRACT_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE contract_characteristic_id IS NULL;
    RAISE NOTICE 'Populated contract_characteristic_id for existing contracts';
  END IF;
END $$;

-- =====================================================
-- STEP 3: UPDATE TRIGGER FUNCTION TO HANDLE RENTAL_CONTRACTS
-- =====================================================

-- Drop and recreate the function to include rental_contracts case
CREATE OR REPLACE FUNCTION generate_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix text;
    timestamp_part text;
    id_part text;
BEGIN
  -- Determine prefix based on table
  CASE TG_TABLE_NAME
    WHEN 'properties' THEN
      prefix := 'PROP_';
      IF NEW.property_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.property_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'applications' THEN
      prefix := 'APP_';
      IF NEW.application_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.application_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'offers' THEN
      prefix := 'OFFER_';
      IF NEW.offer_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.offer_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'guarantors' THEN
      prefix := 'GUAR_';
      IF NEW.guarantor_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.guarantor_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'documents' THEN
      prefix := 'DOC_';
      IF NEW.document_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.document_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'property_images' THEN
      prefix := 'IMG_';
      IF NEW.image_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.image_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'user_favorites' THEN
      prefix := 'FAV_';
      IF NEW.favorite_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.user_id::text, 1, 8);
        NEW.favorite_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'rental_contracts' THEN
      prefix := 'CONTRACT_';
      IF NEW.contract_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.contract_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: CREATE TRIGGER FOR AUTO-GENERATION
-- =====================================================

DO $$
BEGIN
  -- Create trigger for rental_contracts if it exists and trigger doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contracts' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_contract_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_contract_characteristic_id
        BEFORE INSERT ON rental_contracts
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for rental_contracts characteristic ID auto-generation';
    ELSE
      RAISE NOTICE 'Trigger already exists for rental_contracts characteristic ID generation';
    END IF;
  END IF;
END $$;

-- =====================================================
-- STEP 5: CREATE INDEX FOR PERFORMANCE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contracts' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_rental_contracts_characteristic_id ON rental_contracts(contract_characteristic_id);
    RAISE NOTICE 'Created index for rental_contracts.contract_characteristic_id';
  END IF;
END $$;

-- =====================================================
-- STEP 6: ADD DOCUMENTATION COMMENT
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contracts' AND table_schema = 'public') THEN
    COMMENT ON COLUMN rental_contracts.contract_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing. Format: CONTRACT_[timestamp]_[uuid_part]';
    RAISE NOTICE 'Added documentation comment to contract_characteristic_id column';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Added: contract_characteristic_id to rental_contracts';
  RAISE NOTICE 'Format: CONTRACT_TIMESTAMP_UUID_PART';
  RAISE NOTICE 'Example: CONTRACT_1704067200_a1b2c3d4';
  RAISE NOTICE 'Trigger: Auto-generates on INSERT';
  RAISE NOTICE 'Index: Created for performance';
  RAISE NOTICE '================================================';
END $$;

