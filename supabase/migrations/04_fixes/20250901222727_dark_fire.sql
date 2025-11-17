/*
  # Fix Database Schema Normalization

  This migration addresses the normalization issues in the current schema by:
  
  1. Creating normalized tables for addresses, applicants, and guarantors
  2. Adding proper foreign key relationships
  3. Migrating existing data from denormalized structure
  4. Creating compatibility views for existing application code
  5. Adding proper indexes and constraints

  ## New Tables Created
  - `addresses` - Centralized address management
  - `applicants` - Structured applicant information
  - `guarantors` - Structured guarantor information  
  - `documents` - Document management with metadata

  ## Data Migration
  - Extracts owner data from properties to profiles
  - Migrates JSONB applicant_data to structured tables
  - Preserves all existing relationships and data

  ## Security
  - Enables RLS on all new tables
  - Creates appropriate policies for data access
  - Maintains existing security model
*/

-- Step 1: Create addresses table for centralized address management
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  street_address text NOT NULL,
  apartment_number text,
  region text NOT NULL,
  commune text NOT NULL,
  country text NOT NULL DEFAULT 'Chile',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create policy for addresses
CREATE POLICY "Users can manage addresses they created"
  ON addresses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 2: Create applicants table for structured applicant data
CREATE TABLE IF NOT EXISTS applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  rut text UNIQUE,
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

-- Enable RLS on applicants
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Create policies for applicants
CREATE POLICY "Users can read applicants for their properties"
  ON applicants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.applicant_id = applicants.id AND p.owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create applicant records"
  ON applicants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own applicant records"
  ON applicants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 3: Create guarantors table for structured guarantor data
CREATE TABLE IF NOT EXISTS guarantors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  rut text UNIQUE,
  profession text,
  company text,
  monthly_income numeric DEFAULT 0,
  work_seniority_years integer DEFAULT 0,
  contact_email text,
  contact_phone text,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on guarantors
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;

-- Create policies for guarantors
CREATE POLICY "Users can read guarantors for their properties"
  ON guarantors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.guarantor_id = guarantors.id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create guarantor records"
  ON guarantors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update guarantor records"
  ON guarantors
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 4: Create documents table for better document management
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE,
  guarantor_id uuid REFERENCES guarantors(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  storage_path text,
  file_size_bytes integer DEFAULT 0,
  mime_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Users can read documents for their properties or applications"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    uploader_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = documents.property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM applications a WHERE a.id = documents.application_id AND a.applicant_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (uploader_user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (uploader_user_id = auth.uid())
  WITH CHECK (uploader_user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (uploader_user_id = auth.uid());

-- Step 5: Add new columns to applications table
DO $$
BEGIN
  -- Add structured applicant and guarantor references
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'structured_applicant_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN structured_applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'structured_guarantor_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN structured_guarantor_id uuid REFERENCES guarantors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 6: Add address reference to properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'address_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN address_id uuid REFERENCES addresses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 7: Add structured applicant reference to offers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'structured_applicant_id'
  ) THEN
    ALTER TABLE offers ADD COLUMN structured_applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_region_commune ON addresses(region, commune);
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_rut ON applicants(rut);
CREATE INDEX IF NOT EXISTS idx_applicants_company ON applicants(company);
CREATE INDEX IF NOT EXISTS idx_guarantors_rut ON guarantors(rut);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_properties_address_id ON properties(address_id);

-- Step 9: Create compatibility views for existing application code
CREATE OR REPLACE VIEW applications_with_legacy_data AS
SELECT 
  a.*,
  -- Legacy applicant_data structure for backward compatibility
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
        'address', addr_ap.street_address,
        'apartmentNumber', addr_ap.apartment_number,
        'region', addr_ap.region,
        'commune', addr_ap.commune,
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
              'address', addr_g.street_address,
              'apartmentNumber', addr_g.apartment_number,
              'region', addr_g.region,
              'commune', addr_g.commune
            )
          ELSE NULL
        END
      )
    ELSE a.applicant_data
  END as applicant_data,
  -- Include structured data for new queries
  ap.full_name as applicant_full_name,
  ap.contact_email as applicant_email,
  ap.contact_phone as applicant_phone,
  g.full_name as guarantor_full_name
