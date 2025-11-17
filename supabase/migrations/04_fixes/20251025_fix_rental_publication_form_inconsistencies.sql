-- Migration: Fix Rental Publication Form Inconsistencies
-- Purpose: Correct field types, constraints, and conditional logic mismatches
-- between the RentalPublicationForm.tsx and database schema
--
-- Issues Fixed:
-- 1. Add missing fields used by RentalPublicationForm: numeroBodega, metrosBodega, ubicacion_bodega, etc.
-- 2. Fix constraint conflicts for storage_number vs numeroBodega
-- 3. Ensure all conditional fields work properly for different property types
-- 4. Add missing ENUM values and proper field mappings

BEGIN;

-- =====================================================
-- STEP 1: ADD MISSING FIELDS USED BY RENTAL FORM
-- =====================================================

-- Add numeroBodega field (used by RentalPublicationForm for Bodega type)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS numero_bodega VARCHAR(50);

-- Add storage_number field (legacy compatibility, if not exists)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS storage_number VARCHAR(50);

-- Add metros_bodega field (for office storage)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS metros_bodega NUMERIC(8,2);

-- Add ubicacion_bodega field (for office storage location)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS ubicacion_bodega VARCHAR(100);

-- Add ubicacion_estacionamiento field (parking location)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS ubicacion_estacionamiento VARCHAR(100);

-- Add tiene_bodega field (boolean for offices)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS tiene_bodega BOOLEAN DEFAULT false;

-- =====================================================
-- STEP 2: FIX CONSTRAINT CONFLICTS
-- =====================================================

-- Remove the overly restrictive storage_number constraint
-- The form uses both storage_number and numeroBodega, need to allow flexibility
ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS check_storage_number_only_for_bodega;

-- Create a more flexible constraint that allows either field to be used
ALTER TABLE public.properties
ADD CONSTRAINT check_storage_fields_consistency
CHECK (
  -- For Bodega: at least one storage identifier should be provided
  (tipo_propiedad = 'Bodega' AND (
    (storage_number IS NOT NULL AND storage_number != '') OR
    (numero_bodega IS NOT NULL AND numero_bodega != '')
  )) OR
  -- For other types: both should be null
  (tipo_propiedad != 'Bodega' AND storage_number IS NULL AND numero_bodega IS NULL)
);

-- =====================================================
-- STEP 3: VERIFY FIELD TYPES (No changes needed - columns are already INTEGER)
-- =====================================================

-- Note: bedrooms, bathrooms, and estacionamientos are already INTEGER type
-- No ALTER COLUMN statements needed for these fields

-- =====================================================
-- STEP 4: ADD MISSING ENUM VALUES
-- =====================================================

-- Ensure all property types used by the form are in the enum
DO $$ BEGIN
  -- Add any missing enum values if needed
  ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Casa';
  ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Departamento';
  ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Oficina';
  ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Local Comercial';
  ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Estacionamiento';
  ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Bodega';
  ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Parcela';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Enum values already exist, skipping...';
END $$;

-- =====================================================
-- STEP 5: UPDATE COMMENTS FOR CLARITY
-- =====================================================

COMMENT ON COLUMN properties.numero_bodega IS 'Storage unit number - alternative field for Bodega type (used by RentalPublicationForm)';
COMMENT ON COLUMN properties.storage_number IS 'Legacy storage unit number field - maintained for backward compatibility';
COMMENT ON COLUMN properties.metros_bodega IS 'Square meters of storage space in offices';
COMMENT ON COLUMN properties.ubicacion_bodega IS 'Location of storage space in offices';
COMMENT ON COLUMN properties.ubicacion_estacionamiento IS 'Parking space location/number';
COMMENT ON COLUMN properties.tiene_bodega IS 'Whether the property (office) has storage space';

-- =====================================================
-- STEP 6: ADD INDEXES FOR NEW FIELDS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_properties_numero_bodega ON properties(numero_bodega) WHERE numero_bodega IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_storage_number ON properties(storage_number) WHERE storage_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_metros_bodega ON properties(metros_bodega) WHERE metros_bodega IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_tiene_bodega ON properties(tiene_bodega) WHERE tiene_bodega = true;

-- =====================================================
-- STEP 7: DATA MIGRATION FOR EXISTING RECORDS
-- =====================================================

-- Sync storage_number and numero_bodega for existing Bodega records
-- If numero_bodega is empty but storage_number has data, copy it
UPDATE public.properties
SET numero_bodega = storage_number
WHERE numero_bodega IS NULL
  AND storage_number IS NOT NULL
  AND storage_number != ''
  AND tipo_propiedad = 'Bodega';

-- If storage_number is empty but numero_bodega has data, copy it
UPDATE public.properties
SET storage_number = numero_bodega
WHERE storage_number IS NULL
  AND numero_bodega IS NOT NULL
  AND numero_bodega != ''
  AND tipo_propiedad = 'Bodega';

COMMIT;
