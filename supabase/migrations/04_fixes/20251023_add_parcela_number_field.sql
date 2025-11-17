-- Migration: Add parcela_number field for Parcela property type
-- Purpose: Add optional parcela_number column to store parcela identification
-- This field is only applicable for 'Parcela' property type

BEGIN;

-- Add parcela_number column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS parcela_number VARCHAR(30);

-- Add comment for documentation
COMMENT ON COLUMN properties.parcela_number IS 'Optional parcela number/identification - only applicable for Parcela property type. Maximum 30 characters.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_properties_parcela_number ON properties(parcela_number) WHERE parcela_number IS NOT NULL;

COMMIT;
