-- =====================================================
-- COMPLETE RENTAL OWNERS AND CHARACTERISTICS MIGRATION
-- =====================================================
-- This migration ensures that:
-- 1. rental_owners table exists and is populated
-- 2. All characteristic_id columns exist as UUID
-- 3. All characteristic_id columns are populated with valid UUIDs
-- 4. rental_contract_conditions table exists

DO $$
BEGIN
  RAISE NOTICE 'Starting complete migration: rental_owners and characteristics';
END $$;

-- =====================================================
-- 1. CREATE RENTAL_OWNERS TABLE IF NOT EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS rental_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  paternal_last_name text NOT NULL,
  maternal_last_name text,
  rut varchar(12) NOT NULL,
  address_street text,
  address_number varchar(10),
  address_department varchar(10),
  address_commune text,
  address_region text,
  marital_status marital_status_enum DEFAULT 'soltero',
  property_regime property_regime_enum,
  phone varchar(20),
  email varchar(255),
  rental_owner_characteristic_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rental_owners ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rental_owners_property_id ON rental_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_owners_rut ON rental_owners(rut);
CREATE INDEX IF NOT EXISTS idx_rental_owners_characteristic ON rental_owners(rental_owner_characteristic_id);

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rental_owners' AND policyname = 'Users can view rental owners for their properties'
  ) THEN
    CREATE POLICY "Users can view rental owners for their properties"
      ON rental_owners FOR SELECT
      TO authenticated
      USING (
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created SELECT policy for rental_owners';
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rental_owners' AND policyname = 'Users can insert rental owners for their properties'
  ) THEN
    CREATE POLICY "Users can insert rental owners for their properties"
      ON rental_owners FOR INSERT
      TO authenticated
      WITH CHECK (
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created INSERT policy for rental_owners';
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rental_owners' AND policyname = 'Users can update rental owners for their properties'
  ) THEN
    CREATE POLICY "Users can update rental owners for their properties"
      ON rental_owners FOR UPDATE
      TO authenticated
      USING (
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
      )
      WITH CHECK (
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created UPDATE policy for rental_owners';
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON rental_owners TO authenticated;
GRANT ALL ON rental_owners TO service_role;

-- =====================================================
-- 2. POPULATE RENTAL_OWNERS TABLE
-- =====================================================

-- Insert rental owners for rental properties that don't have one
-- This is idempotent - won't create duplicates
INSERT INTO rental_owners (
  property_id,
  first_name,
  paternal_last_name,
  maternal_last_name,
  rut,
  phone,
  email,
  marital_status,
  property_regime,
  address_street,
  address_number,
  address_department,
  address_commune,
  address_region
)
SELECT DISTINCT
  p.id as property_id,
  prof.first_name,
  prof.paternal_last_name,
  prof.maternal_last_name,
  prof.rut,
  prof.phone,
  prof.email,
  prof.marital_status,
  prof.property_regime,
  prof.address_street,
  prof.address_number,
  prof.address_department,
  prof.address_commune,
  prof.address_region
FROM properties p
INNER JOIN profiles prof ON p.owner_id = prof.id
LEFT JOIN rental_owners ro ON p.id = ro.property_id
WHERE p.listing_type = 'arriendo'
  AND ro.id IS NULL -- Only properties that don't have a rental_owner yet
  AND prof.id IS NOT NULL; -- Ensure profile exists

-- Generate rental_owner_characteristic_id for existing records
UPDATE rental_owners
SET rental_owner_characteristic_id = gen_random_uuid()
WHERE rental_owner_characteristic_id IS NULL;

-- =====================================================
-- 3. ADD CHARACTERISTIC_ID COLUMNS TO EXISTING TABLES
-- =====================================================

-- Applications table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'application_characteristic_id') THEN
    ALTER TABLE applications ADD COLUMN application_characteristic_id UUID;
    RAISE NOTICE 'Added application_characteristic_id to applications table';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'guarantor_characteristic_id') THEN
    ALTER TABLE applications ADD COLUMN guarantor_characteristic_id UUID;
    RAISE NOTICE 'Added guarantor_characteristic_id to applications table';
  END IF;
END $$;

-- Properties table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'property_characteristic_id') THEN
    ALTER TABLE properties ADD COLUMN property_characteristic_id UUID;
    RAISE NOTICE 'Added property_characteristic_id to properties table';
  END IF;

  -- Remove old rental_owner_characteristic_id from properties if it exists (should be in rental_owners now)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'rental_owner_characteristic_id') THEN
    ALTER TABLE properties DROP COLUMN rental_owner_characteristic_id;
    RAISE NOTICE 'Dropped rental_owner_characteristic_id from properties table (moved to rental_owners)';
  END IF;
END $$;

