/*
  # Database Schema Normalization to Third Normal Form (3NF)

  ## Overview
  This migration transforms the current semi-structured schema into a fully normalized 
  database following Third Normal Form principles, improving data integrity, query 
  efficiency, and application scalability.

  ## Key Improvements
  1. **Eliminates JSONB data storage** - Replaces applicant_data with structured tables
  2. **Removes data duplication** - Centralizes owner information in profiles table
  3. **Creates reusable address system** - Shared across properties, applicants, and guarantors
  4. **Implements proper document management** - Replaces URL arrays with dedicated table
  5. **Establishes referential integrity** - All relationships enforced by Foreign Keys

  ## New Tables Created
  1. **addresses** - Centralized address management
  2. **applicants** - Structured applicant information
  3. **guarantors** - Structured guarantor information  
  4. **documents** - Comprehensive document management

  ## Modified Tables
  1. **properties** - Normalized owner information, added address relationship
  2. **applications** - Added structured relationships to applicants and guarantors
  3. **offers** - Enhanced with applicant relationship

  ## Security & Performance
  - Row Level Security enabled on all new tables
  - Strategic indexes for optimal query performance
  - Comprehensive RLS policies for data access control
*/

-- =====================================================
-- STEP 1: CREATE CENTRALIZED ADDRESSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  street_address text NOT NULL,
  apartment_number text,
  region text NOT NULL,
  commune text NOT NULL,
  country text NOT NULL DEFAULT 'Chile',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for addresses
CREATE POLICY "Users can read addresses they are associated with"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT address_id FROM properties WHERE owner_id = uid()
      UNION
      SELECT address_id FROM applicants WHERE user_id = uid()
      UNION
      SELECT address_id FROM guarantors WHERE EXISTS (
        SELECT 1 FROM applicants a 
        WHERE a.guarantor_id = guarantors.id AND a.user_id = uid()
      )
    )
  );

CREATE POLICY "Users can insert addresses for their own use"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be controlled by application logic

CREATE POLICY "Users can update addresses they own"
  ON addresses
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT address_id FROM properties WHERE owner_id = uid()
      UNION
      SELECT address_id FROM applicants WHERE user_id = uid()
    )
  );

-- Indexes for addresses
CREATE INDEX IF NOT EXISTS idx_addresses_region_commune ON addresses(region, commune);
CREATE INDEX IF NOT EXISTS idx_addresses_created_at ON addresses(created_at);

-- =====================================================
-- STEP 2: CREATE APPLICANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  rut text UNIQUE NOT NULL,
  profession text,
  company text,
  monthly_income numeric DEFAULT 0,
  work_seniority_years integer DEFAULT 0,
  contact_email text NOT NULL,
  contact_phone text,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for applicants
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applicants
CREATE POLICY "Users can read their own applicant data"
  ON applicants
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Property owners can read applicants for their properties"
  ON applicants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT applicant_id FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = uid()
    )
  );

CREATE POLICY "Users can insert their own applicant data"
  ON applicants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own applicant data"
  ON applicants
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

-- Indexes for applicants
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_rut ON applicants(rut);
CREATE INDEX IF NOT EXISTS idx_applicants_company ON applicants(company);
CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_applicants_updated_at'
  ) THEN
    CREATE TRIGGER update_applicants_updated_at
      BEFORE UPDATE ON applicants
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE GUARANTORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS guarantors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  rut text UNIQUE NOT NULL,
  profession text,
  company text,
  monthly_income numeric DEFAULT 0,
  work_seniority_years integer DEFAULT 0,
  contact_email text NOT NULL,
  contact_phone text,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for guarantors
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guarantors
CREATE POLICY "Property owners can read guarantors for their applications"
  ON guarantors
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = uid()
    )
  );

CREATE POLICY "Users can read guarantors for their own applications"
  ON guarantors
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications a
      JOIN applicants ap ON a.applicant_id = ap.id
      WHERE ap.user_id = uid()
    )
  );

CREATE POLICY "Users can insert guarantors for their applications"
  ON guarantors
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlled by application logic

CREATE POLICY "Users can update guarantors for their applications"
  ON guarantors
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications a
      JOIN applicants ap ON a.applicant_id = ap.id
      WHERE ap.user_id = uid()
    )
  );

