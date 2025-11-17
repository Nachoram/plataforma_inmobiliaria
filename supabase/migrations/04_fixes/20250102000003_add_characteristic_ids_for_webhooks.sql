/*
  # Add Characteristic IDs for Webhook Searches
  
  This migration adds characteristic ID columns to tables to facilitate
  automated searches in webhooks. These IDs will help identify specific
  records when processing webhook data.
  
  ## Tables to be modified:
  1. **properties** - Add property_characteristic_id
  2. **applications** - Add application_characteristic_id  
  3. **offers** - Add offer_characteristic_id
  4. **guarantors** - Add guarantor_characteristic_id
  5. **documents** - Add document_characteristic_id
  6. **property_images** - Add image_characteristic_id
  7. **user_favorites** - Add favorite_characteristic_id
  
  ## Purpose:
  - Facilitate automated searches in webhooks
  - Provide unique identifiers for webhook processing
  - Improve webhook performance and reliability
  - Enable easier data correlation between systems
*/

-- =====================================================
-- STEP 1: ADD CHARACTERISTIC ID COLUMNS TO ALL TABLES
-- =====================================================

-- 1.1 Add property_characteristic_id to properties table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added property_characteristic_id column to properties table';
  ELSE
    RAISE NOTICE 'Properties table does not exist - skipping';
  END IF;
END $$;

-- 1.2 Add application_characteristic_id to applications table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added application_characteristic_id column to applications table';
  ELSE
    RAISE NOTICE 'Applications table does not exist - skipping';
  END IF;
END $$;

-- 1.3 Add offer_characteristic_id to offers table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    ALTER TABLE offers ADD COLUMN IF NOT EXISTS offer_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added offer_characteristic_id column to offers table';
  ELSE
    RAISE NOTICE 'Offers table does not exist - skipping';
  END IF;
END $$;

-- 1.4 Add guarantor_characteristic_id to guarantors table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS guarantor_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added guarantor_characteristic_id column to guarantors table';
  ELSE
    RAISE NOTICE 'Guarantors table does not exist - skipping';
  END IF;
END $$;

-- 1.5 Add document_characteristic_id to documents table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added document_characteristic_id column to documents table';
  ELSE
    RAISE NOTICE 'Documents table does not exist - skipping';
  END IF;
END $$;

-- 1.6 Add image_characteristic_id to property_images table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    ALTER TABLE property_images ADD COLUMN IF NOT EXISTS image_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added image_characteristic_id column to property_images table';
  ELSE
    RAISE NOTICE 'Property_images table does not exist - skipping';
  END IF;
END $$;

-- 1.7 Add favorite_characteristic_id to user_favorites table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS favorite_characteristic_id text UNIQUE;
    RAISE NOTICE 'Added favorite_characteristic_id column to user_favorites table';
  ELSE
    RAISE NOTICE 'User_favorites table does not exist - skipping';
  END IF;
END $$;

-- =====================================================
-- STEP 2: POPULATE CHARACTERISTIC ID COLUMNS WITH GENERATED VALUES
-- =====================================================

-- 2.1 Populate property_characteristic_id in properties table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    UPDATE properties 
    SET property_characteristic_id = 'PROP_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE property_characteristic_id IS NULL;
    RAISE NOTICE 'Populated property_characteristic_id in properties table';
  END IF;
END $$;

-- 2.2 Populate application_characteristic_id in applications table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    UPDATE applications 
    SET application_characteristic_id = 'APP_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE application_characteristic_id IS NULL;
    RAISE NOTICE 'Populated application_characteristic_id in applications table';
  END IF;
END $$;

-- 2.3 Populate offer_characteristic_id in offers table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    UPDATE offers 
    SET offer_characteristic_id = 'OFFER_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE offer_characteristic_id IS NULL;
    RAISE NOTICE 'Populated offer_characteristic_id in offers table';
  END IF;
END $$;

-- 2.4 Populate guarantor_characteristic_id in guarantors table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    UPDATE guarantors 
    SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE guarantor_characteristic_id IS NULL;
    RAISE NOTICE 'Populated guarantor_characteristic_id in guarantors table';
  END IF;
END $$;

-- 2.5 Populate document_characteristic_id in documents table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    UPDATE documents 
    SET document_characteristic_id = 'DOC_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE document_characteristic_id IS NULL;
    RAISE NOTICE 'Populated document_characteristic_id in documents table';
  END IF;
END $$;

-- 2.6 Populate image_characteristic_id in property_images table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    UPDATE property_images 
    SET image_characteristic_id = 'IMG_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
    WHERE image_characteristic_id IS NULL;
    RAISE NOTICE 'Populated image_characteristic_id in property_images table';
  END IF;
END $$;

