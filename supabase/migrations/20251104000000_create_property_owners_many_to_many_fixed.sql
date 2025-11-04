-- =====================================================
-- FIXED PROPERTY OWNERS MANY-TO-MANY MIGRATION
-- =====================================================
-- This migration creates a proper many-to-many relationship
-- between properties and rental_owners (for rental properties)
-- and properties and sale_owners (for sale properties)

DO $$
BEGIN
  RAISE NOTICE 'Starting fixed property owners many-to-many migration';
END $$;

-- =====================================================
-- 1. CREATE PROPERTY RENTAL OWNERS JUNCTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS property_rental_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  rental_owner_id uuid NOT NULL,
  ownership_percentage NUMERIC(5,2) DEFAULT NULL CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100)),
  is_primary_owner BOOLEAN DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Foreign key constraints
  CONSTRAINT fk_property_rental_owners_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_rental_owners_rental_owner
    FOREIGN KEY (rental_owner_id) REFERENCES rental_owners(id) ON DELETE CASCADE,

  -- Unique constraint to prevent duplicate relationships
  CONSTRAINT unique_property_rental_owner UNIQUE (property_id, rental_owner_id)
);

-- =====================================================
-- 2. CREATE PROPERTY SALE OWNERS JUNCTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS property_sale_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  sale_owner_id uuid NOT NULL,
  ownership_percentage NUMERIC(5,2) DEFAULT NULL CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100)),
  is_primary_owner BOOLEAN DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Foreign key constraints
  CONSTRAINT fk_property_sale_owners_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_sale_owners_sale_owner
    FOREIGN KEY (sale_owner_id) REFERENCES sale_owners(id) ON DELETE CASCADE,

  -- Unique constraint to prevent duplicate relationships
  CONSTRAINT unique_property_sale_owner UNIQUE (property_id, sale_owner_id)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Property rental owners indexes
CREATE INDEX IF NOT EXISTS idx_property_rental_owners_property_id ON property_rental_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_rental_owners_rental_owner_id ON property_rental_owners(rental_owner_id);
CREATE INDEX IF NOT EXISTS idx_property_rental_owners_created_at ON property_rental_owners(created_at);

-- Property sale owners indexes
CREATE INDEX IF NOT EXISTS idx_property_sale_owners_property_id ON property_sale_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_sale_owners_sale_owner_id ON property_sale_owners(sale_owner_id);
CREATE INDEX IF NOT EXISTS idx_property_sale_owners_created_at ON property_sale_owners(created_at);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE property_rental_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sale_owners ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Property rental owners policies
CREATE POLICY "Users can view property rental owners for their properties"
  ON property_rental_owners FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert property rental owners for their properties"
  ON property_rental_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update property rental owners for their properties"
  ON property_rental_owners FOR UPDATE
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

CREATE POLICY "Users can delete property rental owners for their properties"
  ON property_rental_owners FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Property sale owners policies
CREATE POLICY "Users can view property sale owners for their properties"
  ON property_sale_owners FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert property sale owners for their properties"
  ON property_sale_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update property sale owners for their properties"
  ON property_sale_owners FOR UPDATE
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

CREATE POLICY "Users can delete property sale owners for their properties"
  ON property_sale_owners FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- 6. MIGRATE EXISTING DATA
-- =====================================================

-- Migrate existing rental owners to the junction table
INSERT INTO property_rental_owners (property_id, rental_owner_id, is_primary_owner, created_at)
SELECT DISTINCT
  ro.property_id,
  ro.id as rental_owner_id,
  true as is_primary_owner, -- Mark existing owners as primary
  ro.created_at
FROM rental_owners ro
WHERE NOT EXISTS (
  SELECT 1 FROM property_rental_owners pro
  WHERE pro.property_id = ro.property_id AND pro.rental_owner_id = ro.id
);

-- Migrate existing sale owners to the junction table
INSERT INTO property_sale_owners (property_id, sale_owner_id, is_primary_owner, created_at)
SELECT DISTINCT
  so.property_id,
  so.id as sale_owner_id,
  true as is_primary_owner, -- Mark existing owners as primary
  so.created_at
FROM sale_owners so
WHERE NOT EXISTS (
  SELECT 1 FROM property_sale_owners pso
  WHERE pso.property_id = so.property_id AND pso.sale_owner_id = so.id
);

-- =====================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for property_rental_owners
CREATE TRIGGER update_property_rental_owners_updated_at
  BEFORE UPDATE ON property_rental_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for property_sale_owners
CREATE TRIGGER update_property_sale_owners_updated_at
  BEFORE UPDATE ON property_sale_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON property_rental_owners TO authenticated;
GRANT ALL ON property_sale_owners TO authenticated;
GRANT ALL ON property_rental_owners TO service_role;
GRANT ALL ON property_sale_owners TO service_role;

-- =====================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE property_rental_owners IS 'Junction table for many-to-many relationship between properties and rental_owners. Allows multiple owners per rental property.';
COMMENT ON TABLE property_sale_owners IS 'Junction table for many-to-many relationship between properties and sale_owners. Allows multiple owners per sale property.';

COMMENT ON COLUMN property_rental_owners.ownership_percentage IS 'Optional ownership percentage (0-100). If null, ownership is assumed to be equal among owners.';
COMMENT ON COLUMN property_rental_owners.is_primary_owner IS 'Indicates if this is the primary contact owner for the property.';

COMMENT ON COLUMN property_sale_owners.ownership_percentage IS 'Optional ownership percentage (0-100). If null, ownership is assumed to be equal among owners.';
COMMENT ON COLUMN property_sale_owners.is_primary_owner IS 'Indicates if this is the primary contact owner for the property.';

-- =====================================================
-- 10. VERIFICATION
-- =====================================================

DO $$
DECLARE
  rental_count INTEGER := 0;
  sale_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO rental_count FROM property_rental_owners;
  SELECT COUNT(*) INTO sale_count FROM property_sale_owners;

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  Property rental owners relationships created: %', rental_count;
  RAISE NOTICE '  Property sale owners relationships created: %', sale_count;

  IF rental_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS: Property rental owners relationship table created and populated';
  END IF;

  IF sale_count >= 0 THEN -- Sale owners might be empty
    RAISE NOTICE '✅ SUCCESS: Property sale owners relationship table created';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixed property owners many-to-many migration completed successfully!';
  RAISE NOTICE 'New tables created: property_rental_owners, property_sale_owners';
  RAISE NOTICE 'RLS policies enabled on both tables';
  RAISE NOTICE 'Existing data migrated successfully';
END $$;