-- =====================================================
-- 4. CREATE RENTAL_CONTRACT_CONDITIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rental_contract_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  contract_conditions_characteristic_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for rental_contract_conditions
ALTER TABLE rental_contract_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies for rental_contract_conditions (only if they don't exist)
DO $$
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rental_contract_conditions' AND policyname = 'Users can view rental contract conditions for their applications'
  ) THEN
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
    RAISE NOTICE 'Created SELECT policy for rental_contract_conditions';
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rental_contract_conditions' AND policyname = 'Users can insert rental contract conditions for their applications'
  ) THEN
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
    RAISE NOTICE 'Created INSERT policy for rental_contract_conditions';
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rental_contract_conditions' AND policyname = 'Users can update rental contract conditions for their applications'
  ) THEN
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
    RAISE NOTICE 'Created UPDATE policy for rental_contract_conditions';
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON rental_contract_conditions TO authenticated;
GRANT ALL ON rental_contract_conditions TO service_role;

-- =====================================================
-- 5. GENERATE CHARACTERISTIC_ID VALUES
-- =====================================================

-- Generate application_characteristic_id
UPDATE applications
SET application_characteristic_id = gen_random_uuid()
WHERE application_characteristic_id IS NULL;

-- Generate guarantor_characteristic_id
UPDATE applications
SET guarantor_characteristic_id = gen_random_uuid()
WHERE guarantor_characteristic_id IS NULL AND guarantor_id IS NOT NULL;

-- Generate property_characteristic_id
UPDATE properties
SET property_characteristic_id = gen_random_uuid()
WHERE property_characteristic_id IS NULL;

-- Generate contract_conditions_characteristic_id
UPDATE rental_contract_conditions
SET contract_conditions_characteristic_id = gen_random_uuid()
WHERE contract_conditions_characteristic_id IS NULL;

-- =====================================================
-- 6. CREATE INDEXES
-- =====================================================

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_app_characteristic ON applications(application_characteristic_id);
CREATE INDEX IF NOT EXISTS idx_applications_guarantor_characteristic ON applications(guarantor_characteristic_id);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_characteristic ON properties(property_characteristic_id);

-- Rental contract conditions indexes
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_characteristic ON rental_contract_conditions(contract_conditions_characteristic_id);
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_application ON rental_contract_conditions(application_id);

-- =====================================================
-- 7. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE rental_owners IS 'Property owners information for rental properties';
COMMENT ON COLUMN rental_owners.rental_owner_characteristic_id IS 'UUID único para características del propietario';

COMMENT ON COLUMN applications.application_characteristic_id IS 'UUID único para características de la postulación';
COMMENT ON COLUMN applications.guarantor_characteristic_id IS 'UUID único para características del garante';
COMMENT ON COLUMN properties.property_characteristic_id IS 'UUID único para características de la propiedad';
COMMENT ON COLUMN rental_contract_conditions.contract_conditions_characteristic_id IS 'UUID único para características de las condiciones del contrato';

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

DO $$
DECLARE
  rental_owners_count INTEGER := 0;
  missing_apps INTEGER := 0;
  missing_props INTEGER := 0;
  missing_owners INTEGER := 0;
  missing_contracts INTEGER := 0;
BEGIN
  -- Count rental owners
  SELECT COUNT(*) INTO rental_owners_count FROM rental_owners;

  -- Check missing characteristic_ids
  SELECT COUNT(*) INTO missing_apps
  FROM applications
  WHERE (application_characteristic_id IS NULL)
     OR (guarantor_characteristic_id IS NULL AND guarantor_id IS NOT NULL);

  SELECT COUNT(*) INTO missing_props
  FROM properties
  WHERE property_characteristic_id IS NULL;

  SELECT COUNT(*) INTO missing_owners
  FROM rental_owners
  WHERE rental_owner_characteristic_id IS NULL;

  SELECT COUNT(*) INTO missing_contracts
  FROM rental_contract_conditions
  WHERE contract_conditions_characteristic_id IS NULL;

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  Rental owners created: %', rental_owners_count;
  RAISE NOTICE '  Applications with missing characteristic_ids: %', missing_apps;
  RAISE NOTICE '  Properties with missing characteristic_ids: %', missing_props;
  RAISE NOTICE '  Rental owners with missing characteristic_ids: %', missing_owners;
  RAISE NOTICE '  Contract conditions with missing characteristic_ids: %', missing_contracts;

  IF rental_owners_count > 0 AND missing_apps = 0 AND missing_props = 0 AND missing_owners = 0 AND missing_contracts = 0 THEN
    RAISE NOTICE '✅ SUCCESS: Complete migration successful!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Some issues remain. Check the counts above.';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Complete rental owners and characteristics migration finished';
END $$;
