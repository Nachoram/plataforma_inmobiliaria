-- Migration: Add property type enum to properties table
-- Date: 2025-10-15
-- Description: Adds a tipo_propiedad column with enum type to store property type (Casa, Departamento, Oficina)

-- Begin transaction
BEGIN;

-- Create the enum type for property types
CREATE TYPE tipo_propiedad_enum AS ENUM (
  'Casa',
  'Departamento',
  'Oficina'
);

-- Add the tipo_propiedad column to the properties table
ALTER TABLE public.properties
ADD COLUMN tipo_propiedad tipo_propiedad_enum;

-- Commit transaction
COMMIT;
