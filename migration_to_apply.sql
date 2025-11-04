-- =====================================================
-- ADD LEGAL ENTITY FIELDS TO RENTAL_OWNERS
-- =====================================================
-- This migration adds fields to support legal entity owners
-- with conditional logic based on constitution type

DO $$
BEGIN
  RAISE NOTICE 'Adding legal entity fields to rental_owners table...';
END $$;

-- Create enum for constitution type (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'constitution_type_enum') THEN
    CREATE TYPE constitution_type_enum AS ENUM ('empresa_en_un_dia', 'tradicional');
    RAISE NOTICE 'Created constitution_type_enum';
  ELSE
    RAISE NOTICE 'constitution_type_enum already exists, skipping creation';
  END IF;
END $$;

-- Add legal entity fields to rental_owners table
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS owner_type VARCHAR(20) DEFAULT 'natural' CHECK (owner_type IN ('natural', 'juridica'));
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS constitution_type constitution_type_enum;
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS constitution_date DATE;
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS cve_code VARCHAR(50);
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS notary_name VARCHAR(255);
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS repertory_number VARCHAR(50);

-- Add company-specific fields
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS company_rut VARCHAR(12);
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS company_business TEXT;
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS company_phone VARCHAR(20);

-- Add representative fields for legal entities
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS representative_first_name TEXT;
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS representative_paternal_last_name TEXT;
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS representative_maternal_last_name TEXT;
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS representative_rut VARCHAR(12);
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS representative_email VARCHAR(255);
ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS representative_phone VARCHAR(20);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_rental_owners_owner_type ON rental_owners(owner_type);
CREATE INDEX IF NOT EXISTS idx_rental_owners_constitution_type ON rental_owners(constitution_type);
CREATE INDEX IF NOT EXISTS idx_rental_owners_company_rut ON rental_owners(company_rut);
CREATE INDEX IF NOT EXISTS idx_rental_owners_representative_rut ON rental_owners(representative_rut);

-- Add validation constraints
-- For legal entities, constitution_date is required
-- For 'empresa_en_un_dia', cve_code is required
-- For 'tradicional', notary_name and repertory_number are required

-- Drop existing constraint if exists
ALTER TABLE rental_owners DROP CONSTRAINT IF EXISTS check_legal_entity_fields;

-- Add new constraint for legal entity validation
ALTER TABLE rental_owners ADD CONSTRAINT check_legal_entity_fields
  CHECK (
    -- For natural persons, no legal entity fields should be set
    (owner_type = 'natural' AND constitution_type IS NULL AND constitution_date IS NULL AND cve_code IS NULL AND notary_name IS NULL AND repertory_number IS NULL) OR
    -- For legal entities, constitution_date is always required
    (owner_type = 'juridica' AND constitution_date IS NOT NULL) OR
    -- For 'empresa_en_un_dia', cve_code is required
    (owner_type = 'juridica' AND constitution_type = 'empresa_en_un_dia' AND cve_code IS NOT NULL AND notary_name IS NULL AND repertory_number IS NULL) OR
    -- For 'tradicional', notary_name and repertory_number are required
    (owner_type = 'juridica' AND constitution_type = 'tradicional' AND notary_name IS NOT NULL AND repertory_number IS NOT NULL AND cve_code IS NULL)
  );

-- Add comments for documentation
COMMENT ON COLUMN rental_owners.owner_type IS 'Type of owner: natural (individual) or juridica (legal entity)';
COMMENT ON COLUMN rental_owners.constitution_type IS 'For legal entities: constitution type (empresa_en_un_dia or tradicional)';
COMMENT ON COLUMN rental_owners.constitution_date IS 'Constitution date - required for legal entities';
COMMENT ON COLUMN rental_owners.cve_code IS 'CVE code - required for "empresa en un día" legal entities';
COMMENT ON COLUMN rental_owners.notary_name IS 'Notary name - required for traditional legal entities';
COMMENT ON COLUMN rental_owners.repertory_number IS 'Repertory number - required for traditional legal entities';

COMMENT ON COLUMN rental_owners.company_name IS 'Company name for legal entities';
COMMENT ON COLUMN rental_owners.company_rut IS 'Company RUT for legal entities';
COMMENT ON COLUMN rental_owners.company_business IS 'Company business activity for legal entities';
COMMENT ON COLUMN rental_owners.company_email IS 'Company email for legal entities';
COMMENT ON COLUMN rental_owners.company_phone IS 'Company phone for legal entities';

COMMENT ON COLUMN rental_owners.representative_first_name IS 'Representative first name for legal entities';
COMMENT ON COLUMN rental_owners.representative_paternal_last_name IS 'Representative paternal last name for legal entities';
COMMENT ON COLUMN rental_owners.representative_maternal_last_name IS 'Representative maternal last name for legal entities';
COMMENT ON COLUMN rental_owners.representative_rut IS 'Representative RUT for legal entities';
COMMENT ON COLUMN rental_owners.representative_email IS 'Representative email for legal entities';
COMMENT ON COLUMN rental_owners.representative_phone IS 'Representative phone for legal entities';

