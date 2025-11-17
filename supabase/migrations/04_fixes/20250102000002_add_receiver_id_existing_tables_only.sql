/*
  # Add Receiver ID Columns to Existing Tables Only
  
  This migration adds receiver_id columns only to tables that actually exist
  in the database, avoiding errors for non-existent tables.
  
  ## Tables to be modified (only if they exist):
  1. **properties** - Add receiver_id (duplicates owner_id)
  2. **applications** - Add receiver_id (duplicates applicant_id) 
  3. **offers** - Add receiver_id (duplicates offerer_id)
  4. **guarantors** - Add receiver_id (duplicates id for self-reference)
  5. **documents** - Add receiver_id (duplicates uploader_id)
  6. **property_images** - Add receiver_id (duplicates property owner_id)
  7. **user_favorites** - Add receiver_id (duplicates user_id)
  
  ## Purpose:
  - Better data tracking and relationships
  - Simplified queries for receiver-based operations
  - Maintains data consistency with existing IDs
  - Only modifies tables that actually exist
*/

-- =====================================================
-- STEP 1: ADD RECEIVER_ID COLUMNS TO EXISTING TABLES ONLY
-- =====================================================

-- 1.1 Add receiver_id to properties table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added receiver_id column to properties table';
  ELSE
    RAISE NOTICE 'Properties table does not exist - skipping';
  END IF;
END $$;

-- 1.2 Add receiver_id to applications table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added receiver_id column to applications table';
  ELSE
    RAISE NOTICE 'Applications table does not exist - skipping';
  END IF;
END $$;

-- 1.3 Add receiver_id to offers table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    ALTER TABLE offers ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added receiver_id column to offers table';
  ELSE
    RAISE NOTICE 'Offers table does not exist - skipping';
  END IF;
END $$;

