-- Migración: Crear SOLO las tablas puente (sin migración de datos)
-- Fecha: 4 de noviembre de 2025
-- Descripción: Esta migración crea las tablas application_applicants y application_guarantors
-- SIN migrar datos existentes. La migración de datos se hace en un archivo separado.

-- ========================================
-- INICIAR TRANSACCIÓN PARA CONTROLAR ORDEN
-- ========================================
BEGIN;

-- ========================================
-- PASO 1: CREAR ENUMS
-- ========================================
-- Crear enum para tipo de entidad si no existe
DO $$ BEGIN
    CREATE TYPE entity_type_enum AS ENUM ('natural', 'juridica');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear enum para tipo de constitución si no existe
DO $$ BEGIN
    CREATE TYPE constitution_type_enum AS ENUM ('empresa_un_dia', 'tradicional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- TABLA: application_applicants
-- ========================================
-- Tabla puente para múltiples postulantes por aplicación
CREATE TABLE IF NOT EXISTS application_applicants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Tipo de entidad (natural/juridica)
    entity_type entity_type_enum NOT NULL DEFAULT 'natural',

    -- Campos comunes para ambas entidades
    first_name text NOT NULL,
    paternal_last_name text,
    maternal_last_name text,
    rut varchar(12) NOT NULL,
    profession text,
    monthly_income_clp bigint,
    age integer,
    nationality text DEFAULT 'Chilena',
    marital_status marital_status_enum,
    address_street text,
    address_number varchar(10),
    address_department varchar(10),
    address_commune text,
    address_region text,
    phone varchar(20),
    email text,

    -- Campos específicos para personas jurídicas
    company_name text, -- Razón social
    company_rut varchar(12), -- RUT empresa
    legal_representative_name text, -- Representante legal
    legal_representative_rut varchar(12), -- RUT representante legal
    constitution_type constitution_type_enum, -- 'empresa_un_dia' o 'tradicional'
    constitution_date date, -- Fecha constitución
    constitution_cve varchar(50), -- CVE constitución
    constitution_notary text, -- Notaría constitución

    -- Control de creación
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),

    -- Restricciones
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('natural', 'juridica')),
    CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 18 AND age <= 120)),
    CONSTRAINT valid_income CHECK (monthly_income_clp IS NULL OR monthly_income_clp >= 0),

    -- Validaciones condicionales para personas naturales
    CONSTRAINT natural_requires_last_names CHECK (
        entity_type = 'natural' OR
        (entity_type = 'juridica' AND paternal_last_name IS NULL AND maternal_last_name IS NULL) OR
        (entity_type = 'natural' AND paternal_last_name IS NOT NULL)
    ),

    -- Validaciones condicionales para personas jurídicas
    CONSTRAINT juridica_requires_company_data CHECK (
        entity_type = 'natural' OR
        (entity_type = 'juridica' AND company_name IS NOT NULL AND company_rut IS NOT NULL)
    ),

    -- Unicidad de RUT por aplicación (no puede haber dos postulantes con mismo RUT en una aplicación)
    CONSTRAINT unique_rut_per_application UNIQUE (application_id, rut),

    -- Máximo 3 postulantes por aplicación
    CONSTRAINT max_applicants_per_application CHECK (
        (SELECT COUNT(*) FROM application_applicants WHERE application_id = application_applicants.application_id) <= 3
    )
);

-- ========================================
-- TABLA: application_guarantors
-- ========================================
-- Tabla puente para múltiples avales por aplicación
CREATE TABLE IF NOT EXISTS application_guarantors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Tipo de entidad (natural/juridica)
    entity_type entity_type_enum NOT NULL DEFAULT 'natural',

    -- Campos comunes para ambas entidades
    first_name text,
    paternal_last_name text,
    maternal_last_name text,
    full_name text, -- Campo calculado para compatibilidad
    rut varchar(12) NOT NULL,
    profession text,
    monthly_income bigint,
    contact_email text,
    contact_phone varchar(20),
    address_street text,
    address_number varchar(10),
    address_department varchar(10),
    address_commune text,
    address_region text,

    -- Campos específicos para personas jurídicas
    company_name text, -- Razón social
    company_rut varchar(12), -- RUT empresa
    legal_representative_name text, -- Representante legal
    legal_representative_rut varchar(12), -- RUT representante legal
    constitution_type constitution_type_enum, -- 'empresa_un_dia' o 'tradicional'
    constitution_date date, -- Fecha constitución
    constitution_cve varchar(50), -- CVE constitución
    constitution_notary text, -- Notaría constitución

    -- Control de creación
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),

    -- Restricciones
    CONSTRAINT valid_guarantor_entity_type CHECK (entity_type IN ('natural', 'juridica')),
    CONSTRAINT valid_guarantor_income CHECK (monthly_income IS NULL OR monthly_income >= 0),

    -- Validaciones condicionales para personas naturales
    CONSTRAINT guarantor_natural_requires_names CHECK (
        entity_type = 'natural' OR
        (entity_type = 'juridica' AND first_name IS NULL AND paternal_last_name IS NULL AND maternal_last_name IS NULL) OR
        (entity_type = 'natural' AND first_name IS NOT NULL AND paternal_last_name IS NOT NULL)
    ),

    -- Validaciones condicionales para personas jurídicas
    CONSTRAINT guarantor_juridica_requires_company_data CHECK (
        entity_type = 'natural' OR
        (entity_type = 'juridica' AND company_name IS NOT NULL AND company_rut IS NOT NULL)
    ),

    -- Unicidad de RUT por aplicación (no puede haber dos avales con mismo RUT en una aplicación)
    CONSTRAINT unique_guarantor_rut_per_application UNIQUE (application_id, rut),

    -- Máximo 3 avales por aplicación
    CONSTRAINT max_guarantors_per_application CHECK (
        (SELECT COUNT(*) FROM application_guarantors WHERE application_id = application_guarantors.application_id) <= 3
    )
);


