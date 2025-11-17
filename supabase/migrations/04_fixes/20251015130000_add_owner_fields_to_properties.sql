-- Migration: Add owner information fields to properties table
-- Purpose: Allow storing detailed owner information for each property (Natural Person vs Legal Entity)

BEGIN;

-- Add owner type enum
CREATE TYPE owner_type_enum AS ENUM ('natural', 'juridica');

-- Add owner information fields to properties table
ALTER TABLE public.properties
  -- Owner type
  ADD COLUMN owner_type owner_type_enum DEFAULT 'natural',

  -- Natural person fields
  ADD COLUMN owner_first_name text,
  ADD COLUMN owner_paternal_last_name text,
  ADD COLUMN owner_maternal_last_name text,
  ADD COLUMN owner_rut varchar(12),
  ADD COLUMN owner_email varchar(255),
  ADD COLUMN owner_phone varchar(20),

  -- Legal entity fields
  ADD COLUMN owner_company_name text,
  ADD COLUMN owner_company_rut varchar(12),
  ADD COLUMN owner_company_business text,
  ADD COLUMN owner_company_email varchar(255),
  ADD COLUMN owner_company_phone varchar(20),

  -- Legal representative fields
  ADD COLUMN owner_representative_first_name text,
  ADD COLUMN owner_representative_paternal_last_name text,
  ADD COLUMN owner_representative_maternal_last_name text,
  ADD COLUMN owner_representative_rut varchar(12),
  ADD COLUMN owner_representative_email varchar(255),
  ADD COLUMN owner_representative_phone varchar(20);

-- Add comments for documentation
COMMENT ON COLUMN properties.owner_type IS 'Type of property owner: natural (individual) or juridica (legal entity)';
COMMENT ON COLUMN properties.owner_first_name IS 'Owner first name (for natural persons)';
COMMENT ON COLUMN properties.owner_paternal_last_name IS 'Owner paternal last name (for natural persons)';
COMMENT ON COLUMN properties.owner_maternal_last_name IS 'Owner maternal last name (for natural persons)';
COMMENT ON COLUMN properties.owner_rut IS 'Owner RUT (for natural persons)';
COMMENT ON COLUMN properties.owner_email IS 'Owner email (for natural persons)';
COMMENT ON COLUMN properties.owner_phone IS 'Owner phone (for natural persons)';
COMMENT ON COLUMN properties.owner_company_name IS 'Company name (for legal entities)';
COMMENT ON COLUMN properties.owner_company_rut IS 'Company RUT (for legal entities)';
COMMENT ON COLUMN properties.owner_company_business IS 'Company business type/giro (for legal entities)';
COMMENT ON COLUMN properties.owner_company_email IS 'Company email (for legal entities)';
COMMENT ON COLUMN properties.owner_company_phone IS 'Company phone (for legal entities)';
COMMENT ON COLUMN properties.owner_representative_first_name IS 'Legal representative first name (for legal entities)';
COMMENT ON COLUMN properties.owner_representative_paternal_last_name IS 'Legal representative paternal last name (for legal entities)';
COMMENT ON COLUMN properties.owner_representative_maternal_last_name IS 'Legal representative maternal last name (for legal entities)';
COMMENT ON COLUMN properties.owner_representative_rut IS 'Legal representative RUT (for legal entities)';
COMMENT ON COLUMN properties.owner_representative_email IS 'Legal representative email (for legal entities)';
COMMENT ON COLUMN properties.owner_representative_phone IS 'Legal representative phone (for legal entities)';

COMMIT;
