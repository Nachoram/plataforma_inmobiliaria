/*
  # Add Rental and Sale Owners to Contract Functions

  This migration updates the contract data functions to include rental_owners
  and sale_owners tables, providing complete access to all owner information
  for both rental and sale properties.

  ## Changes Made:
  1. **Update get_contract_data_by_characteristic_ids()** - Add rental/sale owner data
  2. **Update get_contract_data_by_uuids()** - Add rental/sale owner data
  3. **Update contract_data_view** - Include owner information
  4. **Add characteristic IDs** - For rental_owners and sale_owners tables

  ## New Data Available:
  - Complete rental owner information (name, contact, address, legal status)
  - Complete sale owner information (name, contact, address, legal status)
  - Proper owner data based on property listing type
*/

-- =====================================================
-- STEP 1: ADD CHARACTERISTIC IDS TO OWNER TABLES
-- =====================================================

-- Add characteristic_id to rental_owners table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_owners' AND table_schema = 'public') THEN
    ALTER TABLE rental_owners ADD COLUMN IF NOT EXISTS rental_owner_characteristic_id text UNIQUE;

    -- Populate existing records
    UPDATE rental_owners
    SET rental_owner_characteristic_id = 'RENTAL_OWNER_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE rental_owner_characteristic_id IS NULL;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_rental_owners_characteristic_id ON rental_owners(rental_owner_characteristic_id);

    RAISE NOTICE 'Added rental_owner_characteristic_id to rental_owners table';
  ELSE
    RAISE NOTICE 'rental_owners table does not exist - skipping';
  END IF;
END $$;

-- Add characteristic_id to sale_owners table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_owners' AND table_schema = 'public') THEN
    ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS sale_owner_characteristic_id text UNIQUE;

    -- Populate existing records
    UPDATE sale_owners
    SET sale_owner_characteristic_id = 'SALE_OWNER_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE sale_owner_characteristic_id IS NULL;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_sale_owners_characteristic_id ON sale_owners(sale_owner_characteristic_id);

    RAISE NOTICE 'Added sale_owner_characteristic_id to sale_owners table';
  ELSE
    RAISE NOTICE 'sale_owners table does not exist - skipping';
  END IF;
END $$;

-- =====================================================
-- STEP 1.5: ADD CHARACTERISTIC ID TO RENTAL CONTRACT CONDITIONS
-- =====================================================

-- Create trigger function for auto-generating characteristic_id (outside DO block)
CREATE OR REPLACE FUNCTION generate_rental_contract_conditions_characteristic_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rental_contract_conditions_characteristic_id IS NULL THEN
    NEW.rental_contract_conditions_characteristic_id :=
      'CONTRACT_COND_' || LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0') || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add characteristic_id to rental_contract_conditions table for N8N optimization
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contract_conditions' AND table_schema = 'public') THEN
    ALTER TABLE rental_contract_conditions ADD COLUMN IF NOT EXISTS rental_contract_conditions_characteristic_id text UNIQUE;

    -- Populate existing records with characteristic IDs
    UPDATE rental_contract_conditions
    SET rental_contract_conditions_characteristic_id = 'CONTRACT_COND_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE rental_contract_conditions_characteristic_id IS NULL;

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_characteristic_id ON rental_contract_conditions(rental_contract_conditions_characteristic_id);

    RAISE NOTICE 'Added rental_contract_conditions_characteristic_id to rental_contract_conditions table';

    -- Create trigger
    DROP TRIGGER IF EXISTS trigger_generate_rental_contract_conditions_characteristic_id ON rental_contract_conditions;
    CREATE TRIGGER trigger_generate_rental_contract_conditions_characteristic_id
      BEFORE INSERT ON rental_contract_conditions
      FOR EACH ROW
      EXECUTE FUNCTION generate_rental_contract_conditions_characteristic_id();

    RAISE NOTICE 'Created trigger for auto-generating rental_contract_conditions_characteristic_id';
  ELSE
    RAISE NOTICE 'rental_contract_conditions table does not exist - skipping';
  END IF;
END $$;

-- =====================================================
-- STEP 2: UPDATE CONTRACT FUNCTIONS WITH OWNER DATA
-- =====================================================

-- Drop existing functions first (required to change return type)
DROP FUNCTION IF EXISTS get_contract_data_by_characteristic_ids(text, text, text);
DROP FUNCTION IF EXISTS get_contract_data_by_uuids(uuid, uuid, uuid);

