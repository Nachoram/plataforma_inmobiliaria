/*
  # Add Estacionamientos Column to Properties Migration

  This migration adds the missing 'estacionamientos' (parking spaces) column
  to the properties table to support the parking spaces field in the form.

  ## Changes Made:
  1. Add estacionamientos column to properties table
  2. Add appropriate comments and constraints

  ## New Column Added:
  - estacionamientos INTEGER DEFAULT 0
*/

BEGIN;

-- =====================================================
-- STEP 1: ADD ESTACIONAMIENTOS COLUMN
-- =====================================================

-- Add estacionamientos column to properties table
ALTER TABLE properties ADD COLUMN estacionamientos INTEGER DEFAULT 0;

-- Add check constraint to ensure non-negative values
ALTER TABLE properties ADD CONSTRAINT check_estacionamientos_non_negative
CHECK (estacionamientos >= 0);

-- =====================================================
-- STEP 2: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN properties.estacionamientos IS 'Number of parking spaces available for the property';

COMMIT;
