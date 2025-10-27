-- =====================================================
-- ENSURE ALL CHARACTERISTIC_ID COLUMNS EXIST
-- =====================================================
-- This migration ensures all tables have the required characteristic_id columns
-- for the contract generation webhook to work properly.

DO $$
BEGIN
  RAISE NOTICE 'Starting migration: Ensure all characteristic_id columns exist';
END $$;

-- =====================================================
-- 1. APPLICATIONS TABLE
-- =====================================================

-- Ensure guarantor_characteristic_id exists in applications (UUID type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'guarantor_characteristic_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN guarantor_characteristic_id UUID;
    RAISE NOTICE 'Added guarantor_characteristic_id to applications table';
  ELSE
    RAISE NOTICE 'guarantor_characteristic_id already exists in applications table';
  END IF;
END $$;

-- Generate missing application_characteristic_id values (as UUID)
UPDATE applications
SET application_characteristic_id = gen_random_uuid()
WHERE application_characteristic_id IS NULL;

-- Generate missing guarantor_characteristic_id values (as UUID)
UPDATE applications
SET guarantor_characteristic_id = gen_random_uuid()
WHERE guarantor_characteristic_id IS NULL AND guarantor_id IS NOT NULL;

-- =====================================================
-- 2. RENTAL_OWNERS TABLE
-- =====================================================

-- Ensure rental_owner_characteristic_id exists in rental_owners (UUID type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_owners' AND column_name = 'rental_owner_characteristic_id'
  ) THEN
    ALTER TABLE rental_owners ADD COLUMN rental_owner_characteristic_id UUID;
    RAISE NOTICE 'Added rental_owner_characteristic_id to rental_owners table';
  ELSE
    RAISE NOTICE 'rental_owner_characteristic_id already exists in rental_owners table';
  END IF;
END $$;

-- Generate missing rental_owner_characteristic_id values (as UUID)
UPDATE rental_owners
SET rental_owner_characteristic_id = gen_random_uuid()
WHERE rental_owner_characteristic_id IS NULL;

-- =====================================================
-- 2.5. PROPERTIES TABLE (additional characteristic_id)
-- =====================================================

-- Generate missing property_characteristic_id values (as UUID)
UPDATE properties
SET property_characteristic_id = gen_random_uuid()
WHERE property_characteristic_id IS NULL;

-- =====================================================
-- 3. RENTAL_CONTRACT_CONDITIONS TABLE
-- =====================================================

-- Create rental_contract_conditions table if it doesn't exist
CREATE TABLE IF NOT EXISTS rental_contract_conditions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  final_rent_price numeric NOT NULL,
  broker_name text NOT NULL,
  broker_rut varchar(12) NOT NULL,
  contract_duration_months integer NOT NULL,
  monthly_payment_day integer NOT NULL,
  guarantee_amount numeric NOT NULL,
  contract_start_date date NOT NULL,
  accepts_pets boolean DEFAULT false,
  additional_conditions text,
  payment_method text DEFAULT 'transferencia_bancaria',
  bank_name text,
  account_type text,
  account_number text,
  account_holder_rut varchar(12),
  account_holder_name text,
  contract_conditions_characteristic_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rental_contract_conditions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view rental contract conditions for their applications"
  ON rental_contract_conditions FOR SELECT
  TO authenticated
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      INNER JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rental contract conditions for their applications"
  ON rental_contract_conditions FOR INSERT
  TO authenticated
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      INNER JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rental contract conditions for their applications"
  ON rental_contract_conditions FOR UPDATE
  TO authenticated
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      INNER JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      INNER JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Ensure contract_conditions_characteristic_id exists in rental_contract_conditions (UUID type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'contract_conditions_characteristic_id'
  ) THEN
    ALTER TABLE rental_contract_conditions ADD COLUMN contract_conditions_characteristic_id UUID;
    RAISE NOTICE 'Added contract_conditions_characteristic_id to rental_contract_conditions table';
  ELSE
    RAISE NOTICE 'contract_conditions_characteristic_id already exists in rental_contract_conditions table';
  END IF;
END $$;

-- Generate missing contract_conditions_characteristic_id values (as UUID)
UPDATE rental_contract_conditions
SET contract_conditions_characteristic_id = gen_random_uuid()
WHERE contract_conditions_characteristic_id IS NULL;

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_app_characteristic ON applications(application_characteristic_id);
CREATE INDEX IF NOT EXISTS idx_applications_guarantor_characteristic ON applications(guarantor_characteristic_id);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_characteristic ON properties(property_characteristic_id);

-- Rental owners indexes
CREATE INDEX IF NOT EXISTS idx_rental_owners_characteristic ON rental_owners(rental_owner_characteristic_id);

-- Rental contract conditions indexes
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_characteristic ON rental_contract_conditions(contract_conditions_characteristic_id);
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_application ON rental_contract_conditions(application_id);

-- =====================================================
-- 5. ADD COMMENTS
-- =====================================================

COMMENT ON COLUMN applications.application_characteristic_id IS 'UUID único para características de la postulación';
COMMENT ON COLUMN applications.guarantor_characteristic_id IS 'UUID único para características del garante';
COMMENT ON COLUMN properties.property_characteristic_id IS 'UUID único para características de la propiedad';
COMMENT ON COLUMN rental_owners.rental_owner_characteristic_id IS 'UUID único para características del propietario';
COMMENT ON COLUMN rental_contract_conditions.contract_conditions_characteristic_id IS 'UUID único para características de las condiciones del contrato';

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

DO $$
DECLARE
  missing_apps INTEGER := 0;
  missing_props INTEGER := 0;
  missing_owners INTEGER := 0;
  missing_contracts INTEGER := 0;
BEGIN
  -- Check applications
  SELECT COUNT(*) INTO missing_apps
  FROM applications
  WHERE (application_characteristic_id IS NULL)
     OR (guarantor_characteristic_id IS NULL AND guarantor_id IS NOT NULL);

  -- Check properties
  SELECT COUNT(*) INTO missing_props
  FROM properties
  WHERE property_characteristic_id IS NULL;

  -- Check rental_owners
  SELECT COUNT(*) INTO missing_owners
  FROM rental_owners
  WHERE rental_owner_characteristic_id IS NULL;

  -- Check rental_contract_conditions
  SELECT COUNT(*) INTO missing_contracts
  FROM rental_contract_conditions
  WHERE contract_conditions_characteristic_id IS NULL;

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  Applications with missing characteristic_ids: %', missing_apps;
  RAISE NOTICE '  Properties with missing characteristic_ids: %', missing_props;
  RAISE NOTICE '  Rental owners with missing characteristic_ids: %', missing_owners;
  RAISE NOTICE '  Contract conditions with missing characteristic_ids: %', missing_contracts;

  IF missing_apps = 0 AND missing_props = 0 AND missing_owners = 0 AND missing_contracts = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All characteristic_id columns are populated with UUIDs!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Some characteristic_id values are still missing';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: All characteristic_id columns ensured with UUID values';
END $$;
