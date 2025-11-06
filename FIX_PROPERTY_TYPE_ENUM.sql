-- Fix Property Type Enum Migration
-- Run this script in your Supabase SQL Editor to fix the enum issue

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

-- Verify the enum now has all values
SELECT
  enumtypid::regtype as enum_type,
  enumlabel as value
FROM pg_enum
WHERE enumtypid = 'tipo_propiedad_enum'::regtype
ORDER BY enumsortorder;

