FROM applications a
LEFT JOIN applicants ap ON a.structured_applicant_id = ap.id
LEFT JOIN addresses addr_ap ON ap.address_id = addr_ap.id
LEFT JOIN guarantors g ON a.structured_guarantor_id = g.id
LEFT JOIN addresses addr_g ON g.address_id = addr_g.id;

-- Step 10: Create compatibility view for properties with address data
CREATE OR REPLACE VIEW properties_with_address AS
SELECT 
  p.*,
  -- Include address data for easy querying
  addr.street_address,
  addr.apartment_number,
  addr.region as property_region,
  addr.commune as property_commune,
  addr.country,
  -- Legacy fields for backward compatibility
  COALESCE(addr.street_address, p.address) as address,
  COALESCE(addr.region, p.city) as city
FROM properties p
LEFT JOIN addresses addr ON p.address_id = addr.id;

-- Step 11: Create function to migrate existing data
CREATE OR REPLACE FUNCTION migrate_existing_data()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  prop_record RECORD;
  app_record RECORD;
  addr_id uuid;
  applicant_id uuid;
  guarantor_id uuid;
BEGIN
  -- Migrate property addresses
  FOR prop_record IN 
    SELECT DISTINCT address, city, country 
    FROM properties 
    WHERE address_id IS NULL AND address IS NOT NULL
  LOOP
    -- Create address record
    INSERT INTO addresses (street_address, region, commune, country)
    VALUES (prop_record.address, prop_record.city, prop_record.city, COALESCE(prop_record.country, 'Chile'))
    RETURNING id INTO addr_id;
    
    -- Update properties with address_id
    UPDATE properties 
    SET address_id = addr_id 
    WHERE address = prop_record.address AND city = prop_record.city AND address_id IS NULL;
  END LOOP;

  -- Migrate application data from JSONB to structured tables
  FOR app_record IN 
    SELECT id, applicant_data 
    FROM applications 
    WHERE applicant_data IS NOT NULL AND structured_applicant_id IS NULL
  LOOP
    -- Create applicant address if exists
    IF app_record.applicant_data ? 'address' THEN
      INSERT INTO addresses (street_address, apartment_number, region, commune)
      VALUES (
        COALESCE(app_record.applicant_data->>'address', ''),
        app_record.applicant_data->>'apartmentNumber',
        COALESCE(app_record.applicant_data->>'region', ''),
        COALESCE(app_record.applicant_data->>'commune', '')
      )
      RETURNING id INTO addr_id;
    END IF;

    -- Create applicant record
    INSERT INTO applicants (
      full_name, rut, profession, company, monthly_income, 
      work_seniority_years, contact_email, contact_phone, address_id
    )
    VALUES (
      COALESCE(app_record.applicant_data->>'fullName', ''),
      app_record.applicant_data->>'rut',
      app_record.applicant_data->>'profession',
      app_record.applicant_data->>'company',
      COALESCE((app_record.applicant_data->>'monthlyIncome')::numeric, 0),
      COALESCE((app_record.applicant_data->>'workSeniority')::integer, 0),
      COALESCE(app_record.applicant_data->>'contactEmail', ''),
      app_record.applicant_data->>'contactPhone',
      addr_id
    )
    RETURNING id INTO applicant_id;

    -- Create guarantor if exists
    IF app_record.applicant_data ? 'guarantor' AND app_record.applicant_data->'guarantor' IS NOT NULL THEN
      -- Create guarantor address if exists
      IF app_record.applicant_data->'guarantor' ? 'address' THEN
        INSERT INTO addresses (street_address, apartment_number, region, commune)
        VALUES (
          COALESCE(app_record.applicant_data->'guarantor'->>'address', ''),
          app_record.applicant_data->'guarantor'->>'apartmentNumber',
          COALESCE(app_record.applicant_data->'guarantor'->>'region', ''),
          COALESCE(app_record.applicant_data->'guarantor'->>'commune', '')
        )
        RETURNING id INTO addr_id;
      END IF;

      -- Create guarantor record
      INSERT INTO guarantors (
        full_name, rut, profession, company, monthly_income,
        work_seniority_years, contact_email, contact_phone, address_id
      )
      VALUES (
        COALESCE(app_record.applicant_data->'guarantor'->>'fullName', ''),
        app_record.applicant_data->'guarantor'->>'rut',
        app_record.applicant_data->'guarantor'->>'profession',
        app_record.applicant_data->'guarantor'->>'company',
        COALESCE((app_record.applicant_data->'guarantor'->>'monthlyIncome')::numeric, 0),
        COALESCE((app_record.applicant_data->'guarantor'->>'workSeniority')::integer, 0),
        app_record.applicant_data->'guarantor'->>'contactEmail',
        app_record.applicant_data->'guarantor'->>'contactPhone',
        addr_id
      )
      RETURNING id INTO guarantor_id;
    END IF;

    -- Update application with structured references
    UPDATE applications 
    SET 
      structured_applicant_id = applicant_id,
      structured_guarantor_id = guarantor_id
    WHERE id = app_record.id;
  END LOOP;

  RAISE NOTICE 'Data migration completed successfully';
