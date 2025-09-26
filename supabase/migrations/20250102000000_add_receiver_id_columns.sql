/*
  # Add Receiver ID Columns to All Tables
  
  This migration adds receiver_id columns to all relevant tables to duplicate
  the receiver ID for better data tracking and relationships.
  
  ## Tables Modified:
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
*/

-- =====================================================
-- STEP 1: ADD RECEIVER_ID COLUMNS TO ALL TABLES
-- =====================================================

-- 1.1 Add receiver_id to properties table (duplicates owner_id)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 1.2 Add receiver_id to applications table (duplicates applicant_id)
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 1.3 Add receiver_id to offers table (duplicates offerer_id)
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 1.4 Add receiver_id to guarantors table (duplicates id for self-reference)
ALTER TABLE guarantors 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES guarantors(id) ON DELETE CASCADE;

-- 1.5 Add receiver_id to documents table (duplicates uploader_id)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 1.6 Add receiver_id to property_images table (duplicates property owner_id)
ALTER TABLE property_images 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 1.7 Add receiver_id to user_favorites table (duplicates user_id)
ALTER TABLE user_favorites 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: POPULATE RECEIVER_ID COLUMNS WITH EXISTING DATA
-- =====================================================

-- 2.1 Populate receiver_id in properties table
UPDATE properties 
SET receiver_id = owner_id 
WHERE receiver_id IS NULL;

-- 2.2 Populate receiver_id in applications table
UPDATE applications 
SET receiver_id = applicant_id 
WHERE receiver_id IS NULL;

-- 2.3 Populate receiver_id in offers table
UPDATE offers 
SET receiver_id = offerer_id 
WHERE receiver_id IS NULL;

-- 2.4 Populate receiver_id in guarantors table (self-reference)
UPDATE guarantors 
SET receiver_id = id 
WHERE receiver_id IS NULL;

-- 2.5 Populate receiver_id in documents table
UPDATE documents 
SET receiver_id = uploader_id 
WHERE receiver_id IS NULL;

-- 2.6 Populate receiver_id in property_images table
UPDATE property_images 
SET receiver_id = (
  SELECT p.owner_id 
  FROM properties p 
  WHERE p.id = property_images.property_id
)
WHERE receiver_id IS NULL;

-- 2.7 Populate receiver_id in user_favorites table
UPDATE user_favorites 
SET receiver_id = user_id 
WHERE receiver_id IS NULL;

-- =====================================================
-- STEP 3: ADD NOT NULL CONSTRAINTS
-- =====================================================

-- 3.1 Make receiver_id NOT NULL for properties
ALTER TABLE properties 
ALTER COLUMN receiver_id SET NOT NULL;

-- 3.2 Make receiver_id NOT NULL for applications
ALTER TABLE applications 
ALTER COLUMN receiver_id SET NOT NULL;

-- 3.3 Make receiver_id NOT NULL for offers
ALTER TABLE offers 
ALTER COLUMN receiver_id SET NOT NULL;

-- 3.4 Make receiver_id NOT NULL for guarantors
ALTER TABLE guarantors 
ALTER COLUMN receiver_id SET NOT NULL;

-- 3.5 Make receiver_id NOT NULL for documents
ALTER TABLE documents 
ALTER COLUMN receiver_id SET NOT NULL;

-- 3.6 Make receiver_id NOT NULL for property_images
ALTER TABLE property_images 
ALTER COLUMN receiver_id SET NOT NULL;

-- 3.7 Make receiver_id NOT NULL for user_favorites
ALTER TABLE user_favorites 
ALTER COLUMN receiver_id SET NOT NULL;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR RECEIVER_ID COLUMNS
-- =====================================================

-- 4.1 Create indexes for receiver_id columns
CREATE INDEX IF NOT EXISTS idx_properties_receiver_id ON properties(receiver_id);
CREATE INDEX IF NOT EXISTS idx_applications_receiver_id ON applications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_offers_receiver_id ON offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_guarantors_receiver_id ON guarantors(receiver_id);
CREATE INDEX IF NOT EXISTS idx_documents_receiver_id ON documents(receiver_id);
CREATE INDEX IF NOT EXISTS idx_property_images_receiver_id ON property_images(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_receiver_id ON user_favorites(receiver_id);

-- =====================================================
-- STEP 5: UPDATE RLS POLICIES TO INCLUDE RECEIVER_ID
-- =====================================================

-- 5.1 Update properties policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own properties" ON properties;
  DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
  DROP POLICY IF EXISTS "Users can update own properties" ON properties;
  DROP POLICY IF EXISTS "Users can delete own properties" ON properties;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can view own properties"
    ON properties FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id OR auth.uid() = receiver_id);

  CREATE POLICY "Users can insert own properties"
    ON properties FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can update own properties"
    ON properties FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = owner_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can delete own properties"
    ON properties FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id OR auth.uid() = receiver_id);
END $$;