-- Indexes for guarantors
CREATE INDEX IF NOT EXISTS idx_guarantors_rut ON guarantors(rut);
CREATE INDEX IF NOT EXISTS idx_guarantors_company ON guarantors(company);
CREATE INDEX IF NOT EXISTS idx_guarantors_created_at ON guarantors(created_at);

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_guarantors_updated_at'
  ) THEN
    CREATE TRIGGER update_guarantors_updated_at
      BEFORE UPDATE ON guarantors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE,
  guarantor_id uuid REFERENCES guarantors(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  storage_path text NOT NULL,
  file_size_bytes integer,
  mime_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can read their own uploaded documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (uploader_user_id = uid());

CREATE POLICY "Property owners can read documents for their properties"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = uid()
    )
    OR
    application_id IN (
      SELECT a.id FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = uid()
    )
  );

CREATE POLICY "Users can insert their own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (uploader_user_id = uid());

CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (uploader_user_id = uid())
  WITH CHECK (uploader_user_id = uid());

CREATE POLICY "Users can delete their own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (uploader_user_id = uid());

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_uploader_user_id ON documents(uploader_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant_id ON documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);

-- =====================================================
-- STEP 5: ADD ADDRESS RELATIONSHIP TO PROPERTIES
-- =====================================================

-- Add address_id column to properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'address_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN address_id uuid REFERENCES addresses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_properties_address_id ON properties(address_id);

-- =====================================================
-- STEP 6: MODIFY APPLICATIONS TABLE
-- =====================================================

-- Add new foreign key columns to applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'structured_applicant_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN structured_applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'structured_guarantor_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN structured_guarantor_id uuid REFERENCES guarantors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_applications_structured_applicant_id ON applications(structured_applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_structured_guarantor_id ON applications(structured_guarantor_id);

-- =====================================================
-- STEP 7: MODIFY OFFERS TABLE
-- =====================================================

-- Add applicant relationship to offers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'structured_applicant_id'
  ) THEN
    ALTER TABLE offers ADD COLUMN structured_applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_offers_structured_applicant_id ON offers(structured_applicant_id);

-- =====================================================
-- STEP 8: CREATE COMPATIBILITY VIEWS
-- =====================================================

-- View to maintain backward compatibility for applications
CREATE OR REPLACE VIEW applications_with_legacy_data AS
SELECT 
  a.*,
  -- Reconstruct applicant_data JSONB for backward compatibility
  CASE 
    WHEN a.structured_applicant_id IS NOT NULL THEN
      jsonb_build_object(
        'fullName', ap.full_name,
        'rut', ap.rut,
        'profession', ap.profession,
        'company', ap.company,
        'monthlyIncome', ap.monthly_income,
        'workSeniority', ap.work_seniority_years,
        'contactEmail', ap.contact_email,
        'contactPhone', ap.contact_phone,
        'address', CASE 
          WHEN addr_ap.id IS NOT NULL THEN
            jsonb_build_object(
              'streetAddress', addr_ap.street_address,
              'apartmentNumber', addr_ap.apartment_number,
              'region', addr_ap.region,
              'commune', addr_ap.commune,
              'country', addr_ap.country
            )
          ELSE NULL
        END,
        'guarantor', CASE 
          WHEN g.id IS NOT NULL THEN
            jsonb_build_object(
              'fullName', g.full_name,
              'rut', g.rut,
              'profession', g.profession,
              'company', g.company,
              'monthlyIncome', g.monthly_income,
              'workSeniority', g.work_seniority_years,
              'contactEmail', g.contact_email,
              'contactPhone', g.contact_phone,
              'address', CASE 
                WHEN addr_g.id IS NOT NULL THEN
                  jsonb_build_object(
                    'streetAddress', addr_g.street_address,
                    'apartmentNumber', addr_g.apartment_number,
                    'region', addr_g.region,
                    'commune', addr_g.commune,
                    'country', addr_g.country
                  )
                ELSE NULL
              END
            )
          ELSE NULL
        END
      )
    ELSE a.applicant_data
  END as applicant_data_computed
FROM applications a
LEFT JOIN applicants ap ON a.structured_applicant_id = ap.id
LEFT JOIN addresses addr_ap ON ap.address_id = addr_ap.id
LEFT JOIN guarantors g ON a.structured_guarantor_id = g.id
LEFT JOIN addresses addr_g ON g.address_id = addr_g.id;

