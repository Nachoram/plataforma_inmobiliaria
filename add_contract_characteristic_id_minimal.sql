-- Add contract_characteristic_id to rental_contracts table

-- Step 1: Add column
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS contract_characteristic_id text UNIQUE;

-- Step 2: Populate existing contracts
UPDATE rental_contracts 
SET contract_characteristic_id = 'CONTRACT_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE contract_characteristic_id IS NULL;

-- Step 3: Update function to include rental_contracts
CREATE OR REPLACE FUNCTION generate_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix text;
    timestamp_part text;
    id_part text;
BEGIN
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

-- Step 4: Create trigger if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_contract_characteristic_id') THEN
    CREATE TRIGGER trigger_generate_contract_characteristic_id
      BEFORE INSERT ON rental_contracts
      FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
  END IF;
END $$;

-- Step 5: Create index
CREATE INDEX IF NOT EXISTS idx_rental_contracts_characteristic_id ON rental_contracts(contract_characteristic_id);

-- Step 6: Add comment
COMMENT ON COLUMN rental_contracts.contract_characteristic_id IS 'Unique characteristic ID for webhook searches. Format: CONTRACT_timestamp_uuid';

