-- PASO 2: Crear tablas puente
-- Fecha: 4 de noviembre de 2025
-- Descripción: Crear las tablas application_applicants y application_guarantors
-- PRE-REQUISITO: Ejecutar primero 20251104_step1_create_enums.sql

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

    -- Restricciones básicas
    CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 18 AND age <= 120)),
    CONSTRAINT valid_income CHECK (monthly_income_clp IS NULL OR monthly_income_clp >= 0),

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

    -- Restricciones básicas
    CONSTRAINT valid_guarantor_income CHECK (monthly_income IS NULL OR monthly_income >= 0),

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

-- Verificar que se crearon las tablas
DO $$
DECLARE
    applicant_table_exists boolean;
    guarantor_table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_applicants'
    ) INTO applicant_table_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_guarantors'
    ) INTO guarantor_table_exists;

    IF applicant_table_exists AND guarantor_table_exists THEN
        RAISE NOTICE 'Tablas creadas exitosamente: application_applicants, application_guarantors';
    ELSE
        RAISE EXCEPTION 'Error: No se pudieron crear las tablas';
    END IF;
END $$;
