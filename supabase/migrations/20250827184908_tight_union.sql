/*
  # Update Properties Schema for Enhanced Form

  1. New Columns Added
    - `common_expenses` (numeric) - Monthly common expenses
    - `owner_full_name` (text) - Full name of property owner
    - `owner_address` (text) - Owner's address
    - `owner_email` (text) - Owner's contact email
    - `owner_phone` (text) - Owner's contact phone
    - `marital_status` (text) - Owner's marital status
    - `property_regime` (text) - Property regime (for married owners)

  2. Security
    - Maintain existing RLS policies
    - Add constraints for new enum fields

  3. Data Integrity
    - Add check constraints for marital status and property regime
    - Set appropriate default values
*/

-- Add new columns to properties table
DO $$
BEGIN
  -- Add common_expenses column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'common_expenses'
  ) THEN
    ALTER TABLE properties ADD COLUMN common_expenses numeric DEFAULT 0;
  END IF;

  -- Add owner_full_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_full_name'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_full_name text NOT NULL DEFAULT '';
  END IF;

  -- Add owner_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_address'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_address text DEFAULT '';
  END IF;

  -- Add owner_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_email'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_email text NOT NULL DEFAULT '';
  END IF;

  -- Add owner_phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_phone'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_phone text DEFAULT '';
  END IF;

  -- Add marital_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'marital_status'
  ) THEN
    ALTER TABLE properties ADD COLUMN marital_status text NOT NULL DEFAULT 'soltero';
  END IF;

  -- Add property_regime column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'property_regime'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_regime text DEFAULT '';
  END IF;
END $$;

-- Add check constraints for new enum fields
DO $$
BEGIN
  -- Add marital status constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_marital_status_check'
  ) THEN
    ALTER TABLE properties ADD CONSTRAINT properties_marital_status_check
    CHECK (marital_status IN ('soltero', 'casado', 'divorciado', 'viudo'));
  END IF;

  -- Add property regime constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_property_regime_check'
  ) THEN
    ALTER TABLE properties ADD CONSTRAINT properties_property_regime_check
    CHECK (property_regime IN ('', 'sociedad_conyugal', 'separacion_bienes', 'participacion_gananciales'));
  END IF;
END $$;

-- Update existing properties to have default values for new required fields
UPDATE properties 
SET 
  owner_full_name = COALESCE(owner_full_name, ''),
  owner_email = COALESCE(owner_email, ''),
  marital_status = COALESCE(marital_status, 'soltero')
WHERE owner_full_name = '' OR owner_email = '' OR marital_status IS NULL;