-- Recreate get_contract_data_by_characteristic_ids function with owner data
CREATE OR REPLACE FUNCTION get_contract_data_by_characteristic_ids(
  p_application_characteristic_id text,
  p_property_characteristic_id text DEFAULT NULL,
  p_guarantor_characteristic_id text DEFAULT NULL
)
RETURNS TABLE (
  -- Application data
  application_id uuid,
  application_characteristic_id text,
  application_status application_status_enum,
  application_message text,
  application_created_at timestamptz,

  -- Property data
  property_id uuid,
  property_characteristic_id text,
  property_address_street text,
  property_address_number varchar(10),
  property_address_department varchar(10),
  property_address_commune text,
  property_address_region text,
  property_price_clp bigint,
  property_common_expenses_clp integer,
  property_bedrooms integer,
  property_bathrooms integer,
  property_surface_m2 integer,
  property_listing_type listing_type_enum,
  property_description text,

  -- Current owner data (from profiles - for backward compatibility)
  owner_id uuid,
  owner_first_name text,
  owner_paternal_last_name text,
  owner_maternal_last_name text,
  owner_rut varchar(12),
  owner_email varchar(255),
  owner_phone varchar(20),
  owner_profession text,

  -- Rental owner data (if rental property)
  rental_owner_id uuid,
  rental_owner_characteristic_id text,
  rental_owner_first_name text,
  rental_owner_paternal_last_name text,
  rental_owner_maternal_last_name text,
  rental_owner_rut varchar(12),
  rental_owner_phone varchar(20),
  rental_owner_email varchar(255),
  rental_owner_marital_status marital_status_enum,
  rental_owner_property_regime property_regime_enum,
  rental_owner_address_street text,
  rental_owner_address_number varchar(10),
  rental_owner_address_department varchar(10),
  rental_owner_address_commune text,
  rental_owner_address_region text,

  -- Sale owner data (if sale property)
  sale_owner_id uuid,
  sale_owner_characteristic_id text,
  sale_owner_first_name text,
  sale_owner_paternal_last_name text,
  sale_owner_maternal_last_name text,
  sale_owner_rut varchar(12),
  sale_owner_phone varchar(20),
  sale_owner_email varchar(255),
  sale_owner_marital_status marital_status_enum,
  sale_owner_property_regime property_regime_enum,
  sale_owner_address_street text,
  sale_owner_address_number varchar(10),
  sale_owner_address_department varchar(10),
  sale_owner_address_commune text,
  sale_owner_address_region text,

  -- Applicant data
  applicant_id uuid,
  applicant_first_name text,
  applicant_paternal_last_name text,
  applicant_maternal_last_name text,
  applicant_rut varchar(12),
  applicant_email varchar(255),
  applicant_phone varchar(20),
  applicant_profession text,
  applicant_marital_status marital_status_enum,
  applicant_property_regime property_regime_enum,
  applicant_monthly_income_clp bigint,
  applicant_address_street text,
  applicant_address_number varchar(10),
  applicant_address_department varchar(10),
  applicant_address_commune text,
  applicant_address_region text,

  -- Guarantor data (optional)
  guarantor_id uuid,
  guarantor_characteristic_id text,
  guarantor_first_name text,
  guarantor_paternal_last_name text,
  guarantor_maternal_last_name text,
  guarantor_rut varchar(12),
  guarantor_profession text,
  guarantor_monthly_income_clp bigint,
  guarantor_address_street text,
  guarantor_address_number varchar(10),
  guarantor_address_department varchar(10),
  guarantor_address_commune text,
  guarantor_address_region text,

  -- Property images
  property_images jsonb,

  -- Documents
  application_documents jsonb,
  property_documents jsonb,

  -- Rental contract conditions
  rental_contract_conditions_id uuid,
  rental_contract_conditions_characteristic_id text,
  lease_term_months integer,
  payment_day integer,
  final_price_clp integer,
  broker_commission_clp integer,
  guarantee_amount_clp integer,
  official_communication_email text,
  accepts_pets boolean,
  dicom_clause boolean,
  additional_conditions text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Application data
    a.id as application_id,
    a.application_characteristic_id,
    a.status as application_status,
    a.message as application_message,
    a.created_at as application_created_at,

    -- Property data
    p.id as property_id,
    p.property_characteristic_id,
    p.address_street as property_address_street,
    p.address_number as property_address_number,
    p.address_department as property_address_department,
    p.address_commune as property_address_commune,
    p.address_region as property_address_region,
    p.price_clp as property_price_clp,
    p.common_expenses_clp as property_common_expenses_clp,
    p.bedrooms as property_bedrooms,
    p.bathrooms as property_bathrooms,
    p.surface_m2 as property_surface_m2,
    p.listing_type as property_listing_type,
    p.description as property_description,

    -- Current owner data (from profiles - for backward compatibility)
    prof_owner.id as owner_id,
    prof_owner.first_name as owner_first_name,
    prof_owner.paternal_last_name as owner_paternal_last_name,
    prof_owner.maternal_last_name as owner_maternal_last_name,
    prof_owner.rut as owner_rut,
    prof_owner.email as owner_email,
    prof_owner.phone as owner_phone,
    prof_owner.profession as owner_profession,

    -- Rental owner data
    ro.id as rental_owner_id,
    ro.rental_owner_characteristic_id,
    ro.first_name as rental_owner_first_name,
    ro.paternal_last_name as rental_owner_paternal_last_name,
    ro.maternal_last_name as rental_owner_maternal_last_name,
    ro.rut as rental_owner_rut,
    ro.phone as rental_owner_phone,
    ro.email as rental_owner_email,
    ro.marital_status as rental_owner_marital_status,
    ro.property_regime as rental_owner_property_regime,
    ro.address_street as rental_owner_address_street,
    ro.address_number as rental_owner_address_number,
    ro.address_department as rental_owner_address_department,
    ro.address_commune as rental_owner_address_commune,
    ro.address_region as rental_owner_address_region,

    -- Sale owner data
    so.id as sale_owner_id,
    so.sale_owner_characteristic_id,
    so.first_name as sale_owner_first_name,
    so.paternal_last_name as sale_owner_paternal_last_name,
    so.maternal_last_name as sale_owner_maternal_last_name,
    so.rut as sale_owner_rut,
    so.phone as sale_owner_phone,
    so.email as sale_owner_email,
    so.marital_status as sale_owner_marital_status,
    so.property_regime as sale_owner_property_regime,
    so.address_street as sale_owner_address_street,
    so.address_number as sale_owner_address_number,
    so.address_department as sale_owner_address_department,
    so.address_commune as sale_owner_address_commune,
    so.address_region as sale_owner_address_region,

    -- Applicant data
    prof_applicant.id as applicant_id,
    prof_applicant.first_name as applicant_first_name,
    prof_applicant.paternal_last_name as applicant_paternal_last_name,
    prof_applicant.maternal_last_name as applicant_maternal_last_name,
    prof_applicant.rut as applicant_rut,
    prof_applicant.email as applicant_email,
    prof_applicant.phone as applicant_phone,
    prof_applicant.profession as applicant_profession,
    prof_applicant.marital_status as applicant_marital_status,
    prof_applicant.property_regime as applicant_property_regime,
    a.snapshot_applicant_monthly_income_clp as applicant_monthly_income_clp,
    a.snapshot_applicant_address_street as applicant_address_street,
    a.snapshot_applicant_address_number as applicant_address_number,
    a.snapshot_applicant_address_department as applicant_address_department,
    a.snapshot_applicant_address_commune as applicant_address_commune,
    a.snapshot_applicant_address_region as applicant_address_region,

    -- Guarantor data
    g.id as guarantor_id,
    g.guarantor_characteristic_id,
    g.first_name as guarantor_first_name,
    g.paternal_last_name as guarantor_paternal_last_name,
    g.maternal_last_name as guarantor_maternal_last_name,
    g.rut as guarantor_rut,
    g.profession as guarantor_profession,
    g.monthly_income_clp as guarantor_monthly_income_clp,
    g.address_street as guarantor_address_street,
    g.address_number as guarantor_address_number,
    g.address_department as guarantor_address_department,
    g.address_commune as guarantor_address_commune,
    g.address_region as guarantor_address_region,

    -- Property images
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'storage_path', pi.storage_path,
          'created_at', pi.created_at
        )
      ) FILTER (WHERE pi.id IS NOT NULL),
      '[]'::jsonb
    ) as property_images,

    -- Application documents
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ad.id,
          'document_type', ad.document_type,
          'file_name', ad.file_name,
          'storage_path', ad.storage_path,
          'created_at', ad.created_at
        )
      ) FILTER (WHERE ad.id IS NOT NULL AND ad.related_entity_type = 'application_applicant'),
      '[]'::jsonb
    ) as application_documents,

    -- Property documents
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', pd.id,
          'document_type', pd.document_type,
          'file_name', pd.file_name,
          'storage_path', pd.storage_path,
          'created_at', pd.created_at
        )
      ) FILTER (WHERE pd.id IS NOT NULL AND pd.related_entity_type = 'property_legal'),
      '[]'::jsonb
    ) as property_documents,

    -- Rental contract conditions
    rcc.id as rental_contract_conditions_id,
    rcc.rental_contract_conditions_characteristic_id,
    rcc.lease_term_months,
    rcc.payment_day,
    rcc.final_price_clp,
    rcc.broker_commission_clp,
    rcc.guarantee_amount_clp,
    rcc.official_communication_email,
    rcc.accepts_pets,
    rcc.dicom_clause,
    rcc.additional_conditions

  FROM applications a
  INNER JOIN properties p ON a.property_id = p.id
  INNER JOIN profiles prof_owner ON p.owner_id = prof_owner.id
  INNER JOIN profiles prof_applicant ON a.applicant_id = prof_applicant.id
  LEFT JOIN rental_owners ro ON p.id = ro.property_id
  LEFT JOIN sale_owners so ON p.id = so.property_id
  LEFT JOIN guarantors g ON a.guarantor_id = g.id
  LEFT JOIN rental_contract_conditions rcc ON a.id = rcc.application_id

  -- Property images
  LEFT JOIN property_images pi ON p.id = pi.property_id

  -- Application documents (applicant documents)
  LEFT JOIN documents ad ON ad.related_entity_id = a.id AND ad.related_entity_type = 'application_applicant'

  -- Property documents (legal documents)
  LEFT JOIN documents pd ON pd.related_entity_id = p.id AND pd.related_entity_type = 'property_legal'

  WHERE a.application_characteristic_id = p_application_characteristic_id
    AND (p_property_characteristic_id IS NULL OR p.property_characteristic_id = p_property_characteristic_id)
    AND (p_guarantor_characteristic_id IS NULL OR g.guarantor_characteristic_id = p_guarantor_characteristic_id)

  GROUP BY
    a.id, a.application_characteristic_id, a.status, a.message, a.created_at,
    p.id, p.property_characteristic_id, p.address_street, p.address_number,
    p.address_department, p.address_commune, p.address_region, p.price_clp,
    p.common_expenses_clp, p.bedrooms, p.bathrooms, p.surface_m2,
    p.listing_type, p.description,
    prof_owner.id, prof_owner.first_name, prof_owner.paternal_last_name,
    prof_owner.maternal_last_name, prof_owner.rut, prof_owner.email,
    prof_owner.phone, prof_owner.profession,
    ro.id, ro.rental_owner_characteristic_id, ro.first_name, ro.paternal_last_name,
    ro.maternal_last_name, ro.rut, ro.phone, ro.email, ro.marital_status,
    ro.property_regime, ro.address_street, ro.address_number, ro.address_department,
    ro.address_commune, ro.address_region,
    so.id, so.sale_owner_characteristic_id, so.first_name, so.paternal_last_name,
    so.maternal_last_name, so.rut, so.phone, so.email, so.marital_status,
    so.property_regime, so.address_street, so.address_number, so.address_department,
    so.address_commune, so.address_region,
    prof_applicant.id, prof_applicant.first_name, prof_applicant.paternal_last_name,
    prof_applicant.maternal_last_name, prof_applicant.rut, prof_applicant.email,
    prof_applicant.phone, prof_applicant.profession, prof_applicant.marital_status,
    prof_applicant.property_regime, a.snapshot_applicant_monthly_income_clp,
    a.snapshot_applicant_address_street, a.snapshot_applicant_address_number,
    a.snapshot_applicant_address_department, a.snapshot_applicant_address_commune,
    a.snapshot_applicant_address_region,
    g.id, g.guarantor_characteristic_id, g.first_name, g.paternal_last_name,
    g.maternal_last_name, g.rut, g.profession, g.monthly_income_clp,
    g.address_street, g.address_number, g.address_department,
    g.address_commune, g.address_region,
    rcc.id, rcc.rental_contract_conditions_characteristic_id, rcc.lease_term_months,
    rcc.payment_day, rcc.final_price_clp, rcc.broker_commission_clp,
    rcc.guarantee_amount_clp, rcc.official_communication_email, rcc.accepts_pets,
    rcc.dicom_clause, rcc.additional_conditions;
