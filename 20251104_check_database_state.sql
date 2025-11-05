-- Verificación del estado de la base de datos
-- Fecha: 4 de noviembre de 2025
-- Descripción: Verificar que todos los pasos se ejecutaron correctamente

-- ========================================
-- VERIFICACIÓN DE ENUMS (PASO 1)
-- ========================================
DO $$
DECLARE
    entity_type_exists boolean;
    marital_status_exists boolean;
    constitution_type_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'entity_type_enum'
    ) INTO entity_type_exists;

    SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'marital_status_enum'
    ) INTO marital_status_exists;

    SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'constitution_type_enum'
    ) INTO constitution_type_exists;

    RAISE NOTICE '=== VERIFICACIÓN DE ENUMS (PASO 1) ===';
    RAISE NOTICE 'entity_type_enum: %', entity_type_exists;
    RAISE NOTICE 'marital_status_enum: %', marital_status_exists;
    RAISE NOTICE 'constitution_type_enum: %', constitution_type_exists;

    IF NOT (entity_type_exists AND marital_status_exists AND constitution_type_exists) THEN
        RAISE EXCEPTION 'Faltan enums. Ejecute el PASO 1 primero.';
    END IF;
END $$;

-- ========================================
-- VERIFICACIÓN DE TABLAS (PASO 2)
-- ========================================
DO $$
DECLARE
    applicants_exists boolean;
    guarantors_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_applicants'
    ) INTO applicants_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_guarantors'
    ) INTO guarantors_exists;

    RAISE NOTICE '=== VERIFICACIÓN DE TABLAS (PASO 2) ===';
    RAISE NOTICE 'application_applicants: %', applicants_exists;
    RAISE NOTICE 'application_guarantors: %', guarantors_exists;

    IF NOT (applicants_exists AND guarantors_exists) THEN
        RAISE EXCEPTION 'Faltan tablas. Ejecute el PASO 2 primero.';
    END IF;
END $$;

-- ========================================
-- VERIFICACIÓN DE COLUMNAS
-- ========================================
DO $$
DECLARE
    applicants_columns text[];
    guarantors_columns text[];
BEGIN
    -- Verificar columnas de application_applicants
    SELECT array_agg(column_name::text ORDER BY column_name)
    INTO applicants_columns
    FROM information_schema.columns
    WHERE table_name = 'application_applicants';

    -- Verificar columnas de application_guarantors
    SELECT array_agg(column_name::text ORDER BY column_name)
    INTO guarantors_columns
    FROM information_schema.columns
    WHERE table_name = 'application_guarantors';

    RAISE NOTICE '=== COLUMNAS DE application_applicants ===';
    RAISE NOTICE '%', array_to_string(applicants_columns, ', ');

    RAISE NOTICE '=== COLUMNAS DE application_guarantors ===';
    RAISE NOTICE '%', array_to_string(guarantors_columns, ', ');

    -- Verificar columnas críticas
    IF NOT ('rut' = ANY(applicants_columns)) THEN
        RAISE EXCEPTION 'La columna "rut" no existe en application_applicants';
    END IF;

    IF NOT ('rut' = ANY(guarantors_columns)) THEN
        RAISE EXCEPTION 'La columna "rut" no existe en application_guarantors';
    END IF;
END $$;

-- ========================================
-- VERIFICACIÓN DE POLÍTICAS RLS (PASO 3)
-- ========================================
DO $$
DECLARE
    applicants_rls boolean;
    guarantors_rls boolean;
    applicants_policies_count integer;
    guarantors_policies_count integer;
BEGIN
    -- Verificar RLS habilitado (compatible con todas las versiones de PostgreSQL)
    SELECT relrowsecurity FROM pg_class
    WHERE relname = 'application_applicants' INTO applicants_rls;

    SELECT relrowsecurity FROM pg_class
    WHERE relname = 'application_guarantors' INTO guarantors_rls;

    -- Contar políticas
    SELECT COUNT(*) INTO applicants_policies_count
    FROM pg_policies
    WHERE tablename = 'application_applicants';

    SELECT COUNT(*) INTO guarantors_policies_count
    FROM pg_policies
    WHERE tablename = 'application_guarantors';

    RAISE NOTICE '=== VERIFICACIÓN DE RLS (PASO 3) ===';
    RAISE NOTICE 'RLS application_applicants: %', applicants_rls;
    RAISE NOTICE 'RLS application_guarantors: %', guarantors_rls;
    RAISE NOTICE 'Políticas application_applicants: %', applicants_policies_count;
    RAISE NOTICE 'Políticas application_guarantors: %', guarantors_policies_count;
END $$;

-- ========================================
-- VERIFICACIÓN DE ÍNDICES
-- ========================================
DO $$
DECLARE
    index_count integer;
    r record;  -- Variable para el bucle FOR
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename IN ('application_applicants', 'application_guarantors')
    AND indexname LIKE 'idx_%';

    RAISE NOTICE '=== VERIFICACIÓN DE ÍNDICES ===';
    RAISE NOTICE 'Índices creados: %', index_count;

    -- Listar índices específicos
    RAISE NOTICE 'Índices encontrados:';
    FOR r IN
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE tablename IN ('application_applicants', 'application_guarantors')
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
    LOOP
        RAISE NOTICE '  - % (%s)', r.indexname, r.tablename;
    END LOOP;
END $$;

-- ========================================
-- RESUMEN FINAL
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '=== RESUMEN DE VERIFICACIÓN ===';
    RAISE NOTICE 'Si todas las verificaciones pasaron, el sistema está correctamente configurado.';
    RAISE NOTICE 'Si alguna verificación falló, ejecute el paso correspondiente.';
END $$;