-- 2.7 Populate favorite_characteristic_id in user_favorites table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    UPDATE user_favorites 
    SET favorite_characteristic_id = 'FAV_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(user_id::text, 1, 8)
    WHERE favorite_characteristic_id IS NULL;
    RAISE NOTICE 'Populated favorite_characteristic_id in user_favorites table';
  END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE INDEXES FOR CHARACTERISTIC ID COLUMNS
-- =====================================================

-- 3.1 Create indexes for characteristic ID columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_properties_characteristic_id ON properties(property_characteristic_id);
    RAISE NOTICE 'Created index for properties.property_characteristic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_applications_characteristic_id ON applications(application_characteristic_id);
    RAISE NOTICE 'Created index for applications.application_characteristic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_offers_characteristic_id ON offers(offer_characteristic_id);
    RAISE NOTICE 'Created index for offers.offer_characteristic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_guarantors_characteristic_id ON guarantors(guarantor_characteristic_id);
    RAISE NOTICE 'Created index for guarantors.guarantor_characteristic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_documents_characteristic_id ON documents(document_characteristic_id);
    RAISE NOTICE 'Created index for documents.document_characteristic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_property_images_characteristic_id ON property_images(image_characteristic_id);
    RAISE NOTICE 'Created index for property_images.image_characteristic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_user_favorites_characteristic_id ON user_favorites(favorite_characteristic_id);
    RAISE NOTICE 'Created index for user_favorites.favorite_characteristic_id';
  END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE TRIGGER FUNCTION FOR AUTO-GENERATION
-- =====================================================

-- 4.1 Create function to auto-generate characteristic IDs
CREATE OR REPLACE FUNCTION generate_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix text;
    timestamp_part text;
    id_part text;
BEGIN
  -- Determine prefix based on table
  CASE TG_TABLE_NAME
    WHEN 'properties' THEN
      prefix := 'PROP_';
      IF NEW.property_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.property_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'applications' THEN
      prefix := 'APP_';
      IF NEW.application_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.application_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'offers' THEN
      prefix := 'OFFER_';
      IF NEW.offer_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.offer_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'guarantors' THEN
      prefix := 'GUAR_';
      IF NEW.guarantor_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.guarantor_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'documents' THEN
      prefix := 'DOC_';
      IF NEW.document_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.document_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'property_images' THEN
      prefix := 'IMG_';
      IF NEW.image_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.image_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
    WHEN 'user_favorites' THEN
      prefix := 'FAV_';
      IF NEW.favorite_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.user_id::text, 1, 8);
        NEW.favorite_characteristic_id := prefix || timestamp_part || '_' || id_part;
      END IF;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Create triggers for auto-generation
DO $$
BEGIN
  -- Create trigger for properties if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_property_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_property_characteristic_id
        BEFORE INSERT ON properties
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for properties characteristic ID generation';
    END IF;
  END IF;
  
  -- Create trigger for applications if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_application_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_application_characteristic_id
        BEFORE INSERT ON applications
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for applications characteristic ID generation';
    END IF;
  END IF;
  
  -- Create trigger for offers if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_offer_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_offer_characteristic_id
        BEFORE INSERT ON offers
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for offers characteristic ID generation';
    END IF;
  END IF;
  
  -- Create trigger for guarantors if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_guarantor_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_guarantor_characteristic_id
        BEFORE INSERT ON guarantors
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for guarantors characteristic ID generation';
    END IF;
  END IF;
  
  -- Create trigger for documents if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_document_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_document_characteristic_id
        BEFORE INSERT ON documents
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for documents characteristic ID generation';
    END IF;
  END IF;
  
  -- Create trigger for property_images if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_image_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_image_characteristic_id
        BEFORE INSERT ON property_images
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for property_images characteristic ID generation';
    END IF;
  END IF;
  
  -- Create trigger for user_favorites if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_favorite_characteristic_id') THEN
      CREATE TRIGGER trigger_generate_favorite_characteristic_id
        BEFORE INSERT ON user_favorites
        FOR EACH ROW EXECUTE FUNCTION generate_characteristic_id();
      RAISE NOTICE 'Created trigger for user_favorites characteristic ID generation';
    END IF;
  END IF;
END $$;

-- =====================================================
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    COMMENT ON COLUMN properties.property_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') THEN
    COMMENT ON COLUMN applications.application_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    COMMENT ON COLUMN offers.offer_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') THEN
    COMMENT ON COLUMN guarantors.guarantor_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    COMMENT ON COLUMN documents.document_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') THEN
    COMMENT ON COLUMN property_images.image_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
    COMMENT ON COLUMN user_favorites.favorite_characteristic_id IS 'Unique characteristic ID for webhook searches and automated processing';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Characteristic ID columns added successfully for webhook searches!';
  RAISE NOTICE 'Migration completed - all tables now have characteristic IDs';
  RAISE NOTICE 'Format: PREFIX_TIMESTAMP_UUID_PART (e.g., PROP_1704067200_a1b2c3d4)';
  RAISE NOTICE 'Check the logs above to see which tables were processed';
END $$;
