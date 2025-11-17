-- Migration: Add property_type field to properties table
-- Purpose: Store the type of property (Casa, Departamento, Oficina, Estacionamiento, Bodega, Parcela)
-- This field is essential for contract generation and webhook integration

BEGIN;

-- Update existing enum to include all property types
DO $$ BEGIN
  -- First, check if the old enum exists and update it
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_propiedad_enum') THEN
    -- Add missing enum values to the existing tipo_propiedad_enum
    ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Estacionamiento';
    ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Bodega';
    ALTER TYPE tipo_propiedad_enum ADD VALUE IF NOT EXISTS 'Parcela';
    RAISE NOTICE 'Updated existing tipo_propiedad_enum with new values';
  ELSE
    -- Create new enum if it doesn't exist (fallback)
    CREATE TYPE tipo_propiedad_enum AS ENUM (
      'Casa',
      'Departamento',
      'Oficina',
      'Estacionamiento',
      'Bodega',
      'Parcela'
    );
    RAISE NOTICE 'Created new tipo_propiedad_enum';
  END IF;
END $$;

-- Add property_type column to properties table (if not exists)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS tipo_propiedad tipo_propiedad_enum DEFAULT 'Casa';

-- Add comment for documentation
COMMENT ON COLUMN properties.tipo_propiedad IS 'Type of property: Casa, Departamento, Oficina, Estacionamiento, Bodega, or Parcela. Essential for contract generation and webhook integration.';

-- Create index for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_properties_tipo_propiedad ON properties(tipo_propiedad);

COMMIT;
