/*
  # Clean IDs and Create Contract Functions for N8N Automation

  This migration cleans up redundant ID columns and creates optimized functions
  for N8N automation to efficiently retrieve contract data.

  ## Changes Made:
  1. **Remove redundant receiver_id columns** - These were duplicating existing relationships
  2. **Create optimized contract functions** - Single queries to get all contract data
  3. **Create contract views** - Pre-joined views for efficient lookups
  4. **Update RLS policies** - Remove receiver_id references

  ## Contract Data Functions:
  - get_contract_data_by_characteristic_ids() - Main function for N8N
  - get_contract_data_by_uuids() - Fallback function
  - contract_data_view - View with all contract information

  ## Purpose:
  - Simplify ID structure for webhook processing
  - Enable efficient single-query contract data retrieval
  - Reduce database costs for N8N automation
  - Maintain data integrity and security
*/

-- =====================================================
-- STEP 1: REMOVE REDUNDANT RECEIVER_ID COLUMNS
-- =====================================================

-- 1.1 Drop RLS policies that depend on receiver_id FIRST (only if they exist)
DO $$
BEGIN
    -- Properties policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Users can view own properties') THEN
        DROP POLICY "Users can view own properties" ON properties;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Users can insert own properties') THEN
        DROP POLICY "Users can insert own properties" ON properties;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Users can update own properties') THEN
        DROP POLICY "Users can update own properties" ON properties;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Users can delete own properties') THEN
        DROP POLICY "Users can delete own properties" ON properties;
    END IF;

    -- Applications policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can view their own applications') THEN
        DROP POLICY "Users can view their own applications" ON applications;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can create applications') THEN
        DROP POLICY "Users can create applications" ON applications;
    END IF;

    -- Offers policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'offers' AND policyname = 'Users can view their own offers') THEN
        DROP POLICY "Users can view their own offers" ON offers;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'offers' AND policyname = 'Users can create offers') THEN
        DROP POLICY "Users can create offers" ON offers;
    END IF;

    -- Guarantors policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guarantors' AND policyname = 'Users can view guarantors for their applications') THEN
        DROP POLICY "Users can view guarantors for their applications" ON guarantors;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guarantors' AND policyname = 'Users can insert guarantors') THEN
        DROP POLICY "Users can insert guarantors" ON guarantors;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guarantors' AND policyname = 'Users can update guarantors for their applications') THEN
        DROP POLICY "Users can update guarantors for their applications" ON guarantors;
    END IF;

    -- Documents policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Users can view their own documents') THEN
        DROP POLICY "Users can view their own documents" ON documents;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Users can insert their own documents') THEN
        DROP POLICY "Users can insert their own documents" ON documents;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Users can update their own documents') THEN
        DROP POLICY "Users can update their own documents" ON documents;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Users can delete their own documents') THEN
        DROP POLICY "Users can delete their own documents" ON documents;
    END IF;

    -- Property images policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'property_images' AND policyname = 'Property owners can manage images for their properties') THEN
        DROP POLICY "Property owners can manage images for their properties" ON property_images;
    END IF;

    -- User favorites policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_favorites' AND policyname = 'Users can view their own favorites') THEN
        DROP POLICY "Users can view their own favorites" ON user_favorites;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_favorites' AND policyname = 'Users can add properties to favorites') THEN
        DROP POLICY "Users can add properties to favorites" ON user_favorites;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_favorites' AND policyname = 'Users can remove properties from favorites') THEN
        DROP POLICY "Users can remove properties from favorites" ON user_favorites;
    END IF;

    RAISE NOTICE 'Dropped all existing policies that might reference receiver_id';
END $$;

-- 1.2 Drop indexes for receiver_id columns (only if they exist)
DROP INDEX IF EXISTS idx_properties_receiver_id;
DROP INDEX IF EXISTS idx_applications_receiver_id;
DROP INDEX IF EXISTS idx_offers_receiver_id;
DROP INDEX IF EXISTS idx_guarantors_receiver_id;
DROP INDEX IF EXISTS idx_documents_receiver_id;
DROP INDEX IF EXISTS idx_property_images_receiver_id;
DROP INDEX IF EXISTS idx_user_favorites_receiver_id;

