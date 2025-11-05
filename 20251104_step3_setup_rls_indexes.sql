-- PASO 3: Configurar políticas RLS e índices
-- Fecha: 4 de noviembre de 2025
-- Descripción: Configurar seguridad (RLS) e índices de performance
-- PRE-REQUISITO: Ejecutar primero 20251104_step2_create_tables.sql

-- ========================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================
-- Habilitar RLS
ALTER TABLE application_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_guarantors ENABLE ROW LEVEL SECURITY;

-- Políticas para application_applicants
DROP POLICY IF EXISTS "Applicants can view their own application applicants" ON application_applicants;
CREATE POLICY "Applicants can view their own application applicants"
    ON application_applicants FOR SELECT
    USING (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Property owners can view applicants for their properties" ON application_applicants;
CREATE POLICY "Property owners can view applicants for their properties"
    ON application_applicants FOR SELECT
    USING (
        application_id IN (
            SELECT a.id FROM applications a
            JOIN properties p ON a.property_id = p.id
            WHERE p.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert applicants for their applications" ON application_applicants;
CREATE POLICY "Users can insert applicants for their applications"
    ON application_applicants FOR INSERT
    WITH CHECK (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Applicants can update their own application applicants" ON application_applicants;
CREATE POLICY "Applicants can update their own application applicants"
    ON application_applicants FOR UPDATE
    USING (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

-- Políticas para application_guarantors
DROP POLICY IF EXISTS "Applicants can view their own application guarantors" ON application_guarantors;
CREATE POLICY "Applicants can view their own application guarantors"
    ON application_guarantors FOR SELECT
    USING (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Property owners can view guarantors for their properties" ON application_guarantors;
CREATE POLICY "Property owners can view guarantors for their properties"
    ON application_guarantors FOR SELECT
    USING (
        application_id IN (
            SELECT a.id FROM applications a
            JOIN properties p ON a.property_id = p.id
            WHERE p.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert guarantors for their applications" ON application_guarantors;
CREATE POLICY "Users can insert guarantors for their applications"
    ON application_guarantors FOR INSERT
    WITH CHECK (
        application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Applicants can update their own application guarantors" ON application_guarantors;
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
-- Verificar que las tablas existen antes de crear índices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_applicants'
    ) THEN
        RAISE EXCEPTION 'La tabla application_applicants no existe. Ejecute primero el paso 2.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_guarantors'
    ) THEN
        RAISE EXCEPTION 'La tabla application_guarantors no existe. Ejecute primero el paso 2.';
    END IF;

    RAISE NOTICE 'Tablas verificadas correctamente. Procediendo con la creación de índices.';
END $$;

DROP INDEX IF EXISTS idx_application_applicants_application_id;
CREATE INDEX idx_application_applicants_application_id ON application_applicants(application_id);

DROP INDEX IF EXISTS idx_application_applicants_rut;
CREATE INDEX idx_application_applicants_rut ON application_applicants(rut);

DROP INDEX IF EXISTS idx_application_applicants_entity_type;
CREATE INDEX idx_application_applicants_entity_type ON application_applicants(entity_type);

DROP INDEX IF EXISTS idx_application_guarantors_application_id;
CREATE INDEX idx_application_guarantors_application_id ON application_guarantors(application_id);

DROP INDEX IF EXISTS idx_application_guarantors_rut;
CREATE INDEX idx_application_guarantors_rut ON application_guarantors(rut);

DROP INDEX IF EXISTS idx_application_guarantors_entity_type;
CREATE INDEX idx_application_guarantors_entity_type ON application_guarantors(entity_type);

-- Verificar configuración
DO $$
DECLARE
    rls_enabled_applicants boolean;
    rls_enabled_guarantors boolean;
    index_count integer;
BEGIN
    -- Verificar RLS (compatible con todas las versiones de PostgreSQL)
    SELECT relrowsecurity FROM pg_class
    WHERE relname = 'application_applicants' INTO rls_enabled_applicants;

    SELECT relrowsecurity FROM pg_class
    WHERE relname = 'application_guarantors' INTO rls_enabled_guarantors;

    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename IN ('application_applicants', 'application_guarantors');

    RAISE NOTICE 'Configuración completada:';
    RAISE NOTICE '  - RLS application_applicants: %', rls_enabled_applicants;
    RAISE NOTICE '  - RLS application_guarantors: %', rls_enabled_guarantors;
    RAISE NOTICE '  - Índices creados: %', index_count;
END $$;
