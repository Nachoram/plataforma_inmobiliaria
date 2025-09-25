-- =====================================================
-- CREATE SEPARATE OWNER TABLES FOR RENTAL AND SALE PROPERTIES
-- =====================================================

-- Create rental owners table
CREATE TABLE IF NOT EXISTS rental_owners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  paternal_last_name text NOT NULL,
  maternal_last_name text,
  rut varchar(12) NOT NULL,
  address_street text,
  address_number varchar(10),
  address_department varchar(10),
  address_commune text,
  address_region text,
  marital_status marital_status_enum DEFAULT 'soltero',
  property_regime property_regime_enum,
  phone varchar(20),
  email varchar(255),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sale owners table
CREATE TABLE IF NOT EXISTS sale_owners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  paternal_last_name text NOT NULL,
  maternal_last_name text,
  rut varchar(12) NOT NULL,
  address_street text,
  address_number varchar(10),
  address_department varchar(10),
  address_commune text,
  address_region text,
  marital_status marital_status_enum DEFAULT 'soltero',
  property_regime property_regime_enum,
  phone varchar(20),
  email varchar(255),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Rental owners indexes
CREATE INDEX IF NOT EXISTS idx_rental_owners_property_id ON rental_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_owners_rut ON rental_owners(rut);
CREATE INDEX IF NOT EXISTS idx_rental_owners_created_at ON rental_owners(created_at);

-- Sale owners indexes
CREATE INDEX IF NOT EXISTS idx_sale_owners_property_id ON sale_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_sale_owners_rut ON sale_owners(rut);
CREATE INDEX IF NOT EXISTS idx_sale_owners_created_at ON sale_owners(created_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE rental_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_owners ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Rental owners policies
CREATE POLICY "Users can view rental owners for their properties"
  ON rental_owners FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rental owners for their properties"
  ON rental_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rental owners for their properties"
  ON rental_owners FOR UPDATE
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

CREATE POLICY "Users can delete rental owners for their properties"
  ON rental_owners FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Sale owners policies
CREATE POLICY "Users can view sale owners for their properties"
  ON sale_owners FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sale owners for their properties"
  ON sale_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sale owners for their properties"
  ON sale_owners FOR UPDATE
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

CREATE POLICY "Users can delete sale owners for their properties"
  ON sale_owners FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for rental_owners
CREATE TRIGGER update_rental_owners_updated_at
  BEFORE UPDATE ON rental_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for sale_owners
CREATE TRIGGER update_sale_owners_updated_at
  BEFORE UPDATE ON sale_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON rental_owners TO authenticated;
GRANT ALL ON sale_owners TO authenticated;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE rental_owners IS 'Property owners information for rental properties';
COMMENT ON TABLE sale_owners IS 'Property owners information for sale properties';

COMMENT ON COLUMN rental_owners.property_id IS 'Reference to the rental property';
COMMENT ON COLUMN rental_owners.rut IS 'Chilean national identification number (RUT)';
COMMENT ON COLUMN rental_owners.marital_status IS 'Marital status affecting property regime';
COMMENT ON COLUMN rental_owners.property_regime IS 'Property regime for married couples (null if not married)';

COMMENT ON COLUMN sale_owners.property_id IS 'Reference to the sale property';
COMMENT ON COLUMN sale_owners.rut IS 'Chilean national identification number (RUT)';
COMMENT ON COLUMN sale_owners.marital_status IS 'Marital status affecting property regime';
COMMENT ON COLUMN sale_owners.property_regime IS 'Property regime for married couples (null if not married)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Rental and Sale Owners tables created successfully!';
  RAISE NOTICE 'Tables created: rental_owners, sale_owners';
  RAISE NOTICE 'RLS policies enabled on both tables';
  RAISE NOTICE 'Indexes and triggers created';
END $$;