-- 1.3 Drop triggers that maintain receiver_id consistency (only if they exist)
DROP TRIGGER IF EXISTS trigger_maintain_properties_receiver_id ON properties;
DROP TRIGGER IF EXISTS trigger_maintain_applications_receiver_id ON applications;
DROP TRIGGER IF EXISTS trigger_maintain_offers_receiver_id ON offers;
DROP TRIGGER IF EXISTS trigger_maintain_guarantors_receiver_id ON guarantors;
DROP TRIGGER IF EXISTS trigger_maintain_documents_receiver_id ON documents;
DROP TRIGGER IF EXISTS trigger_maintain_property_images_receiver_id ON property_images;
DROP TRIGGER IF EXISTS trigger_maintain_user_favorites_receiver_id ON user_favorites;

-- 1.4 Drop the maintain_receiver_id_consistency function (only if it exists)
DROP FUNCTION IF EXISTS maintain_receiver_id_consistency();

-- 1.5 Remove receiver_id columns from all tables (only if they exist)
DO $$
DECLARE
    current_table text;
    tables_to_check text[] := ARRAY['properties', 'applications', 'offers', 'guarantors', 'documents', 'property_images', 'user_favorites'];
BEGIN
    FOREACH current_table IN ARRAY tables_to_check
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = current_table
            AND column_name = 'receiver_id'
        ) THEN
            EXECUTE 'ALTER TABLE ' || current_table || ' DROP COLUMN receiver_id';
            RAISE NOTICE 'Dropped receiver_id column from table %', current_table;
        ELSE
            RAISE NOTICE 'receiver_id column does not exist in table %', current_table;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: CREATE CONTRACT DATA FUNCTIONS
-- =====================================================

-- Main function for N8N automation - get contract data by characteristic IDs
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

  -- Owner data
  owner_id uuid,
  owner_first_name text,
  owner_paternal_last_name text,
  owner_maternal_last_name text,
  owner_rut varchar(12),
  owner_email varchar(255),
  owner_phone varchar(20),
  owner_profession text,

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
  property_documents jsonb
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

    -- Owner data
    prof_owner.id as owner_id,
    prof_owner.first_name as owner_first_name,
    prof_owner.paternal_last_name as owner_paternal_last_name,
    prof_owner.maternal_last_name as owner_maternal_last_name,
    prof_owner.rut as owner_rut,
    prof_owner.email as owner_email,
    prof_owner.phone as owner_phone,
    prof_owner.profession as owner_profession,

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
    ) as property_documents

  FROM applications a
  INNER JOIN properties p ON a.property_id = p.id
  INNER JOIN profiles prof_owner ON p.owner_id = prof_owner.id
  INNER JOIN profiles prof_applicant ON a.applicant_id = prof_applicant.id
  LEFT JOIN guarantors g ON a.guarantor_id = g.id

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
    g.address_commune, g.address_region;
END;
$$;

-- Fallback function using UUIDs (for backward compatibility)
CREATE OR REPLACE FUNCTION get_contract_data_by_uuids(
  p_application_id uuid,
  p_property_id uuid DEFAULT NULL,
  p_guarantor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  -- Same structure as above
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
  property_documents jsonb
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

    -- Owner data
    prof_owner.id as owner_id,
    prof_owner.first_name as owner_first_name,
    prof_owner.paternal_last_name as owner_paternal_last_name,
    prof_owner.maternal_last_name as owner_maternal_last_name,
    prof_owner.rut as owner_rut,
    prof_owner.email as owner_email,
    prof_owner.phone as owner_phone,
    prof_owner.profession as owner_profession,

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
    ) as property_documents

  FROM applications a
  INNER JOIN properties p ON a.property_id = p.id
  INNER JOIN profiles prof_owner ON p.owner_id = prof_owner.id
  INNER JOIN profiles prof_applicant ON a.applicant_id = prof_applicant.id
  LEFT JOIN guarantors g ON a.guarantor_id = g.id

  -- Property images
  LEFT JOIN property_images pi ON p.id = pi.property_id

  -- Application documents
  LEFT JOIN documents ad ON ad.related_entity_id = a.id AND ad.related_entity_type = 'application_applicant'

  -- Property documents
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
    g.address_commune, g.address_region;
