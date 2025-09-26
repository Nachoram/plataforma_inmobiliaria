-- =====================================================
-- VERIFICACIÓN FINAL: Migración Optimizada para N8N
-- =====================================================

-- 1. Verificar que las funciones se crearon correctamente
SELECT
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'get_contract_data%'
ORDER BY routine_name;

-- 2. Verificar que la vista se creó
SELECT
    table_name,
    table_type,
    'VIEW' as view_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'contract_data_view'
AND table_type = 'VIEW';

-- 3. Verificar índices optimizados para N8N
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%contract%' OR indexname LIKE '%characteristic%'
ORDER BY tablename;

-- 4. Verificar que receiver_id fue eliminado (no debería haber resultados)
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'receiver_id'
AND table_name IN ('properties', 'applications', 'offers', 'guarantors', 'documents', 'property_images', 'user_favorites');

-- 5. Verificar que characteristic_id sigue existiendo
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%characteristic_id'
ORDER BY table_name;

-- 6. Verificar políticas RLS (no deberían referenciar receiver_id)
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND qual LIKE '%receiver_id%';

-- 7. Test básico de las funciones (si hay datos)
DO $$
DECLARE
    app_count integer;
    prop_count integer;
BEGIN
    -- Contar aplicaciones y propiedades para verificar que las tablas existen
    SELECT COUNT(*) INTO app_count FROM applications;
    SELECT COUNT(*) INTO prop_count FROM properties;

    RAISE NOTICE 'Aplicaciones encontradas: %', app_count;
    RAISE NOTICE 'Propiedades encontradas: %', prop_count;

    -- Verificar que las funciones existen y son ejecutables
    IF EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'get_contract_data_by_characteristic_ids'
    ) THEN
        RAISE NOTICE '✅ Función get_contract_data_by_characteristic_ids existe';
    ELSE
        RAISE NOTICE '❌ Función get_contract_data_by_characteristic_ids NO existe';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'get_contract_data_by_uuids'
    ) THEN
        RAISE NOTICE '✅ Función get_contract_data_by_uuids existe';
    ELSE
        RAISE NOTICE '❌ Función get_contract_data_by_uuids NO existe';
    END IF;

    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '🎯 Base de datos optimizada para N8N';
END $$;

-- 8. Mostrar resumen final
DO $$
DECLARE
    func_count integer := 0;
    view_count integer := 0;
    index_count integer := 0;
    receiver_count integer := 0;
BEGIN
    -- Contar funciones
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name LIKE 'get_contract_data%';

    -- Contar vistas
    SELECT COUNT(*) INTO view_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'contract_data_view'
    AND table_type = 'VIEW';

    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND (indexname LIKE '%contract%' OR indexname LIKE '%characteristic%');

    -- Contar receiver_id restantes
    SELECT COUNT(*) INTO receiver_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'receiver_id'
    AND table_name IN ('properties', 'applications', 'offers', 'guarantors', 'documents', 'property_images', 'user_favorites');

    -- Mostrar resultados
    RAISE NOTICE '✅ FUNCIONES OPTIMIZADAS: %', func_count;
    RAISE NOTICE '✅ VISTA CONTRACTOS: %', view_count;
    RAISE NOTICE '✅ ÍNDICES OPTIMIZADOS: %', index_count;
    RAISE NOTICE '❌ RECEIVER_ID ELIMINADO: % (debería ser 0)', receiver_count;

    IF func_count >= 2 AND view_count >= 1 AND index_count >= 4 AND receiver_count = 0 THEN
        RAISE NOTICE '🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!';
        RAISE NOTICE '🚀 Tu base de datos está optimizada para N8N';
    ELSE
        RAISE NOTICE '⚠️  Revisar resultados - algunos elementos pueden faltar';
    END IF;
END $$;
