-- =====================================================
-- Add property_type field to properties table
-- =====================================================

-- Create enum for property types (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type_enum') THEN
        CREATE TYPE property_type_enum AS ENUM (
          'Casa',
          'Departamento',
          'Oficina',
          'Local Comercial',
          'Estacionamiento',
          'Bodega',
          'Parcela'
        );
        RAISE NOTICE 'Created property_type_enum type';
    ELSE
        RAISE NOTICE 'property_type_enum type already exists, skipping creation';
    END IF;
END $$;

-- Add property_type column to properties table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'property_type'
    ) THEN
        ALTER TABLE properties
        ADD COLUMN property_type property_type_enum DEFAULT 'Casa';
        RAISE NOTICE 'Added property_type column to properties table';
    ELSE
        RAISE NOTICE 'property_type column already exists, skipping addition';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);

-- Add comment for documentation
COMMENT ON COLUMN properties.property_type IS 'Tipo de propiedad (Casa, Departamento, Oficina, etc.)';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Property type column added successfully!';
  RAISE NOTICE 'Available types: Casa, Departamento, Oficina, Local Comercial, Estacionamiento, Bodega, Parcela';
END $$;