END;
$$;

-- Recreate get_contract_data_by_uuids function with owner data
CREATE OR REPLACE FUNCTION get_contract_data_by_uuids(
  p_application_id uuid,
  p_property_id uuid DEFAULT NULL,
  p_guarantor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  -- Same structure as above with all owner data
  application_id uuid,
  application_characteristic_id text,
  application_status application_status_enum,
  application_message text,
  application_created_at timestamptz,

  property_id uuid,
  property_characteristic_id text,
  property_address_street text,
  property_address_number varchar(10),
  property_address_department varchar(10),
  property_address_commune text,
  property_address_region text,
  property_price_clp bigint,
  property_common_expenses_clp integer,
  property_bedrooms integer,
  property_bathrooms integer,
  property_surface_m2 integer,
  property_listing_type listing_type_enum,
  property_description text,

  owner_id uuid,
  owner_first_name text,
  owner_paternal_last_name text,
  owner_maternal_last_name text,
  owner_rut varchar(12),
  owner_email varchar(255),
  owner_phone varchar(20),
  owner_profession text,

  rental_owner_id uuid,
  rental_owner_characteristic_id text,
  rental_owner_first_name text,
  rental_owner_paternal_last_name text,
  rental_owner_maternal_last_name text,
  rental_owner_rut varchar(12),
  rental_owner_phone varchar(20),
  rental_owner_email varchar(255),
  rental_owner_marital_status marital_status_enum,
  rental_owner_property_regime property_regime_enum,
  rental_owner_address_street text,
  rental_owner_address_number varchar(10),
  rental_owner_address_department varchar(10),
  rental_owner_address_commune text,
  rental_owner_address_region text,

  sale_owner_id uuid,
  sale_owner_characteristic_id text,
  sale_owner_first_name text,
  sale_owner_paternal_last_name text,
  sale_owner_maternal_last_name text,
  sale_owner_rut varchar(12),
  sale_owner_phone varchar(20),
  sale_owner_email varchar(255),
  sale_owner_marital_status marital_status_enum,
  sale_owner_property_regime property_regime_enum,
  sale_owner_address_street text,
  sale_owner_address_number varchar(10),
  sale_owner_address_department varchar(10),
  sale_owner_address_commune text,
  sale_owner_address_region text,

  applicant_id uuid,
  applicant_first_name text,
  applicant_paternal_last_name text,
  applicant_maternal_last_name text,
  applicant_rut varchar(12),
  applicant_email varchar(255),
  applicant_phone varchar(20),
  applicant_profession text,
  applicant_marital_status marital_status_enum,
  applicant_property_regime property_regime_enum,
  applicant_monthly_income_clp bigint,
  applicant_address_street text,
  applicant_address_number varchar(10),
  applicant_address_department varchar(10),
  applicant_address_commune text,
  applicant_address_region text,

  guarantor_id uuid,
  guarantor_characteristic_id text,
  guarantor_first_name text,
  guarantor_paternal_last_name text,
  guarantor_maternal_last_name text,
  guarantor_rut varchar(12),
  guarantor_profession text,
  guarantor_monthly_income_clp bigint,
  guarantor_address_street text,
  guarantor_address_number varchar(10),
  guarantor_address_department varchar(10),
  guarantor_address_commune text,
  guarantor_address_region text,

  property_images jsonb,
  application_documents jsonb,
  property_documents jsonb,

  rental_contract_conditions_id uuid,
  rental_contract_conditions_characteristic_id text,
  lease_term_months integer,
  payment_day integer,
  final_price_clp integer,
  broker_commission_clp integer,
  guarantee_amount_clp integer,
  official_communication_email text,
  accepts_pets boolean,
  dicom_clause boolean,
  additional_conditions text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Same structure as the characteristic_ids function
    a.id as application_id,
    a.application_characteristic_id,
    a.status as application_status,
    a.message as application_message,
    a.created_at as application_created_at,

    p.id as property_id,
    p.property_characteristic_id,
    p.address_street as property_address_street,
    p.address_number as property_address_number,
    p.address_department as property_address_department,
    p.address_commune as property_address_commune,
    p.address_region as property_address_region,
    p.price_clp as property_price_clp,
    p.common_expenses_clp as property_common_expenses_clp,
    p.bedrooms as property_bedrooms,
    p.bathrooms as property_bathrooms,
    p.surface_m2 as property_surface_m2,
    p.listing_type as property_listing_type,
    p.description as property_description,

    prof_owner.id as owner_id,
    prof_owner.first_name as owner_first_name,
    prof_owner.paternal_last_name as owner_paternal_last_name,
    prof_owner.maternal_last_name as owner_maternal_last_name,
    prof_owner.rut as owner_rut,
    prof_owner.email as owner_email,
    prof_owner.phone as owner_phone,
    prof_owner.profession as owner_profession,

    ro.id as rental_owner_id,
    ro.rental_owner_characteristic_id,
    ro.first_name as rental_owner_first_name,
    ro.paternal_last_name as rental_owner_paternal_last_name,
    ro.maternal_last_name as rental_owner_maternal_last_name,
    ro.rut as rental_owner_rut,
    ro.phone as rental_owner_phone,
    ro.email as rental_owner_email,
    ro.marital_status as rental_owner_marital_status,
    ro.property_regime as rental_owner_property_regime,
    ro.address_street as rental_owner_address_street,
    ro.address_number as rental_owner_address_number,
    ro.address_department as rental_owner_address_department,
    ro.address_commune as rental_owner_address_commune,
    ro.address_region as rental_owner_address_region,

    so.id as sale_owner_id,
    so.sale_owner_characteristic_id,
    so.first_name as sale_owner_first_name,
    so.paternal_last_name as sale_owner_paternal_last_name,
    so.maternal_last_name as sale_owner_maternal_last_name,
    so.rut as sale_owner_rut,
    so.phone as sale_owner_phone,
    so.email as sale_owner_email,
    so.marital_status as sale_owner_marital_status,
    so.property_regime as sale_owner_property_regime,
    so.address_street as sale_owner_address_street,
    so.address_number as sale_owner_address_number,
    so.address_department as sale_owner_address_department,
    so.address_commune as sale_owner_address_commune,
    so.address_region as sale_owner_address_region,

    prof_applicant.id as applicant_id,
    prof_applicant.first_name as applicant_first_name,
    prof_applicant.paternal_last_name as applicant_paternal_last_name,
    prof_applicant.maternal_last_name as applicant_maternal_last_name,
    prof_applicant.rut as applicant_rut,
    prof_applicant.email as applicant_email,
    prof_applicant.phone as applicant_phone,
    prof_applicant.profession as applicant_profession,
    prof_applicant.marital_status as applicant_marital_status,
    prof_applicant.property_regime as applicant_property_regime,
    a.snapshot_applicant_monthly_income_clp as applicant_monthly_income_clp,
    a.snapshot_applicant_address_street as applicant_address_street,
    a.snapshot_applicant_address_number as applicant_address_number,
    a.snapshot_applicant_address_department as applicant_address_department,
    a.snapshot_applicant_address_commune as applicant_address_commune,
    a.snapshot_applicant_address_region as applicant_address_region,

    g.id as guarantor_id,
    g.guarantor_characteristic_id,
    g.first_name as guarantor_first_name,
    g.paternal_last_name as guarantor_paternal_last_name,
    g.maternal_last_name as guarantor_maternal_last_name,
    g.rut as guarantor_rut,
    g.profession as guarantor_profession,
    g.monthly_income_clp as guarantor_monthly_income_clp,
    g.address_street as guarantor_address_street,
    g.address_number as guarantor_address_number,
    g.address_department as guarantor_address_department,
    g.address_commune as guarantor_address_commune,
    g.address_region as guarantor_address_region,

    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'storage_path', pi.storage_path,
          'created_at', pi.created_at
        )
      ) FILTER (WHERE pi.id IS NOT NULL),
      '[]'::jsonb
    ) as property_images,

    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ad.id,
          'document_type', ad.document_type,
          'file_name', ad.file_name,
          'storage_path', ad.storage_path,
          'created_at', ad.created_at
        )
      ) FILTER (WHERE ad.id IS NOT NULL AND ad.related_entity_type = 'application_applicant'),
      '[]'::jsonb
    ) as application_documents,

    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', pd.id,
          'document_type', pd.document_type,
          'file_name', pd.file_name,
          'storage_path', pd.storage_path,
          'created_at', pd.created_at
        )
      ) FILTER (WHERE pd.id IS NOT NULL AND pd.related_entity_type = 'property_legal'),
      '[]'::jsonb
    ) as property_documents

  FROM applications a
  INNER JOIN properties p ON a.property_id = p.id
  INNER JOIN profiles prof_owner ON p.owner_id = prof_owner.id
  INNER JOIN profiles prof_applicant ON a.applicant_id = prof_applicant.id
  LEFT JOIN rental_owners ro ON p.id = ro.property_id
  LEFT JOIN sale_owners so ON p.id = so.property_id
  LEFT JOIN guarantors g ON a.guarantor_id = g.id
  LEFT JOIN rental_contract_conditions rcc ON a.id = rcc.application_id

  LEFT JOIN property_images pi ON p.id = pi.property_id
  LEFT JOIN documents ad ON ad.related_entity_id = a.id AND ad.related_entity_type = 'application_applicant'
  LEFT JOIN documents pd ON pd.related_entity_id = p.id AND pd.related_entity_type = 'property_legal'

  WHERE a.id = p_application_id
    AND (p_property_id IS NULL OR p.id = p_property_id)
    AND (p_guarantor_id IS NULL OR g.id = p_guarantor_id)

  GROUP BY
    a.id, a.application_characteristic_id, a.status, a.message, a.created_at,
    p.id, p.property_characteristic_id, p.address_street, p.address_number,
    p.address_department, p.address_commune, p.address_region, p.price_clp,
    p.common_expenses_clp, p.bedrooms, p.bathrooms, p.surface_m2,
    p.listing_type, p.description,
    prof_owner.id, prof_owner.first_name, prof_owner.paternal_last_name,
    prof_owner.maternal_last_name, prof_owner.rut, prof_owner.email,
    prof_owner.phone, prof_owner.profession,
    ro.id, ro.rental_owner_characteristic_id, ro.first_name, ro.paternal_last_name,
    ro.maternal_last_name, ro.rut, ro.phone, ro.email, ro.marital_status,
    ro.property_regime, ro.address_street, ro.address_number, ro.address_department,
    ro.address_commune, ro.address_region,
    so.id, so.sale_owner_characteristic_id, so.first_name, so.paternal_last_name,
    so.maternal_last_name, so.rut, so.phone, so.email, so.marital_status,
    so.property_regime, so.address_street, so.address_number, so.address_department,
    so.address_commune, so.address_region,
    prof_applicant.id, prof_applicant.first_name, prof_applicant.paternal_last_name,
    prof_applicant.maternal_last_name, prof_applicant.rut, prof_applicant.email,
    prof_applicant.phone, prof_applicant.profession, prof_applicant.marital_status,
    prof_applicant.property_regime, a.snapshot_applicant_monthly_income_clp,
    a.snapshot_applicant_address_street, a.snapshot_applicant_address_number,
    a.snapshot_applicant_address_department, a.snapshot_applicant_address_commune,
    a.snapshot_applicant_address_region,
    g.id, g.guarantor_characteristic_id, g.first_name, g.paternal_last_name,
    g.maternal_last_name, g.rut, g.profession, g.monthly_income_clp,
    g.address_street, g.address_number, g.address_department,
    g.address_commune, g.address_region,
    rcc.id, rcc.rental_contract_conditions_characteristic_id, rcc.lease_term_months,
    rcc.payment_day, rcc.final_price_clp, rcc.broker_commission_clp,
    rcc.guarantee_amount_clp, rcc.official_communication_email, rcc.accepts_pets,
    rcc.dicom_clause, rcc.additional_conditions;
