-- Migration: Add ubicacion_bodega field to properties table
-- Purpose: Add storage location field for office properties
-- This field stores the location/number of storage units in office buildings

BEGIN;

-- Add ubicacion_bodega column to properties table (if not exists)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS ubicacion_bodega VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN properties.ubicacion_bodega IS 'Location or number of the storage unit (bodega) in office buildings. Optional field with max 100 characters.';

COMMIT;