-- 5.2 Update applications policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
  DROP POLICY IF EXISTS "Users can create applications" ON applications;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can view their own applications"
    ON applications FOR SELECT
    TO authenticated
    USING (auth.uid() = applicant_id OR auth.uid() = receiver_id);

  CREATE POLICY "Users can create applications"
    ON applications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = applicant_id AND auth.uid() = receiver_id);
END $$;

-- 5.3 Update offers policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own offers" ON offers;
  DROP POLICY IF EXISTS "Users can create offers" ON offers;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can view their own offers"
    ON offers FOR SELECT
    TO authenticated
    USING (auth.uid() = offerer_id OR auth.uid() = receiver_id);

  CREATE POLICY "Users can create offers"
    ON offers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = offerer_id AND auth.uid() = receiver_id);
END $$;

-- 5.4 Update guarantors policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view guarantors for their applications" ON guarantors;
  DROP POLICY IF EXISTS "Users can insert guarantors" ON guarantors;
  DROP POLICY IF EXISTS "Users can update guarantors for their applications" ON guarantors;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can view guarantors for their applications"
    ON guarantors FOR SELECT
    TO authenticated
    USING (
      id IN (
        SELECT guarantor_id FROM applications 
        WHERE applicant_id = auth.uid() OR property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
      ) OR receiver_id = auth.uid()
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
      ) OR receiver_id = auth.uid()
    );
END $$;

-- 5.5 Update documents policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
  DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
  DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    TO authenticated
    USING (auth.uid() = uploader_id OR auth.uid() = receiver_id);

  CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploader_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploader_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = uploader_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    TO authenticated
    USING (auth.uid() = uploader_id OR auth.uid() = receiver_id);
END $$;

-- 5.6 Update property_images policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Property owners can manage images for their properties" ON property_images;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Property owners can manage images for their properties"
    ON property_images FOR ALL
    TO authenticated
    USING (
      property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      ) OR receiver_id = auth.uid()
    )
    WITH CHECK (
      property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      ) OR receiver_id = auth.uid()
    );
END $$;

-- 5.7 Update user_favorites policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
  DROP POLICY IF EXISTS "Users can add properties to favorites" ON user_favorites;
  DROP POLICY IF EXISTS "Users can remove properties from favorites" ON user_favorites;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can view their own favorites"
    ON user_favorites FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = receiver_id);

  CREATE POLICY "Users can add properties to favorites"
    ON user_favorites FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can remove properties from favorites"
    ON user_favorites FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = receiver_id);
END $$;

-- =====================================================
-- STEP 6: CREATE TRIGGERS TO MAINTAIN RECEIVER_ID CONSISTENCY
-- =====================================================

-- 6.1 Create function to maintain receiver_id consistency
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

-- 6.2 Create triggers for all tables (only if they don't exist)
DO $$
BEGIN
  -- Create trigger for properties if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_properties_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_properties_receiver_id
      BEFORE INSERT OR UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
  
  -- Create trigger for applications if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_applications_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_applications_receiver_id
      BEFORE INSERT OR UPDATE ON applications
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
  
  -- Create trigger for offers if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_offers_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_offers_receiver_id
      BEFORE INSERT OR UPDATE ON offers
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
  
  -- Create trigger for guarantors if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_guarantors_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_guarantors_receiver_id
      BEFORE INSERT OR UPDATE ON guarantors
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
  
  -- Create trigger for documents if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_documents_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_documents_receiver_id
      BEFORE INSERT OR UPDATE ON documents
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
  
  -- Create trigger for property_images if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_property_images_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_property_images_receiver_id
      BEFORE INSERT OR UPDATE ON property_images
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
  
  -- Create trigger for user_favorites if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_user_favorites_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_user_favorites_receiver_id
      BEFORE INSERT OR UPDATE ON user_favorites
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
END $$;

-- =====================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN properties.receiver_id IS 'Duplicates owner_id for better data tracking and relationships';
COMMENT ON COLUMN applications.receiver_id IS 'Duplicates applicant_id for better data tracking and relationships';
COMMENT ON COLUMN offers.receiver_id IS 'Duplicates offerer_id for better data tracking and relationships';
COMMENT ON COLUMN guarantors.receiver_id IS 'Duplicates id for self-reference and better data tracking';
COMMENT ON COLUMN documents.receiver_id IS 'Duplicates uploader_id for better data tracking and relationships';
COMMENT ON COLUMN property_images.receiver_id IS 'Duplicates property owner_id for better data tracking and relationships';
COMMENT ON COLUMN user_favorites.receiver_id IS 'Duplicates user_id for better data tracking and relationships';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Receiver ID columns added successfully to all tables!';
  RAISE NOTICE 'Tables modified: properties, applications, offers, guarantors, documents, property_images, user_favorites';
  RAISE NOTICE 'Indexes created for all receiver_id columns';
  RAISE NOTICE 'RLS policies updated to include receiver_id';
  RAISE NOTICE 'Triggers created to maintain receiver_id consistency';
END $$;