END;
$$;

-- Drop and recreate contract_data_view with owner data
DROP VIEW IF EXISTS contract_data_view;
CREATE VIEW contract_data_view AS
SELECT
  -- Application data
  a.id as application_id,
  a.application_characteristic_id,
  a.status as application_status,
  a.message as application_message,
  a.created_at as application_created_at,

  -- Property data
  p.id as property_id,
  p.property_characteristic_id,
  CONCAT(p.address_street, ' ', p.address_number,
         CASE WHEN p.address_department IS NOT NULL THEN CONCAT(', Depto. ', p.address_department) ELSE '' END,
         ', ', p.address_commune, ', ', p.address_region) as property_full_address,
  p.price_clp as property_price_clp,
  p.common_expenses_clp as property_common_expenses_clp,
  p.bedrooms as property_bedrooms,
  p.bathrooms as property_bathrooms,
  p.surface_m2 as property_surface_m2,
  p.listing_type as property_listing_type,
  p.description as property_description,

  -- Current owner data (from profiles - for backward compatibility)
  prof_owner.id as owner_id,
  CONCAT(prof_owner.first_name, ' ', prof_owner.paternal_last_name,
         CASE WHEN prof_owner.maternal_last_name IS NOT NULL THEN CONCAT(' ', prof_owner.maternal_last_name) ELSE '' END) as owner_full_name,
  prof_owner.rut as owner_rut,
  prof_owner.email as owner_email,
  prof_owner.phone as owner_phone,
  prof_owner.profession as owner_profession,

  -- Rental owner data
  ro.id as rental_owner_id,
  ro.rental_owner_characteristic_id,
  CONCAT(ro.first_name, ' ', ro.paternal_last_name,
         CASE WHEN ro.maternal_last_name IS NOT NULL THEN CONCAT(' ', ro.maternal_last_name) ELSE '' END) as rental_owner_full_name,
  ro.rut as rental_owner_rut,
  ro.phone as rental_owner_phone,
  ro.email as rental_owner_email,
  ro.marital_status as rental_owner_marital_status,
  ro.property_regime as rental_owner_property_regime,
  CONCAT(ro.address_street, ' ', ro.address_number,
         CASE WHEN ro.address_department IS NOT NULL THEN CONCAT(', Depto. ', ro.address_department) ELSE '' END,
         ', ', ro.address_commune, ', ', ro.address_region) as rental_owner_full_address,

  -- Sale owner data
  so.id as sale_owner_id,
  so.sale_owner_characteristic_id,
  CONCAT(so.first_name, ' ', so.paternal_last_name,
         CASE WHEN so.maternal_last_name IS NOT NULL THEN CONCAT(' ', so.maternal_last_name) ELSE '' END) as sale_owner_full_name,
  so.rut as sale_owner_rut,
  so.phone as sale_owner_phone,
  so.email as sale_owner_email,
  so.marital_status as sale_owner_marital_status,
  so.property_regime as sale_owner_property_regime,
  CONCAT(so.address_street, ' ', so.address_number,
         CASE WHEN so.address_department IS NOT NULL THEN CONCAT(', Depto. ', so.address_department) ELSE '' END,
         ', ', so.address_commune, ', ', so.address_region) as sale_owner_full_address,

  -- Applicant data
  prof_applicant.id as applicant_id,
  CONCAT(prof_applicant.first_name, ' ', prof_applicant.paternal_last_name,
         CASE WHEN prof_applicant.maternal_last_name IS NOT NULL THEN CONCAT(' ', prof_applicant.maternal_last_name) ELSE '' END) as applicant_full_name,
  prof_applicant.rut as applicant_rut,
  prof_applicant.email as applicant_email,
  prof_applicant.phone as applicant_phone,
  prof_applicant.profession as applicant_profession,
  prof_applicant.marital_status as applicant_marital_status,
  prof_applicant.property_regime as applicant_property_regime,
  a.snapshot_applicant_monthly_income_clp as applicant_monthly_income_clp,
  CONCAT(a.snapshot_applicant_address_street, ' ', a.snapshot_applicant_address_number,
         CASE WHEN a.snapshot_applicant_address_department IS NOT NULL THEN CONCAT(', Depto. ', a.snapshot_applicant_address_department) ELSE '' END,
         ', ', a.snapshot_applicant_address_commune, ', ', a.snapshot_applicant_address_region) as applicant_full_address,

  -- Guarantor data
  g.id as guarantor_id,
  g.guarantor_characteristic_id,
  CONCAT(g.first_name, ' ', g.paternal_last_name,
         CASE WHEN g.maternal_last_name IS NOT NULL THEN CONCAT(' ', g.maternal_last_name) ELSE '' END) as guarantor_full_name,
  g.rut as guarantor_rut,
  g.profession as guarantor_profession,
  g.monthly_income_clp as guarantor_monthly_income_clp,
  CONCAT(g.address_street, ' ', g.address_number,
         CASE WHEN g.address_department IS NOT NULL THEN CONCAT(', Depto. ', g.address_department) ELSE '' END,
         ', ', g.address_commune, ', ', g.address_region) as guarantor_full_address

