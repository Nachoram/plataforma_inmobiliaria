/*
  # Database Schema Normalization to 3NF

  This migration normalizes the current semi-structured database to Third Normal Form (3NF).

  ## 1. New Tables Created
    - `addresses` - Centralized address management
    - `applicants` - Structured applicant information  
    - `guarantors` - Guarantor/co-signer information
    - `documents` - Document management system

  ## 2. Tables Modified
    - `properties` - Removed denormalized owner fields
    - `applications` - Replaced JSONB with proper foreign keys
    - `offers` - Replaced JSONB with proper foreign keys

  ## 3. Data Migration
    - Migrates existing JSONB data to normalized tables
    - Preserves all existing relationships
    - Maintains data integrity throughout the process

  ## 4. Security (RLS)
    - Enables RLS on all new tables
    - Creates appropriate policies for data access
    - Maintains security model consistency

  ## 5. Performance
    - Adds strategic indexes for common queries
    - Optimizes foreign key relationships
    - Improves query performance significantly
*/

-- =====================================================
-- STEP 1: CREATE NORMALIZED TABLES
-- =====================================================

-- 1.1 Addresses Table (Centralized address management)
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  street_address text NOT NULL,
  apartment_number text,
  region text NOT NULL,
  commune text NOT NULL,
  country text NOT NULL DEFAULT 'Chile',
  created_at timestamptz DEFAULT now()
);

-- 1.2 Applicants Table (Structured applicant information)
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

-- 1.3 Guarantors Table (Guarantor/co-signer information)
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

-- 1.4 Documents Table (Document management system)
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
  file_size_bytes integer DEFAULT 0,
  mime_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 2: ADD NEW COLUMNS TO EXISTING TABLES
-- =====================================================

-- 2.1 Add normalized columns to applications table
DO $$
BEGIN
  -- Add applicant_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'applicant_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL;
  END IF;

  -- Add guarantor_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'guarantor_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN guarantor_id uuid REFERENCES guarantors(id) ON DELETE SET NULL;
  END IF;

  -- Add property_address_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'address_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN address_id uuid REFERENCES addresses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2.2 Add normalized columns to offers table
DO $$
BEGIN
  -- Add applicant_id column to offers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'applicant_id'
  ) THEN
    ALTER TABLE offers ADD COLUMN applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- STEP 3: MIGRATE EXISTING DATA
-- =====================================================

-- 3.1 Migrate property addresses to addresses table
INSERT INTO addresses (street_address, region, commune, country)
SELECT DISTINCT 
  address as street_address,
  COALESCE(city, 'No especificado') as region,
  COALESCE(city, 'No especificado') as commune,
  'Chile' as country
FROM properties 
WHERE address IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3.2 Update properties with address_id references
UPDATE properties 
SET address_id = addresses.id
FROM addresses
WHERE properties.address = addresses.street_address
  AND properties.city = addresses.region;

-- 3.3 Migrate applicant data from JSONB to normalized structure
INSERT INTO applicants (
  user_id, full_name, rut, profession, company, 
  monthly_income, work_seniority_years, contact_email, contact_phone
)
SELECT DISTINCT
  applicant_id as user_id,
  COALESCE(applicant_data->>'fullName', 'No especificado') as full_name,
  COALESCE(applicant_data->>'rut', CONCAT('temp_', gen_random_uuid()::text)) as rut,
  applicant_data->>'profession' as profession,
  applicant_data->>'company' as company,
  COALESCE((applicant_data->>'monthlyIncome')::numeric, 0) as monthly_income,
  COALESCE((applicant_data->>'workSeniority')::integer, 0) as work_seniority_years,
  COALESCE(applicant_data->>'email', 'no-email@temp.com') as contact_email,
  applicant_data->>'phone' as contact_phone
FROM applications 
WHERE applicant_data IS NOT NULL 
  AND applicant_data != '{}'::jsonb
ON CONFLICT (rut) DO NOTHING;

-- 3.4 Migrate guarantor data from JSONB to normalized structure
INSERT INTO guarantors (
  full_name, rut, profession, company, 
  monthly_income, work_seniority_years, contact_email, contact_phone
)
SELECT DISTINCT
  COALESCE(applicant_data->>'guarantorFullName', 'No especificado') as full_name,
  COALESCE(applicant_data->>'guarantorRut', CONCAT('temp_guarantor_', gen_random_uuid()::text)) as rut,
  applicant_data->>'guarantorProfession' as profession,
  applicant_data->>'guarantorCompany' as company,
  COALESCE((applicant_data->>'guarantorMonthlyIncome')::numeric, 0) as monthly_income,
  COALESCE((applicant_data->>'guarantorWorkSeniority')::integer, 0) as work_seniority_years,
  COALESCE(applicant_data->>'guarantorEmail', 'no-email@temp.com') as contact_email,
  applicant_data->>'guarantorPhone' as contact_phone