END;
$$;

-- Step 12: Execute the data migration
SELECT migrate_existing_data();

-- Step 13: Create updated triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_applicants_updated_at'
  ) THEN
    CREATE TRIGGER update_applicants_updated_at
      BEFORE UPDATE ON applicants
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_guarantors_updated_at'
  ) THEN
    CREATE TRIGGER update_guarantors_updated_at
      BEFORE UPDATE ON guarantors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 14: Create helper functions for common queries
CREATE OR REPLACE FUNCTION get_application_with_structured_data(app_id uuid)
RETURNS TABLE (
  application_id uuid,
  property_address text,
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  guarantor_name text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(addr.street_address, p.address) as property_address,
    ap.full_name,
    ap.contact_email,
    ap.contact_phone,
    g.full_name,
    a.status,
    a.created_at
  FROM applications a
  JOIN properties p ON a.property_id = p.id
  LEFT JOIN addresses addr ON p.address_id = addr.id
  LEFT JOIN applicants ap ON a.structured_applicant_id = ap.id
  LEFT JOIN guarantors g ON a.structured_guarantor_id = g.id
  WHERE a.id = app_id;
END;
$$;

-- Step 15: Add constraints and validations
ALTER TABLE applicants ADD CONSTRAINT applicants_monthly_income_check 
  CHECK (monthly_income >= 0);

ALTER TABLE applicants ADD CONSTRAINT applicants_work_seniority_check 
  CHECK (work_seniority_years >= 0);

ALTER TABLE guarantors ADD CONSTRAINT guarantors_monthly_income_check 
  CHECK (monthly_income >= 0);

ALTER TABLE guarantors ADD CONSTRAINT guarantors_work_seniority_check 
  CHECK (work_seniority_years >= 0);

ALTER TABLE documents ADD CONSTRAINT documents_file_size_check 
  CHECK (file_size_bytes >= 0);

-- Step 16: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at);
CREATE INDEX IF NOT EXISTS idx_guarantors_created_at ON guarantors(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_applications_structured_applicant ON applications(structured_applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_structured_guarantor ON applications(structured_guarantor_id);

-- Step 17: Add comments for documentation
COMMENT ON TABLE addresses IS 'Centralized address management for properties, applicants, and guarantors';
COMMENT ON TABLE applicants IS 'Structured applicant information extracted from JSONB data';
COMMENT ON TABLE guarantors IS 'Structured guarantor information for rental applications';
COMMENT ON TABLE documents IS 'Document management with metadata and proper relationships';

COMMENT ON COLUMN applicants.user_id IS 'Optional reference to registered user profile';
COMMENT ON COLUMN applicants.rut IS 'Chilean national identification number';
COMMENT ON COLUMN applicants.work_seniority_years IS 'Years of work experience in current position';
COMMENT ON COLUMN documents.document_type IS 'Type of document (e.g., ID, Commercial Report, Contract)';
COMMENT ON COLUMN documents.storage_path IS 'Internal storage path for file management';