-- Migration: Add property type and owner fields
-- Date: 2025-10-15
-- Description: Adds tipo_propiedad column to properties and owner type fields to profiles
-- Note: tipo_propiedad_enum already exists from previous migration 20251015120000

-- Begin transaction
BEGIN;

-- ========= PARTE 1: TIPO DE PROPIEDAD =========
-- Note: tipo_propiedad_enum already exists, only adding the column if it doesn't exist

-- Check if tipo_propiedad column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'properties'
    AND column_name = 'tipo_propiedad'
  ) THEN
    ALTER TABLE public.properties
    ADD COLUMN tipo_propiedad tipo_propiedad_enum;
  END IF;
END $$;

-- ========= PARTE 2: TIPO DE PROPIETARIO (PERSONA NATURAL/JURÍDICA) =========

-- 2.1. Crea un nuevo tipo ENUM para las opciones de propietario.
CREATE TYPE tipo_persona_enum AS ENUM (
  'Persona Natural',
  'Persona Jurídica'
);

-- 2.2. Altera la tabla de perfiles/usuarios para añadir campos de tipo de persona
ALTER TABLE public.profiles
  -- Añade la columna para guardar el tipo de persona.
  ADD COLUMN IF NOT EXISTS tipo_persona tipo_persona_enum DEFAULT 'Persona Natural',

  -- Añade las columnas específicas para Persona Jurídica (pueden ser NULL).
  ADD COLUMN IF NOT EXISTS razon_social TEXT,
  ADD COLUMN IF NOT EXISTS rut_empresa VARCHAR(12);

-- Finaliza la transacción y aplica los cambios
COMMIT;