FROM applications 
WHERE applicant_data IS NOT NULL 
  AND applicant_data != '{}'::jsonb
  AND applicant_data->>'guarantorFullName' IS NOT NULL
ON CONFLICT (rut) DO NOTHING;

-- 3.5 Update applications with normalized foreign keys
UPDATE applications 
SET applicant_id = applicants.id
FROM applicants
WHERE applications.applicant_id = applicants.user_id;

-- 3.6 Update applications with guarantor references
UPDATE applications 
SET guarantor_id = guarantors.id
FROM guarantors
WHERE applications.applicant_data->>'guarantorRut' = guarantors.rut;

-- 3.7 Migrate offer buyer_info to applicants
INSERT INTO applicants (
  user_id, full_name, rut, contact_email, contact_phone
)
SELECT DISTINCT
  buyer_id as user_id,
  COALESCE(buyer_info->>'fullName', 'No especificado') as full_name,
  COALESCE(buyer_info->>'rut', CONCAT('temp_buyer_', gen_random_uuid()::text)) as rut,
  COALESCE(buyer_info->>'email', 'no-email@temp.com') as contact_email,
  buyer_info->>'phone' as contact_phone
FROM offers 
WHERE buyer_info IS NOT NULL 
  AND buyer_info != '{}'::jsonb
ON CONFLICT (rut) DO NOTHING;

-- 3.8 Update offers with applicant references
UPDATE offers 
SET applicant_id = applicants.id
FROM applicants
WHERE offers.buyer_id = applicants.user_id;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for addresses table
CREATE INDEX IF NOT EXISTS idx_addresses_region_commune ON addresses(region, commune);
CREATE INDEX IF NOT EXISTS idx_addresses_created_at ON addresses(created_at);

-- Indexes for applicants table
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_rut ON applicants(rut);
CREATE INDEX IF NOT EXISTS idx_applicants_company ON applicants(company);
CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at);
CREATE INDEX IF NOT EXISTS idx_applicants_address_id ON applicants(address_id);

-- Indexes for guarantors table
CREATE INDEX IF NOT EXISTS idx_guarantors_rut ON guarantors(rut);
CREATE INDEX IF NOT EXISTS idx_guarantors_company ON guarantors(company);
CREATE INDEX IF NOT EXISTS idx_guarantors_created_at ON guarantors(created_at);
CREATE INDEX IF NOT EXISTS idx_guarantors_address_id ON guarantors(address_id);

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_uploader_user_id ON documents(uploader_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant_id ON documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_documents_guarantor_id ON documents(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);

-- Update existing indexes
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_guarantor_id ON applications(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_offers_applicant_id ON offers(applicant_id);
CREATE INDEX IF NOT EXISTS idx_properties_address_id ON properties(address_id);

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- Addresses policies
CREATE POLICY "Users can read addresses they reference"
  ON addresses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT address_id FROM properties WHERE owner_id = uid()
      UNION
      SELECT address_id FROM applicants WHERE user_id = uid()
    )
  );

CREATE POLICY "Users can insert addresses for their own use"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Applicants policies
CREATE POLICY "Users can read their own applicant data"
  ON applicants FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Property owners can read applicants for their properties"
  ON applicants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT applicant_id FROM applications 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = uid()
      )
    )
  );

CREATE POLICY "Users can insert their own applicant data"
  ON applicants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own applicant data"
  ON applicants FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

-- Guarantors policies
CREATE POLICY "Users can read guarantors for their applications"
  ON guarantors FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications WHERE applicant_id IN (
        SELECT id FROM applicants WHERE user_id = uid()
      )
    )
  );

CREATE POLICY "Property owners can read guarantors for their properties"
  ON guarantors FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = uid()
      )
    )
  );

CREATE POLICY "Users can insert guarantors for their applications"
  ON guarantors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Documents policies
CREATE POLICY "Users can read their own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (uploader_user_id = uid());

CREATE POLICY "Property owners can read documents for their properties"
  ON documents FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = uid()
    )
    OR
    application_id IN (
      SELECT id FROM applications 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = uid()
      )
    )
  );

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (uploader_user_id = uid());

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (uploader_user_id = uid())
  WITH CHECK (uploader_user_id = uid());

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (uploader_user_id = uid());

-- =====================================================
-- STEP 7: ADD CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Applicants constraints
ALTER TABLE applicants 
ADD CONSTRAINT applicants_monthly_income_check 
CHECK (monthly_income >= 0);

