-- Investigación detallada de las tablas existentes
-- Fecha: 4 de noviembre de 2025

-- ========================================
-- VERIFICAR ESTRUCTURA ACTUAL DE LAS TABLAS
-- ========================================

-- Ver todas las tablas relacionadas con applicants
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename LIKE '%applicant%'
ORDER BY tablename;

-- Ver todas las columnas de application_applicants
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'application_applicants'
ORDER BY ordinal_position;

-- Ver todas las columnas de application_guarantors
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'application_guarantors'
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAR CONSTRAINTS Y REFERENCES
-- ========================================

-- Ver constraints de application_applicants
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.table_name = 'application_applicants'
ORDER BY tc.constraint_name, kcu.column_name;

-- Ver constraints de application_guarantors
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.table_name = 'application_guarantors'
ORDER BY tc.constraint_name, kcu.column_name;

-- ========================================
-- VERIFICAR ENUMS UTILIZADOS
-- ========================================

-- Ver qué enums están siendo usados por las columnas
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.udt_name
FROM information_schema.columns c
WHERE c.table_name IN ('application_applicants', 'application_guarantors')
AND c.data_type = 'USER-DEFINED'
ORDER BY c.table_name, c.column_name;

-- ========================================
-- VERIFICAR DATOS EXISTENTES
-- ========================================

-- Contar registros en las tablas
SELECT
    'application_applicants' as table_name,
    COUNT(*) as record_count
FROM application_applicants
UNION ALL
SELECT
    'application_guarantors' as table_name,
    COUNT(*) as record_count
FROM application_guarantors;

-- ========================================
-- COMPARAR CON LA DEFINICIÓN ESPERADA
-- ========================================

DO $$
DECLARE
    expected_columns_applicants text[] := ARRAY[
        'id', 'application_id', 'entity_type', 'first_name', 'paternal_last_name',
        'maternal_last_name', 'rut', 'profession', 'monthly_income_clp', 'age',
        'nationality', 'marital_status', 'address_street', 'address_number',
        'address_department', 'address_commune', 'address_region', 'phone',
        'email', 'company_name', 'company_rut', 'legal_representative_name',
        'legal_representative_rut', 'constitution_type', 'constitution_date',
        'constitution_cve', 'constitution_notary', 'created_at', 'updated_at',
        'created_by'
    ];

    expected_columns_guarantors text[] := ARRAY[
        'id', 'application_id', 'entity_type', 'first_name', 'paternal_last_name',
        'maternal_last_name', 'full_name', 'rut', 'profession', 'monthly_income',
        'contact_email', 'contact_phone', 'address_street', 'address_number',
        'address_department', 'address_commune', 'address_region', 'company_name',
        'company_rut', 'legal_representative_name', 'legal_representative_rut',
        'constitution_type', 'constitution_date', 'constitution_cve',
        'constitution_notary', 'created_at', 'updated_at', 'created_by'
    ];

    actual_columns_applicants text[];
    actual_columns_guarantors text[];
    missing_applicants text[];
    missing_guarantors text[];
    extra_applicants text[];
    extra_guarantors text[];
BEGIN
    -- Obtener columnas actuales
    SELECT array_agg(column_name::text ORDER BY column_name)
    INTO actual_columns_applicants
    FROM information_schema.columns
    WHERE table_name = 'application_applicants';

    SELECT array_agg(column_name::text ORDER BY column_name)
    INTO actual_columns_guarantors
    FROM information_schema.columns
    WHERE table_name = 'application_guarantors';

    -- Calcular diferencias
    SELECT array_agg(column_name)
    INTO missing_applicants
    FROM unnest(expected_columns_applicants) AS column_name
    WHERE column_name != ALL(actual_columns_applicants);

    SELECT array_agg(column_name)
    INTO missing_guarantors
    FROM unnest(expected_columns_guarantors) AS column_name
    WHERE column_name != ALL(actual_columns_guarantors);

    SELECT array_agg(column_name)
    INTO extra_applicants
    FROM unnest(actual_columns_applicants) AS column_name
    WHERE column_name != ALL(expected_columns_applicants);

    SELECT array_agg(column_name)
    INTO extra_guarantors
    FROM unnest(actual_columns_guarantors) AS column_name
    WHERE column_name != ALL(expected_columns_guarantors);

    -- Reportar resultados
    RAISE NOTICE '=== ANÁLISIS DE COLUMNAS ===';
    RAISE NOTICE 'Columnas esperadas en application_applicants: %', array_length(expected_columns_applicants, 1);
    RAISE NOTICE 'Columnas actuales en application_applicants: %', array_length(actual_columns_applicants, 1);
    RAISE NOTICE 'Columnas esperadas en application_guarantors: %', array_length(expected_columns_guarantors, 1);
    RAISE NOTICE 'Columnas actuales en application_guarantors: %', array_length(actual_columns_guarantors, 1);

    IF missing_applicants IS NOT NULL AND array_length(missing_applicants, 1) > 0 THEN
        RAISE NOTICE 'COLUMNAS FALTANTES en application_applicants: %', array_to_string(missing_applicants, ', ');
    END IF;

    IF missing_guarantors IS NOT NULL AND array_length(missing_guarantors, 1) > 0 THEN
        RAISE NOTICE 'COLUMNAS FALTANTES en application_guarantors: %', array_to_string(missing_guarantors, ', ');
    END IF;

    IF extra_applicants IS NOT NULL AND array_length(extra_applicants, 1) > 0 THEN
        RAISE NOTICE 'COLUMNAS EXTRA en application_applicants: %', array_to_string(extra_applicants, ', ');
    END IF;

    IF extra_guarantors IS NOT NULL AND array_length(extra_guarantors, 1) > 0 THEN
        RAISE NOTICE 'COLUMNAS EXTRA en application_guarantors: %', array_to_string(extra_guarantors, ', ');
    END IF;

    -- Verificar si hay datos
    IF EXISTS (SELECT 1 FROM application_applicants LIMIT 1) THEN
        RAISE WARNING 'ADVERTENCIA: La tabla application_applicants contiene datos. Recrear la tabla eliminará los datos existentes.';
    END IF;

    IF EXISTS (SELECT 1 FROM application_guarantors LIMIT 1) THEN
        RAISE WARNING 'ADVERTENCIA: La tabla application_guarantors contiene datos. Recrear la tabla eliminará los datos existentes.';
    END IF;
END $$;