-- ========================================
-- FUNCIONES DE UTILIDAD
-- ========================================
-- Función para contar postulantes por aplicación
CREATE OR REPLACE FUNCTION get_applicant_count(application_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::integer
    FROM application_applicants
    WHERE application_id = application_uuid;
$$;

-- Función para contar avales por aplicación
CREATE OR REPLACE FUNCTION get_guarantor_count(application_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::integer
    FROM application_guarantors
    WHERE application_id = application_uuid;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION get_applicant_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guarantor_count(uuid) TO authenticated;

-- ========================================
-- COMENTARIOS EN TABLAS
-- ========================================
COMMENT ON TABLE application_applicants IS 'Tabla puente para múltiples postulantes por aplicación, soporta personas naturales y jurídicas';
COMMENT ON TABLE application_guarantors IS 'Tabla puente para múltiples avales por aplicación, soporta personas naturales y jurídicas';

COMMENT ON COLUMN application_applicants.entity_type IS 'Tipo de entidad: natural o juridica';
COMMENT ON COLUMN application_applicants.company_name IS 'Razón social (solo para personas jurídicas)';
COMMENT ON COLUMN application_applicants.constitution_type IS 'Tipo de constitución: empresa_un_dia o tradicional';

COMMENT ON COLUMN application_guarantors.entity_type IS 'Tipo de entidad: natural o juridica';
COMMENT ON COLUMN application_guarantors.company_name IS 'Razón social (solo para personas jurídicas)';
COMMENT ON COLUMN application_guarantors.constitution_type IS 'Tipo de constitución: empresa_un_dia o tradicional';

-- ========================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================
-- Habilitar RLS
ALTER TABLE application_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_guarantors ENABLE ROW LEVEL SECURITY;

-- Políticas para application_applicants
CREATE POLICY "Applicants can view their own application applicants"
    ON application_applicants FOR SELECT
    USING (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can view applicants for their properties"
    ON application_applicants FOR SELECT
    USING (
        application_id IN (
            SELECT a.id FROM applications a
            JOIN properties p ON a.property_id = p.id
            WHERE p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert applicants for their applications"
    ON application_applicants FOR INSERT
    WITH CHECK (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Applicants can update their own application applicants"
    ON application_applicants FOR UPDATE
    USING (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

-- Políticas para application_guarantors
CREATE POLICY "Applicants can view their own application guarantors"
    ON application_guarantors FOR SELECT
    USING (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can view guarantors for their properties"
    ON application_guarantors FOR SELECT
    USING (
        application_id IN (
            SELECT a.id FROM applications a
            JOIN properties p ON a.property_id = p.id
            WHERE p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert guarantors for their applications"
    ON application_guarantors FOR INSERT
    WITH CHECK (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Applicants can update their own application guarantors"
    ON application_guarantors FOR UPDATE
    USING (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_application_applicants_application_id ON application_applicants(application_id);
CREATE INDEX IF NOT EXISTS idx_application_applicants_rut ON application_applicants(rut);
CREATE INDEX IF NOT EXISTS idx_application_applicants_entity_type ON application_applicants(entity_type);

CREATE INDEX IF NOT EXISTS idx_application_guarantors_application_id ON application_guarantors(application_id);
CREATE INDEX IF NOT EXISTS idx_application_guarantors_rut ON application_guarantors(rut);
CREATE INDEX IF NOT EXISTS idx_application_guarantors_entity_type ON application_guarantors(entity_type);

-- ========================================
-- CONFIRMAR TRANSACCIÓN
-- ========================================
COMMIT;
