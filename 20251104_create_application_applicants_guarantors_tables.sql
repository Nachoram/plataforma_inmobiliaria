-- Migración: Crear tablas puente para múltiples postulantes y avales por aplicación
-- Fecha: 4 de noviembre de 2025
-- Descripción: Esta migración crea las tablas application_applicants y application_guarantors
-- para permitir hasta 3 postulantes y 3 avales por aplicación, con soporte para personas naturales y jurídicas.

-- ========================================
-- ENUMS NECESARIOS (PRIMERO)
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
-- ÍNDICES DE PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_application_applicants_application_id ON application_applicants(application_id);
CREATE INDEX IF NOT EXISTS idx_application_applicants_rut ON application_applicants(rut);
CREATE INDEX IF NOT EXISTS idx_application_applicants_entity_type ON application_applicants(entity_type);

CREATE INDEX IF NOT EXISTS idx_application_guarantors_application_id ON application_guarantors(application_id);
CREATE INDEX IF NOT EXISTS idx_application_guarantors_rut ON application_guarantors(rut);
CREATE INDEX IF NOT EXISTS idx_application_guarantors_entity_type ON application_guarantors(entity_type);

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
        AND application_applicants.created_by = auth.uid()
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
        AND application_guarantors.created_by = auth.uid()
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
-- MIGRACIÓN DE DATOS EXISTENTES
-- ========================================
-- Nota: Esta migración asume que actualmente hay datos en applications.applicant_id y applications.guarantor_id
-- Vamos a migrar estos datos a las nuevas tablas puente

-- Insertar postulantes existentes en application_applicants
INSERT INTO application_applicants (
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    profession,
    monthly_income_clp,
    age,
    nationality,
    marital_status,
    address_street,
    address_number,
    address_department,
    address_commune,
    address_region,
    phone,
    email,
    created_by
)
SELECT
    a.id as application_id,
    'natural'::entity_type_enum as entity_type,
    p.first_name,
    p.paternal_last_name,
    p.maternal_last_name,
    p.rut,
    a.snapshot_applicant_profession,
    a.snapshot_applicant_monthly_income_clp,
    a.snapshot_applicant_age,
    a.snapshot_applicant_nationality,
    a.snapshot_applicant_marital_status,
    a.snapshot_applicant_address_street,
    a.snapshot_applicant_address_number,
    a.snapshot_applicant_address_department,
    a.snapshot_applicant_address_commune,
    a.snapshot_applicant_address_region,
    a.snapshot_applicant_phone,
    a.snapshot_applicant_email,
    a.applicant_id as created_by
FROM applications a
JOIN profiles p ON a.applicant_id = p.id
WHERE a.applicant_id IS NOT NULL;

-- Insertar avales existentes en application_guarantors
INSERT INTO application_guarantors (
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    full_name,
    rut,
    profession,
    monthly_income,
    contact_email,
    address_street,
    address_number,
    address_department,
    address_commune,
    address_region,
    created_by
)
SELECT
    a.id as application_id,
    'natural'::entity_type_enum as entity_type,
    g.first_name,
    g.paternal_last_name,
    g.maternal_last_name,
    g.full_name,
    g.rut,
    g.profession,
    g.monthly_income,
    g.contact_email,
    g.address_street,
    g.address_number,
    g.address_department,
    g.address_commune,
    g.address_region,
    g.created_by
FROM applications a
JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.guarantor_id IS NOT NULL;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
-- Contar registros migrados
DO $$
DECLARE
    applicant_count integer;
    guarantor_count integer;
BEGIN
    SELECT COUNT(*) INTO applicant_count FROM application_applicants;
    SELECT COUNT(*) INTO guarantor_count FROM application_guarantors;

    RAISE NOTICE 'Migración completada exitosamente:';
    RAISE NOTICE '  - Postulantes migrados: %', applicant_count;
    RAISE NOTICE '  - Avales migrados: %', guarantor_count;
    RAISE NOTICE '  - Tablas creadas: application_applicants, application_guarantors';
    RAISE NOTICE '  - Enums creados: entity_type_enum, constitution_type_enum';
    RAISE NOTICE '  - Políticas RLS configuradas';
    RAISE NOTICE '  - Funciones de utilidad creadas';
END $$;