-- Update existing records to set owner_type to 'natural' if null
UPDATE rental_owners SET owner_type = 'natural' WHERE owner_type IS NULL;

-- Verification
DO $$
DECLARE
  column_count INTEGER := 0;
BEGIN
  -- Check if all required columns exist
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'rental_owners'
    AND column_name IN ('owner_type', 'constitution_type', 'constitution_date', 'cve_code', 'notary_name', 'repertory_number',
                       'company_name', 'company_rut', 'company_business', 'company_email', 'company_phone',
                       'representative_first_name', 'representative_paternal_last_name', 'representative_maternal_last_name',
                       'representative_rut', 'representative_email', 'representative_phone');

  RAISE NOTICE 'Legal entity fields added to rental_owners: % columns', column_count;

  IF column_count >= 17 THEN
    RAISE NOTICE '✅ SUCCESS: All legal entity fields added successfully';
  ELSE
    RAISE NOTICE '⚠️ WARNING: Some columns may be missing';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- =====================================================
-- MAKE NATURAL PERSON FIELDS NULLABLE FOR LEGAL ENTITIES
-- =====================================================
-- Modify natural person fields to be nullable when owner_type is 'juridica'

DO $$
BEGIN
  RAISE NOTICE 'Making natural person fields nullable for legal entities...';
END $$;

-- Make natural person fields nullable for legal entities
-- Drop the NOT NULL constraints for fields that should be optional for legal entities
DO $$
BEGIN
  -- Check if first_name has NOT NULL constraint and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'rental_owners'
      AND tc.constraint_type = 'CHECK'
      AND kcu.column_name = 'first_name'
      AND tc.constraint_name LIKE '%not_null%'
  ) THEN
    ALTER TABLE rental_owners ALTER COLUMN first_name DROP NOT NULL;
    RAISE NOTICE 'Dropped NOT NULL constraint from first_name';
  END IF;

  -- Check if paternal_last_name has NOT NULL constraint and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'rental_owners'
      AND tc.constraint_type = 'CHECK'
      AND kcu.column_name = 'paternal_last_name'
      AND tc.constraint_name LIKE '%not_null%'
  ) THEN
    ALTER TABLE rental_owners ALTER COLUMN paternal_last_name DROP NOT NULL;
    RAISE NOTICE 'Dropped NOT NULL constraint from paternal_last_name';
  END IF;

  -- Check if rut has NOT NULL constraint and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'rental_owners'
      AND tc.constraint_type = 'CHECK'
      AND kcu.column_name = 'rut'
      AND tc.constraint_name LIKE '%not_null%'
  ) THEN
    ALTER TABLE rental_owners ALTER COLUMN rut DROP NOT NULL;
    RAISE NOTICE 'Dropped NOT NULL constraint from rut';
  END IF;
END $$;

-- Alternative approach: Use ALTER COLUMN directly (this is more reliable)
-- Only drop NOT NULL if they still have the constraint
DO $$
DECLARE
  col_name TEXT;
  cols_to_check TEXT[] := ARRAY['first_name', 'paternal_last_name', 'rut'];
BEGIN
  FOREACH col_name IN ARRAY cols_to_check
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'rental_owners'
        AND table_schema = 'public'
        AND column_name = col_name
        AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE rental_owners ALTER COLUMN %I DROP NOT NULL', col_name);
      RAISE NOTICE 'Dropped NOT NULL constraint from %', col_name;
    ELSE
      RAISE NOTICE '% is already nullable', col_name;
    END IF;
  END LOOP;
END $$;

-- Update the constraint to allow null values for natural person fields when owner_type is juridica
ALTER TABLE rental_owners DROP CONSTRAINT IF EXISTS check_legal_entity_fields;
ALTER TABLE rental_owners DROP CONSTRAINT IF EXISTS check_owner_fields;

ALTER TABLE rental_owners ADD CONSTRAINT check_owner_fields
  CHECK (
    -- For natural persons: first_name, paternal_last_name, and rut are required
    (owner_type = 'natural' AND first_name IS NOT NULL AND paternal_last_name IS NOT NULL AND rut IS NOT NULL) OR
    -- For legal entities: company_name and company_rut are required, natural person fields can be null
    (owner_type = 'juridica' AND company_name IS NOT NULL AND company_rut IS NOT NULL)
  );

-- Verification
DO $$
DECLARE
  natural_count INTEGER := 0;
  juridica_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO natural_count FROM rental_owners WHERE owner_type = 'natural';
  SELECT COUNT(*) INTO juridica_count FROM rental_owners WHERE owner_type = 'juridica';

  RAISE NOTICE 'Owner types in rental_owners: natural=% , juridica=%', natural_count, juridica_count;

  IF natural_count >= 0 AND juridica_count >= 0 THEN
    RAISE NOTICE '✅ SUCCESS: Natural person fields are now nullable for legal entities';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Legal entity fields migration for rental_owners completed successfully!';
END $$;