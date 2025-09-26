/*
  # Add Receiver ID Columns to Missing Tables
  
  This migration adds receiver_id columns to the remaining tables that were
  not included in the previous migration.
  
  ## Tables Modified:
  1. **property_owners** - Add receiver_id (duplicates user_id)
  2. **visit_requests** - Add receiver_id (duplicates user_id)
  
  ## Purpose:
  - Complete the receiver_id implementation across all tables
  - Better data tracking and relationships
  - Simplified queries for receiver-based operations
  - Maintains data consistency with existing IDs
*/

-- =====================================================
-- STEP 1: ADD RECEIVER_ID COLUMNS TO MISSING TABLES
-- =====================================================

-- 1.1 Add receiver_id to property_owners table (duplicates user_id)
ALTER TABLE property_owners 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 1.2 Add receiver_id to visit_requests table (duplicates user_id)
ALTER TABLE visit_requests 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: POPULATE RECEIVER_ID COLUMNS WITH EXISTING DATA
-- =====================================================

-- 2.1 Populate receiver_id in property_owners table
UPDATE property_owners 
SET receiver_id = user_id 
WHERE receiver_id IS NULL;

-- 2.2 Populate receiver_id in visit_requests table
UPDATE visit_requests 
SET receiver_id = user_id 
WHERE receiver_id IS NULL;

-- =====================================================
-- STEP 3: ADD NOT NULL CONSTRAINTS
-- =====================================================

-- 3.1 Make receiver_id NOT NULL for property_owners
ALTER TABLE property_owners 
ALTER COLUMN receiver_id SET NOT NULL;

-- 3.2 Make receiver_id NOT NULL for visit_requests
ALTER TABLE visit_requests 
ALTER COLUMN receiver_id SET NOT NULL;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR RECEIVER_ID COLUMNS
-- =====================================================

-- 4.1 Create indexes for receiver_id columns
CREATE INDEX IF NOT EXISTS idx_property_owners_receiver_id ON property_owners(receiver_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_receiver_id ON visit_requests(receiver_id);

-- =====================================================
-- STEP 5: UPDATE RLS POLICIES TO INCLUDE RECEIVER_ID
-- =====================================================

-- 5.1 Update property_owners policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view property ownership records" ON property_owners;
  DROP POLICY IF EXISTS "Users can insert property ownership records" ON property_owners;
  DROP POLICY IF EXISTS "Users can update property ownership records" ON property_owners;
  DROP POLICY IF EXISTS "Users can delete property ownership records" ON property_owners;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can view property ownership records"
    ON property_owners FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = receiver_id);

  CREATE POLICY "Users can insert property ownership records"
    ON property_owners FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can update property ownership records"
    ON property_owners FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = user_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can delete property ownership records"
    ON property_owners FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = receiver_id);
END $$;

-- 5.2 Update visit_requests policies to include receiver_id
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can create visit requests" ON visit_requests;
  DROP POLICY IF EXISTS "Users can read own visit requests" ON visit_requests;
  DROP POLICY IF EXISTS "Property owners can read visit requests for their properties" ON visit_requests;
  DROP POLICY IF EXISTS "Property owners can update visit requests for their properties" ON visit_requests;
  DROP POLICY IF EXISTS "Property owners can delete visit requests for their properties" ON visit_requests;
  
  -- Create new policies with receiver_id
  CREATE POLICY "Users can create visit requests"
    ON visit_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND auth.uid() = receiver_id);

  CREATE POLICY "Users can read own visit requests"
    ON visit_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = receiver_id);

  CREATE POLICY "Property owners can read visit requests for their properties"
    ON visit_requests FOR SELECT
    TO authenticated
    USING (
      property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      ) OR auth.uid() = receiver_id
    );

  CREATE POLICY "Property owners can update visit requests for their properties"
    ON visit_requests FOR UPDATE
    TO authenticated
    USING (
      property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      ) OR auth.uid() = receiver_id
    );

  CREATE POLICY "Property owners can delete visit requests for their properties"
    ON visit_requests FOR DELETE
    TO authenticated
    USING (
      property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      ) OR auth.uid() = receiver_id
    );
END $$;

-- =====================================================
-- STEP 6: UPDATE TRIGGER FUNCTION TO INCLUDE NEW TABLES
-- =====================================================

-- 6.1 Update the existing function to handle new tables
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
  
  -- For property_owners table
  IF TG_TABLE_NAME = 'property_owners' THEN
    NEW.receiver_id = NEW.user_id;
  END IF;
  
  -- For visit_requests table
  IF TG_TABLE_NAME = 'visit_requests' THEN
    NEW.receiver_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.2 Create triggers for the new tables (only if they don't exist)
DO $$
BEGIN
  -- Create trigger for property_owners if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_property_owners_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_property_owners_receiver_id
      BEFORE INSERT OR UPDATE ON property_owners
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
  
  -- Create trigger for visit_requests if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_maintain_visit_requests_receiver_id'
  ) THEN
    CREATE TRIGGER trigger_maintain_visit_requests_receiver_id
      BEFORE INSERT OR UPDATE ON visit_requests
      FOR EACH ROW EXECUTE FUNCTION maintain_receiver_id_consistency();
  END IF;
END $$;

-- =====================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN property_owners.receiver_id IS 'Duplicates user_id for better data tracking and relationships';
COMMENT ON COLUMN visit_requests.receiver_id IS 'Duplicates user_id for better data tracking and relationships';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Receiver ID columns added successfully to missing tables!';
  RAISE NOTICE 'Tables modified: property_owners, visit_requests';
  RAISE NOTICE 'Indexes created for all receiver_id columns';
  RAISE NOTICE 'RLS policies updated to include receiver_id';
  RAISE NOTICE 'Triggers created to maintain receiver_id consistency';
  RAISE NOTICE 'Function updated to handle all tables';
END $$;
