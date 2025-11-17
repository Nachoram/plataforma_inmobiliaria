-- Migración: Agregar soporte para personas jurídicas en profiles
-- Fecha: 4 de noviembre de 2025
-- Descripción: Esta migración agrega campos para distinguir entre personas naturales y jurídicas en la tabla profiles

-- ========================================
-- AGREGAR COLUMNAS A PROFILES
-- ========================================
-- Agregar columna para tipo de entidad
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS entity_type entity_type_enum NOT NULL DEFAULT 'natural';

-- Agregar campos específicos para personas jurídicas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS company_rut varchar(12),
ADD COLUMN IF NOT EXISTS legal_representative_name text,
ADD COLUMN IF NOT EXISTS legal_representative_rut varchar(12),
ADD COLUMN IF NOT EXISTS constitution_type constitution_type_enum,
ADD COLUMN IF NOT EXISTS constitution_date date,
ADD COLUMN IF NOT EXISTS constitution_cve varchar(50),
ADD COLUMN IF NOT EXISTS constitution_notary text;

-- ========================================
-- VALIDACIONES Y CONSTRAINTS
-- ========================================
-- Para personas naturales, los campos de persona jurídica deben ser NULL
ALTER TABLE profiles
ADD CONSTRAINT profiles_natural_entity_check
CHECK (
    entity_type = 'juridica' OR
    (entity_type = 'natural' AND
     company_name IS NULL AND
     company_rut IS NULL AND
     legal_representative_name IS NULL AND
     legal_representative_rut IS NULL AND
     constitution_type IS NULL AND
     constitution_date IS NULL AND
     constitution_cve IS NULL AND
     constitution_notary IS NULL)
);

-- Para personas jurídicas, ciertos campos son requeridos
ALTER TABLE profiles
ADD CONSTRAINT profiles_juridica_entity_check
CHECK (
    entity_type = 'natural' OR
    (entity_type = 'juridica' AND
     company_name IS NOT NULL AND
     company_rut IS NOT NULL)
);

-- Validación de RUT de empresa (debe ser diferente al RUT personal si existe)
ALTER TABLE profiles
ADD CONSTRAINT profiles_unique_company_rut
EXCLUDE (company_rut WITH =)
WHERE (company_rut IS NOT NULL);

-- ========================================
-- ÍNDICES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_entity_type ON profiles(entity_type);
CREATE INDEX IF NOT EXISTS idx_profiles_company_rut ON profiles(company_rut) WHERE company_rut IS NOT NULL;

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON COLUMN profiles.entity_type IS 'Tipo de entidad: natural (persona física) o juridica (empresa)';
COMMENT ON COLUMN profiles.company_name IS 'Razón social de la empresa (solo para personas jurídicas)';
COMMENT ON COLUMN profiles.company_rut IS 'RUT de la empresa (solo para personas jurídicas)';
COMMENT ON COLUMN profiles.legal_representative_name IS 'Nombre del representante legal (solo para personas jurídicas)';
COMMENT ON COLUMN profiles.legal_representative_rut IS 'RUT del representante legal (solo para personas jurídicas)';
COMMENT ON COLUMN profiles.constitution_type IS 'Tipo de constitución: empresa_un_dia o tradicional (solo para personas jurídicas)';
COMMENT ON COLUMN profiles.constitution_date IS 'Fecha de constitución de la empresa (solo para personas jurídicas)';
COMMENT ON COLUMN profiles.constitution_cve IS 'CVE de constitución (solo para personas jurídicas)';
COMMENT ON COLUMN profiles.constitution_notary IS 'Notaría donde se constituyó la empresa (solo para personas jurídicas)';

-- ========================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- ========================================
-- Todos los profiles existentes son personas naturales por defecto
-- No se requiere migración adicional de datos

-- ========================================
-- VERIFICACIÓN
-- ========================================
DO $$
DECLARE
    total_profiles integer;
    natural_count integer;
    juridica_count integer;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO natural_count FROM profiles WHERE entity_type = 'natural';
    SELECT COUNT(*) INTO juridica_count FROM profiles WHERE entity_type = 'juridica';

    RAISE NOTICE 'Migración de profiles completada:';
    RAISE NOTICE '  - Total de profiles: %', total_profiles;
    RAISE NOTICE '  - Personas naturales: %', natural_count;
    RAISE NOTICE '  - Personas jurídicas: %', juridica_count;
    RAISE NOTICE '  - Nuevos campos agregados: entity_type, company_name, company_rut, legal_representative_name, legal_representative_rut, constitution_type, constitution_date, constitution_cve, constitution_notary';
END $$;