-- 1.4 Add receiver_id to guarantors table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES guarantors(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added receiver_id column to guarantors table';
  ELSE
    RAISE NOTICE 'Guarantors table does not exist - skipping';
  END IF;
END $$;

-- 1.5 Add receiver_id to documents table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added receiver_id column to documents table';
  ELSE
    RAISE NOTICE 'Documents table does not exist - skipping';
  END IF;
END $$;

-- 1.6 Add receiver_id to property_images table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    ALTER TABLE property_images ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added receiver_id column to property_images table';
  ELSE
    RAISE NOTICE 'Property_images table does not exist - skipping';
  END IF;
END $$;

-- 1.7 Add receiver_id to user_favorites table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added receiver_id column to user_favorites table';
  ELSE
    RAISE NOTICE 'User_favorites table does not exist - skipping';
  END IF;
END $$;

-- =====================================================
-- STEP 2: POPULATE RECEIVER_ID COLUMNS WITH EXISTING DATA
-- =====================================================

-- 2.1 Populate receiver_id in properties table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    UPDATE properties SET receiver_id = owner_id WHERE receiver_id IS NULL;
    RAISE NOTICE 'Populated receiver_id in properties table';
  END IF;
END $$;

-- 2.2 Populate receiver_id in applications table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    UPDATE applications SET receiver_id = applicant_id WHERE receiver_id IS NULL;
    RAISE NOTICE 'Populated receiver_id in applications table';
  END IF;
END $$;

-- 2.3 Populate receiver_id in offers table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    UPDATE offers SET receiver_id = offerer_id WHERE receiver_id IS NULL;
    RAISE NOTICE 'Populated receiver_id in offers table';
  END IF;
END $$;

-- 2.4 Populate receiver_id in guarantors table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    UPDATE guarantors SET receiver_id = id WHERE receiver_id IS NULL;
    RAISE NOTICE 'Populated receiver_id in guarantors table';
  END IF;
END $$;

-- 2.5 Populate receiver_id in documents table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    UPDATE documents SET receiver_id = uploader_id WHERE receiver_id IS NULL;
    RAISE NOTICE 'Populated receiver_id in documents table';
  END IF;
END $$;

-- 2.6 Populate receiver_id in property_images table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    UPDATE property_images 
    SET receiver_id = (
      SELECT p.owner_id 
      FROM properties p 
      WHERE p.id = property_images.property_id
    )
    WHERE receiver_id IS NULL;
    RAISE NOTICE 'Populated receiver_id in property_images table';
  END IF;
END $$;

-- 2.7 Populate receiver_id in user_favorites table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    UPDATE user_favorites SET receiver_id = user_id WHERE receiver_id IS NULL;
    RAISE NOTICE 'Populated receiver_id in user_favorites table';
  END IF;
END $$;

-- =====================================================
-- STEP 3: ADD NOT NULL CONSTRAINTS (ONLY FOR EXISTING TABLES)
-- =====================================================

-- 3.1 Make receiver_id NOT NULL for properties (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    ALTER TABLE properties ALTER COLUMN receiver_id SET NOT NULL;
    RAISE NOTICE 'Set receiver_id NOT NULL in properties table';
  END IF;
END $$;

-- 3.2 Make receiver_id NOT NULL for applications (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    ALTER TABLE applications ALTER COLUMN receiver_id SET NOT NULL;
    RAISE NOTICE 'Set receiver_id NOT NULL in applications table';
  END IF;
END $$;

-- 3.3 Make receiver_id NOT NULL for offers (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    ALTER TABLE offers ALTER COLUMN receiver_id SET NOT NULL;
    RAISE NOTICE 'Set receiver_id NOT NULL in offers table';
  END IF;
END $$;

-- 3.4 Make receiver_id NOT NULL for guarantors (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    ALTER TABLE guarantors ALTER COLUMN receiver_id SET NOT NULL;
    RAISE NOTICE 'Set receiver_id NOT NULL in guarantors table';
  END IF;
END $$;

-- 3.5 Make receiver_id NOT NULL for documents (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    ALTER TABLE documents ALTER COLUMN receiver_id SET NOT NULL;
    RAISE NOTICE 'Set receiver_id NOT NULL in documents table';
  END IF;
END $$;

-- 3.6 Make receiver_id NOT NULL for property_images (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    ALTER TABLE property_images ALTER COLUMN receiver_id SET NOT NULL;
    RAISE NOTICE 'Set receiver_id NOT NULL in property_images table';
  END IF;
END $$;

-- 3.7 Make receiver_id NOT NULL for user_favorites (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    ALTER TABLE user_favorites ALTER COLUMN receiver_id SET NOT NULL;
    RAISE NOTICE 'Set receiver_id NOT NULL in user_favorites table';
  END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR RECEIVER_ID COLUMNS (ONLY FOR EXISTING TABLES)
-- =====================================================

-- 4.1 Create indexes for receiver_id columns (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_properties_receiver_id ON properties(receiver_id);
    RAISE NOTICE 'Created index for properties.receiver_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_applications_receiver_id ON applications(receiver_id);
    RAISE NOTICE 'Created index for applications.receiver_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_offers_receiver_id ON offers(receiver_id);
    RAISE NOTICE 'Created index for offers.receiver_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_guarantors_receiver_id ON guarantors(receiver_id);
    RAISE NOTICE 'Created index for guarantors.receiver_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_documents_receiver_id ON documents(receiver_id);
    RAISE NOTICE 'Created index for documents.receiver_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_property_images_receiver_id ON property_images(receiver_id);
    RAISE NOTICE 'Created index for property_images.receiver_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_user_favorites_receiver_id ON user_favorites(receiver_id);
    RAISE NOTICE 'Created index for user_favorites.receiver_id';
  END IF;
END $$;

-- =====================================================
-- STEP 5: CREATE TRIGGER FUNCTION AND TRIGGERS (ONLY FOR EXISTING TABLES)
-- =====================================================

-- 5.1 Create function to maintain receiver_id consistency
CREATE OR REPLACE FUNCTION maintain_receiver_id_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- For properties table
  IF TG_TABLE_NAME = 'properties' THEN
    NEW.receiver_id = NEW.owner_id;
  END IF;
  
  -- For applications table
  IF TG_TABLE_NAME = 'applications' THEN
    NEW.receiver_id = NEW.applicant_id;
  END IF;
  
  -- For offers table
  IF TG_TABLE_NAME = 'offers' THEN
    NEW.receiver_id = NEW.offerer_id;
  END IF;
  
  -- For guarantors table
  IF TG_TABLE_NAME = 'guarantors' THEN
    NEW.receiver_id = NEW.id;
  END IF;
  
  -- For documents table
  IF TG_TABLE_NAME = 'documents' THEN
    NEW.receiver_id = NEW.uploader_id;
  END IF;
  
  -- For property_images table
  IF TG_TABLE_NAME = 'property_images' THEN
    NEW.receiver_id = (
      SELECT owner_id FROM properties WHERE id = NEW.property_id
    );
  END IF;
  
  -- For user_favorites table
  IF TG_TABLE_NAME = 'user_favorites' THEN
    NEW.receiver_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Create triggers for existing tables only
DO $$
BEGIN
  -- Create trigger for properties if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_maintain_properties_receiver_id') THEN
      CREATE TRIGGER trigger_maintain_properties_receiver_id
        BEFORE INSERT OR UPDATE ON properties
        FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
      RAISE NOTICE 'Created trigger for properties table';
    END IF;
  END IF;
  
  -- Create trigger for applications if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_maintain_applications_receiver_id') THEN
      CREATE TRIGGER trigger_maintain_applications_receiver_id
        BEFORE INSERT OR UPDATE ON applications
        FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
      RAISE NOTICE 'Created trigger for applications table';
    END IF;
  END IF;
  
  -- Create trigger for offers if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_maintain_offers_receiver_id') THEN
      CREATE TRIGGER trigger_maintain_offers_receiver_id
        BEFORE INSERT OR UPDATE ON offers
        FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
      RAISE NOTICE 'Created trigger for offers table';
    END IF;
  END IF;
  
  -- Create trigger for guarantors if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_maintain_guarantors_receiver_id') THEN
      CREATE TRIGGER trigger_maintain_guarantors_receiver_id
        BEFORE INSERT OR UPDATE ON guarantors
        FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
      RAISE NOTICE 'Created trigger for guarantors table';
    END IF;
  END IF;
  
  -- Create trigger for documents if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_maintain_documents_receiver_id') THEN
      CREATE TRIGGER trigger_maintain_documents_receiver_id
        BEFORE INSERT OR UPDATE ON documents
        FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
      RAISE NOTICE 'Created trigger for documents table';
    END IF;
  END IF;
  
  -- Create trigger for property_images if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_maintain_property_images_receiver_id') THEN
      CREATE TRIGGER trigger_maintain_property_images_receiver_id
        BEFORE INSERT OR UPDATE ON property_images
        FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
      RAISE NOTICE 'Created trigger for property_images table';
    END IF;
  END IF;
  
  -- Create trigger for user_favorites if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_maintain_user_favorites_receiver_id') THEN
      CREATE TRIGGER trigger_maintain_user_favorites_receiver_id
        BEFORE INSERT OR UPDATE ON user_favorites
        FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
      RAISE NOTICE 'Created trigger for user_favorites table';
    END IF;
  END IF;
END $$;

-- =====================================================
-- STEP 6: ADD COMMENTS FOR DOCUMENTATION (ONLY FOR EXISTING TABLES)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    COMMENT ON COLUMN properties.receiver_id IS 'Duplicates owner_id for better data tracking and relationships';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    COMMENT ON COLUMN applications.receiver_id IS 'Duplicates applicant_id for better data tracking and relationships';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    COMMENT ON COLUMN offers.receiver_id IS 'Duplicates offerer_id for better data tracking and relationships';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    COMMENT ON COLUMN guarantors.receiver_id IS 'Duplicates id for self-reference and better data tracking';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    COMMENT ON COLUMN documents.receiver_id IS 'Duplicates uploader_id for better data tracking and relationships';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    COMMENT ON COLUMN property_images.receiver_id IS 'Duplicates property owner_id for better data tracking and relationships';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    COMMENT ON COLUMN user_favorites.receiver_id IS 'Duplicates user_id for better data tracking and relationships';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Receiver ID columns added successfully to existing tables only!';
  RAISE NOTICE 'Migration completed - only existing tables were modified';
  RAISE NOTICE 'Check the logs above to see which tables were processed';
END $$;
