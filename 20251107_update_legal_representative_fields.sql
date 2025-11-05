-- Actualizar campos del representante legal y eliminar validaciones de RUT
-- Fecha: 7 de noviembre de 2025
-- Descripción: Cambiar de un campo único a campos separados para representante legal,
-- eliminar validaciones de RUT y restricciones relacionadas

-- ========================================
-- TABLA: application_applicants
-- ========================================

-- Agregar campos separados para el representante legal
ALTER TABLE application_applicants
ADD COLUMN IF NOT EXISTS legal_representative_first_name text;

ALTER TABLE application_applicants
ADD COLUMN IF NOT EXISTS legal_representative_paternal_last_name text;

ALTER TABLE application_applicants
ADD COLUMN IF NOT EXISTS legal_representative_maternal_last_name text;

-- Agregar comentarios a las nuevas columnas
COMMENT ON COLUMN application_applicants.legal_representative_first_name IS 'Nombres del representante legal';
COMMENT ON COLUMN application_applicants.legal_representative_paternal_last_name IS 'Apellido paterno del representante legal';
COMMENT ON COLUMN application_applicants.legal_representative_maternal_last_name IS 'Apellido materno del representante legal';

-- ========================================
-- TABLA: application_guarantors
-- ========================================

-- Agregar campos separados para el representante legal
ALTER TABLE application_guarantors
ADD COLUMN IF NOT EXISTS legal_representative_first_name text;

ALTER TABLE application_guarantors
ADD COLUMN IF NOT EXISTS legal_representative_paternal_last_name text;

ALTER TABLE application_guarantors
ADD COLUMN IF NOT EXISTS legal_representative_maternal_last_name text;

-- Agregar comentarios a las nuevas columnas
COMMENT ON COLUMN application_guarantors.legal_representative_first_name IS 'Nombres del representante legal';
COMMENT ON COLUMN application_guarantors.legal_representative_paternal_last_name IS 'Apellido paterno del representante legal';
COMMENT ON COLUMN application_guarantors.legal_representative_maternal_last_name IS 'Apellido materno del representante legal';

-- ========================================
-- ELIMINAR RESTRICCIONES DE RUT
-- ========================================

-- Eliminar la restricción de unicidad de RUT por aplicación (application_applicants)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_rut_per_application'
        AND table_name = 'application_applicants'
    ) THEN
        ALTER TABLE application_applicants DROP CONSTRAINT unique_rut_per_application;
    END IF;
END $$;

-- Eliminar la restricción de unicidad de RUT por aplicación (application_guarantors)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_rut_per_application_guarantors'
        AND table_name = 'application_guarantors'
    ) THEN
        ALTER TABLE application_guarantors DROP CONSTRAINT unique_rut_per_application_guarantors;
    END IF;
END $$;

-- Eliminar la restricción de máximo de postulantes por aplicación
-- (ya no podemos validar esto sin RUT único)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'max_applicants_per_application'
        AND table_name = 'application_applicants'
    ) THEN
        ALTER TABLE application_applicants DROP CONSTRAINT max_applicants_per_application;
    END IF;
END $$;

-- ========================================
-- ÍNDICES PARA LAS NUEVAS COLUMNAS
-- ========================================

-- Crear índices para búsquedas eficientes en los nuevos campos
CREATE INDEX IF NOT EXISTS idx_application_applicants_legal_rep_first_name
ON application_applicants(legal_representative_first_name)
WHERE legal_representative_first_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_application_applicants_legal_rep_paternal_last
ON application_applicants(legal_representative_paternal_last_name)
WHERE legal_representative_paternal_last_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_application_guarantors_legal_rep_first_name
ON application_guarantors(legal_representative_first_name)
WHERE legal_representative_first_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_application_guarantors_legal_rep_paternal_last
ON application_guarantors(legal_representative_paternal_last_name)
WHERE legal_representative_paternal_last_name IS NOT NULL;

-- ========================================
-- NOTA SOBRE MIGRACIÓN DE DATOS EXISTENTES
-- ========================================
/*
Los datos existentes en el campo 'legal_representative_name' no se pueden migrar
automáticamente a los campos separados ya que no hay forma de determinar cómo
separar el nombre completo en nombres y apellidos.

Los registros existentes mantendrán los campos nuevos vacíos. Los usuarios
podrán actualizar esta información cuando editen sus aplicaciones existentes.

Para migrar datos manualmente si es necesario:
UPDATE application_applicants
SET legal_representative_first_name = 'Nombre',
    legal_representative_paternal_last_name = 'ApellidoPaterno',
    legal_representative_maternal_last_name = 'ApellidoMaterno'
WHERE id = 'uuid-específico';
*/