FROM applications a
INNER JOIN properties p ON a.property_id = p.id
INNER JOIN profiles prof_owner ON p.owner_id = prof_owner.id
INNER JOIN profiles prof_applicant ON a.applicant_id = prof_applicant.id
LEFT JOIN rental_owners ro ON p.id = ro.property_id
LEFT JOIN sale_owners so ON p.id = so.property_id
LEFT JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.status = 'aprobada';

-- =====================================================
-- STEP 3: ADD INDEXES FOR OWNER TABLES
-- =====================================================

-- Add indexes for contract queries with owners
CREATE INDEX IF NOT EXISTS idx_contract_rental_owner ON rental_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_contract_sale_owner ON sale_owners(property_id);

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for new data access
GRANT SELECT ON rental_owners TO anon, authenticated;
GRANT SELECT ON sale_owners TO anon, authenticated;

-- Grant execute permissions for updated functions
GRANT EXECUTE ON FUNCTION get_contract_data_by_characteristic_ids(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_contract_data_by_uuids(uuid, uuid, uuid) TO anon, authenticated;

-- Grant select permissions for updated view
GRANT SELECT ON contract_data_view TO anon, authenticated;

-- =====================================================
-- STEP 5: ADD COMMENTS
-- =====================================================

COMMENT ON TABLE rental_owners IS 'Specific owner information for rental properties with characteristic IDs for N8N automation';
COMMENT ON TABLE sale_owners IS 'Specific owner information for sale properties with characteristic IDs for N8N automation';
COMMENT ON COLUMN rental_owners.rental_owner_characteristic_id IS 'Unique characteristic ID for rental owner data in webhooks';
COMMENT ON COLUMN sale_owners.sale_owner_characteristic_id IS 'Unique characteristic ID for sale owner data in webhooks';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Rental and Sale Owners added to contract functions!';
  RAISE NOTICE '✅ Characteristic IDs added to owner tables';
  RAISE NOTICE '✅ Contract functions updated with complete owner data';
  RAISE NOTICE '✅ N8N now has access to rental_owners and sale_owners data';
END $$;
