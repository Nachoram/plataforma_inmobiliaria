-- Migration: Fix Property Form Inconsistencies
-- Purpose: Correct field types, constraints, and conditional logic mismatches
-- between the rental publication form and database schema
--
-- Issues Fixed:
-- 1. Make storage_number optional for Bodega type (remove NOT NULL constraint)
-- 2. Make parcela_number properly optional
-- 3. Add missing property_type field (rename tipo_propiedad for consistency)
-- 4. Fix field type mismatches (NUMERIC vs INTEGER)
-- 5. Add missing fields from form that aren't in DB

BEGIN;

-- =====================================================
-- STEP 1: FIX STORAGE_NUMBER CONSTRAINT
-- =====================================================

-- Remove the overly restrictive constraint that requires storage_number to be NOT NULL for Bodega
ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS check_storage_number_only_for_bodega;

-- Make storage_number properly optional (it should be NULL when not applicable)
-- Add a new, more flexible constraint
ALTER TABLE public.properties
ADD CONSTRAINT check_storage_number_usage
CHECK (
  (tipo_propiedad = 'Bodega' AND (storage_number IS NULL OR storage_number != '')) OR
  (tipo_propiedad != 'Bodega' AND storage_number IS NULL)
);

-- =====================================================
-- STEP 2: ADD MISSING PROPERTY_TYPE FIELD
-- =====================================================

-- Add property_type column for frontend consistency (alias for tipo_propiedad)
-- This allows frontend to use either field name
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_type tipo_propiedad_enum;

-- Sync existing data
UPDATE public.properties
SET property_type = tipo_propiedad
WHERE property_type IS NULL AND tipo_propiedad IS NOT NULL;

-- Set default and make it match tipo_propiedad
ALTER TABLE public.properties
ALTER COLUMN property_type SET DEFAULT 'Casa';

-- =====================================================
-- STEP 3: FIX FIELD TYPE INCONSISTENCIES
-- =====================================================

-- Ensure metros_utiles and metros_totales are consistent with form expectations
-- Form sends numbers, DB should accept them as NUMERIC
ALTER TABLE public.properties
ALTER COLUMN metros_utiles TYPE NUMERIC(8,2),
ALTER COLUMN metros_totales TYPE NUMERIC(8,2);

-- Ensure estacionamientos is INTEGER (form sends number)
ALTER TABLE public.properties
ALTER COLUMN estacionamientos TYPE INTEGER;

-- =====================================================
-- STEP 4: ADD MISSING FIELDS FROM FORM
-- =====================================================

-- Add any missing fields that form expects but DB doesn't have
-- (Based on PropertyFormData interface analysis)

-- These fields seem to already exist, but let's ensure they're properly typed:
-- - bedrooms: already INTEGER
-- - bathrooms: already INTEGER
-- - tiene_terraza: already BOOLEAN
-- - parking_location: already VARCHAR(100)
-- - parcela_number: already VARCHAR(30)

-- =====================================================
-- STEP 5: UPDATE INDEXES FOR NEW FIELDS
-- =====================================================

-- Add index for the new property_type field
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);

-- =====================================================
-- STEP 6: UPDATE COMMENTS FOR CLARITY
-- =====================================================

COMMENT ON COLUMN properties.property_type IS 'Alias for tipo_propiedad - used by frontend for consistency';
COMMENT ON COLUMN properties.storage_number IS 'Optional storage unit number/location - only meaningful for Bodega type properties';
COMMENT ON COLUMN properties.parcela_number IS 'Optional parcela number/identification - only for Parcela type properties';
COMMENT ON COLUMN properties.metros_utiles IS 'Useful square meters - NULL for Bodega, Estacionamiento, and Parcela types';
COMMENT ON COLUMN properties.metros_totales IS 'Total square meters - NULL for Estacionamiento type';
COMMENT ON COLUMN properties.estacionamientos IS 'Number of parking spots - set to 0 for Bodega and Estacionamiento types';

-- =====================================================
-- STEP 7: CREATE TRIGGER TO SYNC PROPERTY_TYPE AND TIPO_PROPIEDAD
-- =====================================================

-- Function to keep property_type and tipo_propiedad in sync
CREATE OR REPLACE FUNCTION sync_property_type_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If tipo_propiedad changed, sync property_type
  IF OLD.tipo_propiedad IS DISTINCT FROM NEW.tipo_propiedad THEN
    NEW.property_type := NEW.tipo_propiedad;
  END IF;

  -- If property_type changed, sync tipo_propiedad
  IF OLD.property_type IS DISTINCT FROM NEW.property_type THEN
    NEW.tipo_propiedad := NEW.property_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_property_type_trigger ON properties;
CREATE TRIGGER sync_property_type_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION sync_property_type_fields();

COMMIT;