END;
$$;

-- =====================================================
-- STEP 3: CREATE CONTRACT VIEW FOR QUICK LOOKUPS
-- =====================================================

CREATE OR REPLACE VIEW contract_data_view AS
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

  -- Owner data
  prof_owner.id as owner_id,
  CONCAT(prof_owner.first_name, ' ', prof_owner.paternal_last_name,
         CASE WHEN prof_owner.maternal_last_name IS NOT NULL THEN CONCAT(' ', prof_owner.maternal_last_name) ELSE '' END) as owner_full_name,
  prof_owner.rut as owner_rut,
  prof_owner.email as owner_email,
  prof_owner.phone as owner_phone,
  prof_owner.profession as owner_profession,

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
LEFT JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.status = 'aprobada';

-- =====================================================
-- STEP 1.6: RECREATE RLS POLICIES WITHOUT RECEIVER_ID
-- =====================================================

-- Recreate properties policies without receiver_id
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Recreate applications policies without receiver_id
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Recreate offers policies without receiver_id
CREATE POLICY "Users can view their own offers"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = offerer_id);

CREATE POLICY "Users can create offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = offerer_id);

-- Recreate guarantors policies without receiver_id
CREATE POLICY "Users can view guarantors for their applications"
  ON guarantors FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications
      WHERE applicant_id = auth.uid() OR property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert guarantors"
  ON guarantors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update guarantors for their applications"
  ON guarantors FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications WHERE applicant_id = auth.uid()
    )
  );

-- Recreate documents policies without receiver_id
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = uploader_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploader_id)
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = uploader_id);

-- Recreate property_images policies without receiver_id
CREATE POLICY "Property owners can manage images for their properties"
  ON property_images FOR ALL
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

-- Recreate user_favorites policies without receiver_id
CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add properties to favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove properties from favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: CREATE INDEXES FOR CONTRACT FUNCTIONS
-- =====================================================

-- Index for contract data lookups by characteristic IDs
CREATE INDEX IF NOT EXISTS idx_contract_application_characteristic ON applications(application_characteristic_id) WHERE status = 'aprobada';
CREATE INDEX IF NOT EXISTS idx_contract_property_characteristic ON properties(property_characteristic_id);
CREATE INDEX IF NOT EXISTS idx_contract_guarantor_characteristic ON guarantors(guarantor_characteristic_id);

-- Composite indexes for efficient joins
CREATE INDEX IF NOT EXISTS idx_applications_property_applicant ON applications(property_id, applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_guarantor ON applications(guarantor_id);

-- =====================================================
-- STEP 6: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_contract_data_by_characteristic_ids(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_contract_data_by_uuids(uuid, uuid, uuid) TO anon, authenticated;

-- Grant permissions for contract view
GRANT SELECT ON contract_data_view TO anon, authenticated;

-- =====================================================
-- STEP 7: UPDATE COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_contract_data_by_characteristic_ids(text, text, text) IS 'Optimized function for N8N automation - retrieves complete contract data using characteristic IDs';
COMMENT ON FUNCTION get_contract_data_by_uuids(uuid, uuid, uuid) IS 'Fallback function for backward compatibility - retrieves contract data using UUIDs';
COMMENT ON VIEW contract_data_view IS 'Pre-joined view of approved applications with complete contract information';

-- =====================================================
-- STEP 8: CLEANUP - REMOVE OLD COMMENTS
-- =====================================================

-- Comments for characteristic_id columns (receiver_id columns have been removed)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Contract functions and cleaned ID structure created successfully!';
  RAISE NOTICE 'Removed redundant receiver_id columns from all tables';
  RAISE NOTICE 'Created get_contract_data_by_characteristic_ids() for N8N automation';
  RAISE NOTICE 'Created get_contract_data_by_uuids() for backward compatibility';
  RAISE NOTICE 'Created contract_data_view for efficient lookups';
  RAISE NOTICE 'Updated RLS policies to remove receiver_id references';
  RAISE NOTICE 'Added strategic indexes for contract data queries';
END $$;
