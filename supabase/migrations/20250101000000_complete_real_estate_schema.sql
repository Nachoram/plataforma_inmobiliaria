/*
  # Complete Real Estate Platform Database Schema
  
  This migration creates a comprehensive, normalized database schema for a real estate platform
  following Third Normal Form (3NF) principles and Supabase best practices.
  
  ## Schema Overview
  1. **profiles** - Extended user profiles linked to Supabase Auth
  2. **properties** - Central property listings with detailed information
  3. **guarantors** - Guarantor/co-signer information for rental applications
  4. **applications** - Rental applications with snapshot data preservation
  5. **offers** - Purchase offers for properties
  6. **documents** - Centralized document management system
  7. **property_images** - Property image management
  8. **user_favorites** - Many-to-many relationship for user favorites
  
  ## Features
  - Complete normalization to 3NF
  - Comprehensive RLS security policies
  - Automatic user profile creation
  - Supabase Storage integration
  - Chilean address structure support
  - Document and image management
  - Snapshot data preservation for applications
*/

-- =====================================================
-- STEP 1: CREATE ENUMS AND EXTENSIONS
-- =====================================================

-- Create custom types for better data integrity
CREATE TYPE marital_status_enum AS ENUM ('soltero', 'casado', 'divorciado', 'viudo');
CREATE TYPE property_regime_enum AS ENUM ('sociedad conyugal', 'separación de bienes', 'participación en los gananciales');
CREATE TYPE property_status_enum AS ENUM ('disponible', 'activa', 'arrendada', 'vendida', 'pausada');
CREATE TYPE listing_type_enum AS ENUM ('venta', 'arriendo');
CREATE TYPE application_status_enum AS ENUM ('pendiente', 'aprobada', 'rechazada', 'info_solicitada');
CREATE TYPE offer_status_enum AS ENUM ('pendiente', 'aceptada', 'rechazada');
CREATE TYPE document_entity_type_enum AS ENUM ('property_legal', 'application_applicant', 'application_guarantor');

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1.5: UPDATE EXISTING DATA FOR ENUM CHANGES
-- =====================================================

-- Update existing properties with 'activa' status to 'disponible'
UPDATE properties SET status = 'disponible' WHERE status = 'activa';

-- Update any snapshot data that might reference the old status
UPDATE applications SET
  snapshot_applicant_profession = snapshot_applicant_profession
WHERE snapshot_applicant_profession IS NOT NULL;

