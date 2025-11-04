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

-- Verificar configuración
DO $$
DECLARE
    rls_enabled_applicants boolean;
    rls_enabled_guarantors boolean;
    index_count integer;
BEGIN
    -- Verificar RLS
    SELECT row_security FROM information_schema.tables
    WHERE table_name = 'application_applicants' INTO rls_enabled_applicants;

    SELECT row_security FROM information_schema.tables
    WHERE table_name = 'application_guarantors' INTO rls_enabled_guarantors;

    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename IN ('application_applicants', 'application_guarantors');

    RAISE NOTICE 'Configuración completada:';
    RAISE NOTICE '  - RLS application_applicants: %', rls_enabled_applicants;
    RAISE NOTICE '  - RLS application_guarantors: %', rls_enabled_guarantors;
    RAISE NOTICE '  - Índices creados: %', index_count;
END $$;