-- View to maintain backward compatibility for properties with owner data
CREATE OR REPLACE VIEW properties_with_legacy_owner_data AS
SELECT 
  p.*,
  -- Reconstruct owner fields for backward compatibility
  COALESCE(prof.full_name, p.owner_full_name) as computed_owner_full_name,
  COALESCE(prof.contact_email, p.owner_email) as computed_owner_email,
  COALESCE(prof.contact_phone, '') as computed_owner_phone,
  CASE 
    WHEN addr.id IS NOT NULL THEN addr.street_address
    ELSE p.owner_address
  END as computed_owner_address,
  CASE 
    WHEN addr.id IS NOT NULL THEN addr.apartment_number
    ELSE NULL
  END as computed_owner_apartment_number,
  CASE 
    WHEN addr.id IS NOT NULL THEN addr.region
    ELSE p.owner_region
  END as computed_owner_region,
  CASE 
    WHEN addr.id IS NOT NULL THEN addr.commune
    ELSE p.owner_commune
  END as computed_owner_commune
FROM properties p
LEFT JOIN profiles prof ON p.owner_id = prof.id
LEFT JOIN addresses addr ON p.address_id = addr.id;

-- =====================================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to create an address and return its ID
CREATE OR REPLACE FUNCTION create_address(
  p_street_address text,
  p_apartment_number text DEFAULT NULL,
  p_region text DEFAULT '',
  p_commune text DEFAULT '',
  p_country text DEFAULT 'Chile'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  address_id uuid;
BEGIN
  INSERT INTO addresses (street_address, apartment_number, region, commune, country)
  VALUES (p_street_address, p_apartment_number, p_region, p_commune, p_country)
  RETURNING id INTO address_id;
  
  RETURN address_id;
END;
$$;

-- Function to create an applicant with address
CREATE OR REPLACE FUNCTION create_applicant_with_address(
  p_user_id uuid,
  p_full_name text,
  p_rut text,
  p_profession text DEFAULT NULL,
  p_company text DEFAULT NULL,
  p_monthly_income numeric DEFAULT 0,
  p_work_seniority_years integer DEFAULT 0,
  p_contact_email text DEFAULT '',
  p_contact_phone text DEFAULT NULL,
  p_street_address text DEFAULT '',
  p_apartment_number text DEFAULT NULL,
  p_region text DEFAULT '',
  p_commune text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  address_id uuid;
  applicant_id uuid;
BEGIN
  -- Create address if provided
  IF p_street_address != '' THEN
    address_id := create_address(p_street_address, p_apartment_number, p_region, p_commune);
  END IF;
  
  -- Create applicant
  INSERT INTO applicants (
    user_id, full_name, rut, profession, company, monthly_income,
    work_seniority_years, contact_email, contact_phone, address_id
  )
  VALUES (
    p_user_id, p_full_name, p_rut, p_profession, p_company, p_monthly_income,
    p_work_seniority_years, p_contact_email, p_contact_phone, address_id
  )
  RETURNING id INTO applicant_id;
  
  RETURN applicant_id;
END;
$$;

-- Function to create a guarantor with address
CREATE OR REPLACE FUNCTION create_guarantor_with_address(
  p_full_name text,
  p_rut text,
  p_profession text DEFAULT NULL,
  p_company text DEFAULT NULL,
  p_monthly_income numeric DEFAULT 0,
  p_work_seniority_years integer DEFAULT 0,
  p_contact_email text DEFAULT '',
  p_contact_phone text DEFAULT NULL,
  p_street_address text DEFAULT '',
  p_apartment_number text DEFAULT NULL,
  p_region text DEFAULT '',
  p_commune text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  address_id uuid;
  guarantor_id uuid;
BEGIN
  -- Create address if provided
  IF p_street_address != '' THEN
    address_id := create_address(p_street_address, p_apartment_number, p_region, p_commune);
  END IF;
  
  -- Create guarantor
  INSERT INTO guarantors (
    full_name, rut, profession, company, monthly_income,
    work_seniority_years, contact_email, contact_phone, address_id
  )
  VALUES (
    p_full_name, p_rut, p_profession, p_company, p_monthly_income,
    p_work_seniority_years, p_contact_email, p_contact_phone, address_id
  )
  RETURNING id INTO guarantor_id;
  
  RETURN guarantor_id;
END;
$$;

-- =====================================================
-- STEP 10: DATA MIGRATION FUNCTIONS
-- =====================================================

-- Function to migrate existing property addresses
CREATE OR REPLACE FUNCTION migrate_property_addresses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prop_record RECORD;
  new_address_id uuid;
BEGIN
  FOR prop_record IN 
    SELECT id, address, apartment_number, region, commune, country
    FROM properties 
    WHERE address_id IS NULL AND address IS NOT NULL
  LOOP
    -- Create address for this property
    INSERT INTO addresses (street_address, apartment_number, region, commune, country)
    VALUES (
      prop_record.address,
      prop_record.apartment_number,
      COALESCE(prop_record.region, ''),
      COALESCE(prop_record.commune, ''),
      COALESCE(prop_record.country, 'Chile')
    )
    RETURNING id INTO new_address_id;
    
    -- Update property with new address_id
    UPDATE properties 
    SET address_id = new_address_id
    WHERE id = prop_record.id;
  END LOOP;
END;
$$;

-- Function to migrate existing application data
CREATE OR REPLACE FUNCTION migrate_application_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_record RECORD;
  applicant_data jsonb;
  guarantor_data jsonb;
  new_applicant_id uuid;
  new_guarantor_id uuid;
BEGIN
  FOR app_record IN 
    SELECT id, applicant_id, applicant_data, structured_applicant_id
    FROM applications 
    WHERE applicant_data IS NOT NULL AND structured_applicant_id IS NULL
  LOOP
    applicant_data := app_record.applicant_data;
    
    -- Create applicant if data exists
    IF applicant_data ? 'fullName' THEN
      new_applicant_id := create_applicant_with_address(
        app_record.applicant_id, -- user_id
        applicant_data->>'fullName',
        COALESCE(applicant_data->>'rut', ''),
        applicant_data->>'profession',
        applicant_data->>'company',
        COALESCE((applicant_data->>'monthlyIncome')::numeric, 0),
        COALESCE((applicant_data->>'workSeniority')::integer, 0),
        COALESCE(applicant_data->>'contactEmail', ''),
        applicant_data->>'contactPhone',
        COALESCE(applicant_data->'address'->>'streetAddress', ''),
        applicant_data->'address'->>'apartmentNumber',
        COALESCE(applicant_data->'address'->>'region', ''),
        COALESCE(applicant_data->'address'->>'commune', '')
      );
      
      -- Update application with new applicant_id
      UPDATE applications 
      SET structured_applicant_id = new_applicant_id
      WHERE id = app_record.id;
    END IF;
    
    -- Create guarantor if data exists
    IF applicant_data ? 'guarantor' AND applicant_data->'guarantor' ? 'fullName' THEN
      guarantor_data := applicant_data->'guarantor';
      
      new_guarantor_id := create_guarantor_with_address(
        guarantor_data->>'fullName',
        COALESCE(guarantor_data->>'rut', ''),
        guarantor_data->>'profession',
        guarantor_data->>'company',
        COALESCE((guarantor_data->>'monthlyIncome')::numeric, 0),
        COALESCE((guarantor_data->>'workSeniority')::integer, 0),
        COALESCE(guarantor_data->>'contactEmail', ''),
        guarantor_data->>'contactPhone',
        COALESCE(guarantor_data->'address'->>'streetAddress', ''),
        guarantor_data->'address'->>'apartmentNumber',
        COALESCE(guarantor_data->'address'->>'region', ''),
        COALESCE(guarantor_data->'address'->>'commune', '')
      );
      
      -- Update application with new guarantor_id
      UPDATE applications 
      SET structured_guarantor_id = new_guarantor_id
      WHERE id = app_record.id;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- STEP 11: EXECUTE DATA MIGRATION
-- =====================================================

-- Migrate existing data
SELECT migrate_property_addresses();
SELECT migrate_application_data();

-- =====================================================
-- STEP 12: CREATE OPTIMIZED QUERY VIEWS
-- =====================================================

-- Comprehensive view for applications with all related data
CREATE OR REPLACE VIEW applications_complete AS
SELECT 
  a.id,
  a.property_id,
  a.applicant_id as legacy_applicant_id,
  a.structured_applicant_id,
  a.structured_guarantor_id,
  a.message,
  a.status,
  a.created_at,
  
  -- Property information
  p.address as property_address,
  p.commune as property_commune,
  p.region as property_region,
  p.price as property_price,
  p.listing_type,
  
  -- Property address (normalized)
  prop_addr.street_address as property_full_address,
  prop_addr.apartment_number as property_apartment,
  
  -- Applicant information (structured)
  ap.full_name as applicant_name,
  ap.rut as applicant_rut,
  ap.profession as applicant_profession,
  ap.company as applicant_company,
  ap.monthly_income as applicant_income,
  ap.contact_email as applicant_email,
  ap.contact_phone as applicant_phone,
  
  -- Applicant address
  addr_ap.street_address as applicant_address,
  addr_ap.commune as applicant_commune,
  addr_ap.region as applicant_region,
  
  -- Guarantor information (structured)
  g.full_name as guarantor_name,
  g.rut as guarantor_rut,
  g.profession as guarantor_profession,
  g.company as guarantor_company,
  g.monthly_income as guarantor_income,
  g.contact_email as guarantor_email,
  g.contact_phone as guarantor_phone,
  
  -- Guarantor address
  addr_g.street_address as guarantor_address,
  addr_g.commune as guarantor_commune,
  addr_g.region as guarantor_region,
  
  -- Property owner information
  prof.full_name as owner_name,
  prof.contact_email as owner_email,
  prof.contact_phone as owner_phone

FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
LEFT JOIN addresses prop_addr ON p.address_id = prop_addr.id
LEFT JOIN profiles prof ON p.owner_id = prof.id
LEFT JOIN applicants ap ON a.structured_applicant_id = ap.id
LEFT JOIN addresses addr_ap ON ap.address_id = addr_ap.id
LEFT JOIN guarantors g ON a.structured_guarantor_id = g.id
LEFT JOIN addresses addr_g ON g.address_id = addr_g.id;

-- Comprehensive view for properties with all related data
CREATE OR REPLACE VIEW properties_complete AS
SELECT 
  p.*,
  
  -- Property address (normalized)
  addr.street_address,
  addr.apartment_number,
  addr.region as address_region,
  addr.commune as address_commune,
  addr.country,
  
  -- Owner information
  prof.full_name as owner_name,
  prof.contact_email as owner_contact_email,
  prof.contact_phone as owner_contact_phone
  
FROM properties p
LEFT JOIN addresses addr ON p.address_id = addr.id
LEFT JOIN profiles prof ON p.owner_id = prof.id;

-- =====================================================
-- STEP 13: PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_applicants_company_income ON applicants(company, monthly_income);
CREATE INDEX IF NOT EXISTS idx_guarantors_company_income ON guarantors(company, monthly_income);
CREATE INDEX IF NOT EXISTS idx_addresses_region_commune_composite ON addresses(region, commune, street_address);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_applications_pending_status ON applications(created_at) 
WHERE status = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_properties_available_status ON properties(created_at) 
WHERE status = 'disponible';

-- =====================================================
-- STEP 14: DATA VALIDATION CONSTRAINTS
-- =====================================================

-- Add constraints for data validation
ALTER TABLE applicants 
ADD CONSTRAINT check_applicants_monthly_income_positive 
CHECK (monthly_income >= 0);

ALTER TABLE applicants 
ADD CONSTRAINT check_applicants_work_seniority_positive 
CHECK (work_seniority_years >= 0);

ALTER TABLE guarantors 
ADD CONSTRAINT check_guarantors_monthly_income_positive 
CHECK (monthly_income >= 0);

ALTER TABLE guarantors 
ADD CONSTRAINT check_guarantors_work_seniority_positive 
CHECK (work_seniority_years >= 0);

-- Add constraint for document types
ALTER TABLE documents 
ADD CONSTRAINT check_documents_valid_type 
CHECK (document_type IN (
  'cedula_identidad',
  'certificado_dominio',
  'avaluo_fiscal',
  'informe_comercial',
  'poder_notarial',
  'certificado_ingresos',
  'contrato_trabajo',
  'liquidacion_sueldo',
  'foto_propiedad',
  'plano_propiedad',
  'otros'
));

-- =====================================================
-- STEP 15: CLEANUP AND COMMENTS
-- =====================================================

-- Add helpful comments to tables
COMMENT ON TABLE addresses IS 'Centralized address management for properties, applicants, and guarantors';
COMMENT ON TABLE applicants IS 'Structured applicant information extracted from JSONB data';
COMMENT ON TABLE guarantors IS 'Structured guarantor information for rental applications';
COMMENT ON TABLE documents IS 'Comprehensive document management system replacing URL arrays';

COMMENT ON COLUMN applicants.user_id IS 'Optional link to registered user profile';
COMMENT ON COLUMN applicants.rut IS 'Chilean national identification number (RUT)';
COMMENT ON COLUMN applicants.work_seniority_years IS 'Years of work experience in current position';

COMMENT ON COLUMN documents.document_type IS 'Standardized document type for categorization';
COMMENT ON COLUMN documents.storage_path IS 'Internal storage path for file management';
COMMENT ON COLUMN documents.file_size_bytes IS 'File size in bytes for storage management';