-- =====================================================
-- STEP 2: CREATE PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  paternal_last_name text NOT NULL,
  maternal_last_name text,
  rut varchar(12) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(20),
  profession text,
  marital_status marital_status_enum DEFAULT 'soltero',
  property_regime property_regime_enum,
  address_street text,
  address_number varchar(10),
  address_department varchar(10),
  address_commune text,
  address_region text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 3: CREATE PROPERTIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status property_status_enum DEFAULT 'disponible',
  listing_type listing_type_enum NOT NULL,
  address_street text NOT NULL,
  address_number varchar(10) NOT NULL,
  address_department varchar(10),
  address_commune text NOT NULL,
  address_region text NOT NULL,
  price_clp bigint NOT NULL,
  common_expenses_clp integer,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  surface_m2 integer,
  description text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 4: CREATE GUARANTORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS guarantors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  paternal_last_name text NOT NULL,
  maternal_last_name text,
  rut varchar(12) UNIQUE NOT NULL,
  profession text,
  monthly_income_clp bigint,
  address_street text,
  address_number varchar(10),
  address_department varchar(10),
  address_commune text,
  address_region text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 5: CREATE APPLICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  applicant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  guarantor_id uuid REFERENCES guarantors(id) ON DELETE SET NULL,
  status application_status_enum DEFAULT 'pendiente',
  message text,
  -- Snapshot data to preserve applicant information at time of application
  snapshot_applicant_profession text,
  snapshot_applicant_monthly_income_clp bigint,
  snapshot_applicant_age integer,
  snapshot_applicant_nationality text,
  snapshot_applicant_marital_status marital_status_enum,
  snapshot_applicant_address_street text,
  snapshot_applicant_address_number varchar(10),
  snapshot_applicant_address_department varchar(10),
  snapshot_applicant_address_commune text,
  snapshot_applicant_address_region text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 6: CREATE OFFERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  offerer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  offer_amount_clp bigint NOT NULL,
  status offer_status_enum DEFAULT 'pendiente',
  message text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 7: CREATE DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  related_entity_id uuid NOT NULL,
  related_entity_type document_entity_type_enum NOT NULL,
  document_type text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 8: CREATE PROPERTY_IMAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 9: CREATE USER_FAVORITES TABLE (Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

-- =====================================================
-- STEP 10: CREATE STRATEGIC INDEXES
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_rut ON profiles(rut);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_commune ON properties(address_commune);
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(address_region);
CREATE INDEX IF NOT EXISTS idx_properties_price_clp ON properties(price_clp);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_guarantor_id ON applications(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Offers indexes
CREATE INDEX IF NOT EXISTS idx_offers_property_id ON offers(property_id);
CREATE INDEX IF NOT EXISTS idx_offers_offerer_id ON offers(offerer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_related_entity ON documents(related_entity_id, related_entity_type);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Property images indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_created_at ON property_images(created_at);

-- User favorites indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_property_id ON user_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- =====================================================
-- STEP 11: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 12: CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (status = 'activa');

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

-- Guarantors policies
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

-- Applications policies
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Property owners can view applications for their properties"
  ON applications FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Property owners can update applications for their properties"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Offers policies
CREATE POLICY "Users can view their own offers"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = offerer_id);

CREATE POLICY "Property owners can view offers for their properties"
  ON offers FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = offerer_id);

CREATE POLICY "Property owners can update offers for their properties"
  ON offers FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = uploader_id);

CREATE POLICY "Property owners can view documents for their properties"
  ON documents FOR SELECT
  TO authenticated
  USING (
    (related_entity_type = 'property_legal' AND related_entity_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )) OR
    (related_entity_type IN ('application_applicant', 'application_guarantor') AND related_entity_id IN (
      SELECT id FROM applications WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    ))
  );

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

-- Property images policies
CREATE POLICY "Anyone can view property images"
  ON property_images FOR SELECT
  TO anon, authenticated
  USING (true);

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

-- User favorites policies
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
-- STEP 13: CREATE USER PROFILE CREATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_public_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    email,
    phone,
    profession,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'paternal_last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'maternal_last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'rut', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'profession', ''),
    COALESCE(NEW.raw_user_meta_data->>'marital_status', 'soltero'),
    COALESCE(NEW.raw_user_meta_data->>'address_street', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_commune', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_region', ''),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 14: CREATE TRIGGER FOR USER PROFILE CREATION
-- =====================================================

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_public_profile_for_new_user();

-- =====================================================
-- STEP 15: CREATE SUPABASE STORAGE BUCKETS
-- =====================================================

-- Create property-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create user-documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 16: CREATE STORAGE SECURITY POLICIES
-- =====================================================

-- Property images storage policies
CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'property-images');