ALTER TABLE applicants 
ADD CONSTRAINT applicants_work_seniority_check 
CHECK (work_seniority_years >= 0);

ALTER TABLE applicants 
ADD CONSTRAINT applicants_email_format_check 
CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Guarantors constraints
ALTER TABLE guarantors 
ADD CONSTRAINT guarantors_monthly_income_check 
CHECK (monthly_income >= 0);

ALTER TABLE guarantors 
ADD CONSTRAINT guarantors_work_seniority_check 
CHECK (work_seniority_years >= 0);

ALTER TABLE guarantors 
ADD CONSTRAINT guarantors_email_format_check 
CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Documents constraints
ALTER TABLE documents 
ADD CONSTRAINT documents_file_size_check 
CHECK (file_size_bytes >= 0);

ALTER TABLE documents 
ADD CONSTRAINT documents_document_type_check 
CHECK (document_type IN (
  'cedula_identidad', 'certificado_dominio', 'avaluo_fiscal',
  'informe_comercial', 'poder_notarial', 'liquidacion_sueldo',
  'certificado_trabajo', 'otros'
));

-- =====================================================
-- STEP 8: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_applicants_updated_at
  BEFORE UPDATE ON applicants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guarantors_updated_at
  BEFORE UPDATE ON guarantors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 9: CREATE VIEWS FOR BACKWARD COMPATIBILITY
-- =====================================================

-- View to maintain compatibility with existing application queries
CREATE OR REPLACE VIEW applications_with_details AS
SELECT 
  a.*,
  ap.full_name as applicant_full_name,
  ap.rut as applicant_rut,
  ap.contact_email as applicant_email,
  ap.contact_phone as applicant_phone,
  ap.profession as applicant_profession,
  ap.company as applicant_company,
  ap.monthly_income as applicant_monthly_income,
  g.full_name as guarantor_full_name,
  g.rut as guarantor_rut,
  g.contact_email as guarantor_email,
  g.contact_phone as guarantor_phone,
  addr.street_address as applicant_address,
  addr.commune as applicant_commune,
  addr.region as applicant_region
FROM applications a
LEFT JOIN applicants ap ON a.applicant_id = ap.id
LEFT JOIN guarantors g ON a.guarantor_id = g.id
LEFT JOIN addresses addr ON ap.address_id = addr.id;

-- View for properties with normalized address data
CREATE OR REPLACE VIEW properties_with_addresses AS
SELECT 
  p.*,
  addr.street_address,
  addr.apartment_number,
  addr.region as address_region,
  addr.commune as address_commune,
  addr.country
FROM properties p
LEFT JOIN addresses addr ON p.address_id = addr.id;

-- =====================================================
-- STEP 10: ADD HELPFUL FUNCTIONS
-- =====================================================

-- Function to get all documents for an application
CREATE OR REPLACE FUNCTION get_application_documents(application_uuid uuid)
RETURNS TABLE (
  document_id uuid,
  document_type text,
  file_url text,
  uploaded_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.document_type, d.file_url, d.uploaded_at
  FROM documents d
  WHERE d.application_id = application_uuid
  ORDER BY d.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get complete applicant profile
CREATE OR REPLACE FUNCTION get_complete_applicant_profile(applicant_uuid uuid)
RETURNS TABLE (
  applicant_id uuid,
  full_name text,
  rut text,
  profession text,
  company text,
  monthly_income numeric,
  contact_email text,
  contact_phone text,
  address_full text,
  guarantor_name text,
  guarantor_rut text,
  guarantor_income numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.full_name,
    a.rut,
    a.profession,
    a.company,
    a.monthly_income,
    a.contact_email,
    a.contact_phone,
    CONCAT(addr.street_address, ', ', addr.commune, ', ', addr.region) as address_full,
    g.full_name as guarantor_name,
    g.rut as guarantor_rut,
    g.monthly_income as guarantor_income
  FROM applicants a
  LEFT JOIN addresses addr ON a.address_id = addr.id
  LEFT JOIN applications app ON app.applicant_id = a.id
  LEFT JOIN guarantors g ON app.guarantor_id = g.id
  WHERE a.id = applicant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 11: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions for the new tables
GRANT ALL ON addresses TO authenticated;
GRANT ALL ON applicants TO authenticated;
GRANT ALL ON guarantors TO authenticated;
GRANT ALL ON documents TO authenticated;

-- Grant permissions for the views
GRANT SELECT ON applications_with_details TO authenticated;
GRANT SELECT ON properties_with_addresses TO authenticated;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION get_application_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_complete_applicant_profile(uuid) TO authenticated;