-- Migration: Add conditional property fields for dynamic form behavior
-- Purpose: Add storage_number field and make certain fields optional based on property type
-- This enables dynamic form behavior where fields are shown/hidden based on property type

BEGIN;

-- Add storage_number column for Bodega type properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS storage_number VARCHAR(50);

-- Add parking_location column for parking space location details
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS parking_location VARCHAR(100);

-- Make certain fields optional (they were already nullable but let's ensure proper constraints)
-- These fields should be NULL for certain property types (Bodega, Estacionamiento)

-- Comments for documentation
COMMENT ON COLUMN properties.storage_number IS 'Storage unit number/location - only applicable for Bodega type properties';
COMMENT ON COLUMN properties.parking_location IS 'Parking space location/details - only applicable when parking_spots > 0';

-- Create constraint to ensure storage_number is only set for Bodega type
ALTER TABLE public.properties
ADD CONSTRAINT check_storage_number_only_for_bodega
CHECK (
  (tipo_propiedad = 'Bodega' AND storage_number IS NOT NULL AND storage_number != '') OR
  (tipo_propiedad != 'Bodega' AND storage_number IS NULL)
);

-- Create constraint to ensure parking_location is only meaningful when there are parking spots
ALTER TABLE public.properties
ADD CONSTRAINT check_parking_location_only_with_parking
CHECK (
  (estacionamientos > 0 AND parking_location IS NOT NULL) OR
  (estacionamientos = 0 OR estacionamientos IS NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_storage_number ON properties(storage_number) WHERE storage_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_parking_location ON properties(parking_location) WHERE parking_location IS NOT NULL;

COMMIT;