CREATE POLICY "Property owners can update their property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Property owners can delete their property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- User documents storage policies
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- STEP 17: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get property with all related data
CREATE OR REPLACE FUNCTION get_property_with_details(property_uuid uuid)
RETURNS TABLE (
  property_id uuid,
  owner_name text,
  owner_email text,
  owner_phone text,
  address_full text,
  price_clp bigint,
  listing_type listing_type_enum,
  status property_status_enum,
  bedrooms integer,
  bathrooms integer,
  surface_m2 integer,
  description text,
  images_count bigint,
  applications_count bigint,
  offers_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    CONCAT(prof.first_name, ' ', prof.paternal_last_name) as owner_name,
    prof.email as owner_email,
    prof.phone as owner_phone,
    CONCAT(p.address_street, ' ', p.address_number, ', ', p.address_commune, ', ', p.address_region) as address_full,
    p.price_clp,
    p.listing_type,
    p.status,
    p.bedrooms,
    p.bathrooms,
    p.surface_m2,
    p.description,
    COUNT(DISTINCT pi.id) as images_count,
    COUNT(DISTINCT a.id) as applications_count,
    COUNT(DISTINCT o.id) as offers_count
  FROM properties p
  LEFT JOIN profiles prof ON p.owner_id = prof.id
  LEFT JOIN property_images pi ON p.id = pi.property_id
  LEFT JOIN applications a ON p.id = a.property_id
  LEFT JOIN offers o ON p.id = o.property_id
  WHERE p.id = property_uuid
  GROUP BY p.id, prof.first_name, prof.paternal_last_name, prof.email, prof.phone;
END;
$$;

-- Function to get user's complete profile
CREATE OR REPLACE FUNCTION get_user_complete_profile(user_uuid uuid)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  rut varchar(12),
  email varchar(255),
  phone varchar(20),
  profession text,
  marital_status marital_status_enum,
  property_regime property_regime_enum,
  address_full text,
  properties_count bigint,
  applications_count bigint,
  offers_count bigint,
  favorites_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    CONCAT(p.first_name, ' ', p.paternal_last_name, 
           CASE WHEN p.maternal_last_name IS NOT NULL THEN ' ' || p.maternal_last_name ELSE '' END) as full_name,
    p.rut,
    p.email,
    p.phone,
    p.profession,
    p.marital_status,
    p.property_regime,
    CONCAT(p.address_street, ' ', p.address_number, 
           CASE WHEN p.address_department IS NOT NULL THEN ', Depto. ' || p.address_department ELSE '' END,
           ', ', p.address_commune, ', ', p.address_region) as address_full,
    COUNT(DISTINCT prop.id) as properties_count,
    COUNT(DISTINCT a.id) as applications_count,
    COUNT(DISTINCT o.id) as offers_count,
    COUNT(DISTINCT uf.property_id) as favorites_count
  FROM profiles p
  LEFT JOIN properties prop ON p.id = prop.owner_id
  LEFT JOIN applications a ON p.id = a.applicant_id
  LEFT JOIN offers o ON p.id = o.offerer_id
  LEFT JOIN user_favorites uf ON p.id = uf.user_id
  WHERE p.id = user_uuid
  GROUP BY p.id, p.first_name, p.paternal_last_name, p.maternal_last_name, p.rut, p.email, p.phone, p.profession, p.marital_status, p.property_regime, p.address_street, p.address_number, p.address_department, p.address_commune, p.address_region;
END;
$$;

-- =====================================================
-- STEP 18: CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active properties with owner information
CREATE OR REPLACE VIEW active_properties_view AS
SELECT 
  p.id,
  p.owner_id,
  CONCAT(prof.first_name, ' ', prof.paternal_last_name) as owner_name,
  prof.email as owner_email,
  prof.phone as owner_phone,
  p.listing_type,
  p.status,
  CONCAT(p.address_street, ' ', p.address_number, 
         CASE WHEN p.address_department IS NOT NULL THEN ', Depto. ' || p.address_department ELSE '' END,
         ', ', p.address_commune, ', ', p.address_region) as full_address,
  p.price_clp,
  p.common_expenses_clp,
  p.bedrooms,
  p.bathrooms,
  p.surface_m2,
  p.description,
  p.created_at,
  COUNT(DISTINCT pi.id) as images_count,
  COUNT(DISTINCT a.id) as applications_count,
  COUNT(DISTINCT o.id) as offers_count
FROM properties p
LEFT JOIN profiles prof ON p.owner_id = prof.id
LEFT JOIN property_images pi ON p.id = pi.property_id
LEFT JOIN applications a ON p.id = a.property_id
LEFT JOIN offers o ON p.id = o.property_id
WHERE p.status = 'activa'
GROUP BY p.id, prof.first_name, prof.paternal_last_name, prof.email, prof.phone;

-- View for applications with complete information
CREATE OR REPLACE VIEW applications_complete_view AS
SELECT 
  a.id,
  a.property_id,
  a.applicant_id,
  a.guarantor_id,
  a.status,
  a.message,
  a.created_at,
  -- Property information
  CONCAT(p.address_street, ' ', p.address_number, ', ', p.address_commune) as property_address,
  p.price_clp as property_price,
  p.listing_type,
  -- Applicant information
  CONCAT(prof.first_name, ' ', prof.paternal_last_name) as applicant_name,
  prof.email as applicant_email,
  prof.phone as applicant_phone,
  a.snapshot_applicant_profession,
  a.snapshot_applicant_monthly_income_clp,
  -- Guarantor information
  g.first_name as guarantor_first_name,
  g.paternal_last_name as guarantor_last_name,
  g.rut as guarantor_rut,
  g.profession as guarantor_profession,
  g.monthly_income_clp as guarantor_income
FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
LEFT JOIN profiles prof ON a.applicant_id = prof.id
LEFT JOIN guarantors g ON a.guarantor_id = g.id;

-- =====================================================
-- STEP 19: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for tables
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON properties TO authenticated;
GRANT ALL ON guarantors TO authenticated;
GRANT ALL ON applications TO authenticated;
GRANT ALL ON offers TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON property_images TO authenticated;
GRANT ALL ON user_favorites TO authenticated;

-- Grant permissions for views
GRANT SELECT ON active_properties_view TO anon, authenticated;
GRANT SELECT ON applications_complete_view TO authenticated;

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION get_property_with_details(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_complete_profile(uuid) TO authenticated;

-- =====================================================
-- STEP 20: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'Extended user profiles linked to Supabase Auth with Chilean address structure';
COMMENT ON TABLE properties IS 'Central property listings with detailed information and Chilean address structure';
COMMENT ON TABLE guarantors IS 'Guarantor/co-signer information for rental applications';
COMMENT ON TABLE applications IS 'Rental applications with snapshot data preservation for historical accuracy';
COMMENT ON TABLE offers IS 'Purchase offers for properties in sale';
COMMENT ON TABLE documents IS 'Centralized document management system for all entity types';
COMMENT ON TABLE property_images IS 'Property image management with Supabase Storage integration';
COMMENT ON TABLE user_favorites IS 'Many-to-many relationship for user property favorites';

COMMENT ON COLUMN profiles.rut IS 'Chilean national identification number (RUT)';
COMMENT ON COLUMN profiles.marital_status IS 'Marital status affecting property regime';
COMMENT ON COLUMN profiles.property_regime IS 'Property regime for married couples (null if not married)';

COMMENT ON COLUMN properties.price_clp IS 'Property price in Chilean Pesos';
COMMENT ON COLUMN properties.common_expenses_clp IS 'Monthly common expenses in Chilean Pesos (for apartments)';

COMMENT ON COLUMN applications.snapshot_applicant_profession IS 'Applicant profession at time of application (preserved for historical accuracy)';
COMMENT ON COLUMN applications.snapshot_applicant_monthly_income_clp IS 'Applicant monthly income at time of application (preserved for historical accuracy)';

COMMENT ON COLUMN documents.related_entity_type IS 'Type of entity the document belongs to (property_legal, application_applicant, application_guarantor)';
COMMENT ON COLUMN documents.storage_path IS 'Path to file in Supabase Storage bucket';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Real Estate Platform Database Schema created successfully!';
  RAISE NOTICE 'Tables created: profiles, properties, guarantors, applications, offers, documents, property_images, user_favorites';
  RAISE NOTICE 'Storage buckets created: property-images (public), user-documents (private)';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'User profile creation trigger configured';
  RAISE NOTICE 'Helper functions and views created';
END $$;
