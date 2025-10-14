/*
  # Add Bodega Fields to Properties Migration

  This migration adds bodega (storage unit) fields to the properties table
  to support the new form fields for property publication.

  ## Changes Made:
  1. Add tiene_bodega column (BOOLEAN) - indicates if property has storage
  2. Add metros_bodega column (INTEGER) - size of storage in square meters

  ## Tables Modified:
  - properties: Add bodega-related columns

  ## New Columns Added to properties:
  - tiene_bodega (BOOLEAN DEFAULT false)
  - metros_bodega (INTEGER)
*/

BEGIN;

-- =====================================================
-- ADD BODEGA FIELDS TO PROPERTIES TABLE
-- =====================================================

-- Add bodega indicator column
ALTER TABLE properties ADD COLUMN tiene_bodega BOOLEAN DEFAULT false;

-- Add bodega size column (only applicable when tiene_bodega is true)
ALTER TABLE properties ADD COLUMN metros_bodega INTEGER;

-- Add constraint to ensure metros_bodega is only set when tiene_bodega is true
ALTER TABLE properties ADD CONSTRAINT check_metros_bodega_when_tiene_bodega
  CHECK (
    (tiene_bodega = false AND metros_bodega IS NULL) OR
    (tiene_bodega = true AND metros_bodega IS NOT NULL AND metros_bodega > 0)
  );

-- Add constraint to ensure metros_bodega is positive when present
ALTER TABLE properties ADD CONSTRAINT check_metros_bodega_positive
  CHECK (metros_bodega IS NULL OR metros_bodega > 0);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN properties.tiene_bodega IS 'Whether the property has a storage unit/bodega';
COMMENT ON COLUMN properties.metros_bodega IS 'Square meters of the storage unit (only applicable when tiene_bodega is true)';

COMMIT;
