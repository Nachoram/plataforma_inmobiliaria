/*
  # Create Progressive Document Tables
  
  This migration creates new tables to support progressive document submission
  with optional uploads and detailed tracking.
  
  1. New Tables:
    - property_documents
    - application_documents
    
  2. Security:
    - RLS policies for owners and applicants
*/

-- =====================================================
-- STEP 1: CREATE PROPERTY_DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS property_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  document_type varchar(255) NOT NULL,
  document_label varchar(255) NOT NULL,
  file_path varchar(1024) NOT NULL,
  file_name varchar(255) NOT NULL,
  original_file_name varchar(255),
  file_size integer,
  mime_type varchar(255),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  status varchar(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 2: CREATE APPLICATION_DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS application_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  document_type varchar(255) NOT NULL,
  document_label varchar(255) NOT NULL,
  file_path varchar(1024) NOT NULL,
  file_name varchar(255) NOT NULL,
  original_file_name varchar(255),
  file_size integer,
  mime_type varchar(255),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  status varchar(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_uploaded_by ON property_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_uploaded_by ON application_documents(uploaded_by);

-- =====================================================
-- STEP 4: ENABLE RLS
-- =====================================================

ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: RLS POLICIES FOR PROPERTY_DOCUMENTS
-- =====================================================

-- Owner can view their own property documents
CREATE POLICY "Users can view documents of their properties"
  ON property_documents FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owner can insert documents to their properties
CREATE POLICY "Users can insert documents to their properties"
  ON property_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owner can update documents of their properties
CREATE POLICY "Users can update documents of their properties"
  ON property_documents FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owner can delete documents of their properties
CREATE POLICY "Users can delete documents of their properties"
  ON property_documents FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 6: RLS POLICIES FOR APPLICATION_DOCUMENTS
-- =====================================================

-- Applicant can view their own application documents
CREATE POLICY "Applicants can view their own documents"
  ON application_documents FOR SELECT
  TO authenticated
  USING (
    application_id IN (
      SELECT id FROM applications WHERE applicant_id = auth.uid()
    )
  );

-- Property owner can view documents of applications to their properties
CREATE POLICY "Property owners can view application documents"
  ON application_documents FOR SELECT
  TO authenticated
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Applicant can insert documents to their applications
CREATE POLICY "Applicants can insert documents"
  ON application_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications WHERE applicant_id = auth.uid()
    )
  );

-- Applicant can update their own documents
CREATE POLICY "Applicants can update their own documents"
  ON application_documents FOR UPDATE
  TO authenticated
  USING (
    application_id IN (
      SELECT id FROM applications WHERE applicant_id = auth.uid()
    )
  );

-- Applicant can delete their own documents
CREATE POLICY "Applicants can delete their own documents"
  ON application_documents FOR DELETE
  TO authenticated
  USING (
    application_id IN (
      SELECT id FROM applications WHERE applicant_id = auth.uid()
    )
  );


