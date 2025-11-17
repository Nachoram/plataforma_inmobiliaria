-- =====================================================
-- COMPLETE ROLLBACK - Script maestro para rollback completo
-- =====================================================
-- Este script ejecuta todos los rollbacks en el orden correcto
-- para volver a un estado de base de datos completamente limpia

-- =====================================================
-- ⚠️  ADVERTENCIA IMPORTANTE ⚠️
-- =====================================================
-- Este script ELIMINARÁ TODOS LOS DATOS de la base de datos
-- Incluyendo:
--   - Todas las tablas y sus datos
--   - Todos los índices
--   - Todas las políticas RLS
--   - Todos los triggers y funciones
--   - Todas las modificaciones de ALTER TABLE
--   - Todos los buckets de storage y sus archivos
--
-- Úsalo solo en entornos de desarrollo/testing
-- ¡NO EJECUTAR EN PRODUCCIÓN!

DO $$
BEGIN
    RAISE NOTICE '🚨 INICIANDO ROLLBACK COMPLETO';
    RAISE NOTICE '⚠️  Este proceso eliminará TODOS los datos de la base de datos';
    RAISE NOTICE '⏳ Esto puede tomar varios minutos...';
END $$;

-- =====================================================
-- EJECUCIÓN DE ROLLBACKS EN ORDEN INVERSO
-- =====================================================

-- 5. STORAGE - Vaciar y eliminar buckets (primero, ya que depende menos de tablas)
\i supabase/rollback/rollback_05_storage.sql

-- 4. FIXES - Revertir ALTER TABLE (antes de eliminar tablas)
\i supabase/rollback/rollback_04_fixes.sql

-- 3. TRIGGERS - Eliminar triggers y funciones (antes de políticas)
\i supabase/rollback/rollback_03_triggers.sql

-- 2. RLS POLICIES - Eliminar políticas de seguridad (antes de índices)
\i supabase/rollback/rollback_02_rls_policies.sql

-- 1. INDEXES - Eliminar índices (antes del schema)
\i supabase/rollback/rollback_01_indexes.sql

-- 0. SCHEMA - Eliminar tablas y tipos (al final)
\i supabase/rollback/rollback_00_schema.sql

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    tables_count integer;
    indexes_count integer;
    policies_count integer;
    triggers_count integer;
    functions_count integer;
    buckets_count integer;
    objects_count integer;
BEGIN
    -- Contar elementos restantes
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%';

    SELECT COUNT(*) INTO indexes_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND indexname NOT LIKE 'pg_%';

    SELECT COUNT(*) INTO policies_count
    FROM pg_policies
    WHERE schemaname = 'public';

    SELECT COUNT(*) INTO triggers_count
    FROM pg_trigger
    WHERE tgname NOT LIKE 'pg_%'
    AND tgisinternal = false;

    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'pg_%';

    SELECT COUNT(*) INTO buckets_count
    FROM storage.buckets;

    SELECT COUNT(*) INTO objects_count
    FROM storage.objects;

    -- Reporte final
    RAISE NOTICE '';
    RAISE NOTICE '📊 REPORTE FINAL DE ROLLBACK COMPLETO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tablas restantes: %', tables_count;
    RAISE NOTICE 'Índices restantes: %', indexes_count;
    RAISE NOTICE 'Políticas RLS restantes: %', policies_count;
    RAISE NOTICE 'Triggers restantes: %', triggers_count;
    RAISE NOTICE 'Funciones restantes: %', functions_count;
    RAISE NOTICE 'Buckets de storage restantes: %', buckets_count;
    RAISE NOTICE 'Objetos de storage restantes: %', objects_count;
    RAISE NOTICE '';

    IF tables_count = 0 AND indexes_count = 0 AND policies_count = 0 AND
       triggers_count = 0 AND functions_count = 0 AND buckets_count = 0 AND objects_count = 0 THEN
        RAISE NOTICE '🎉 ¡ROLLBACK COMPLETO EXITOSO!';
        RAISE NOTICE '   La base de datos ha sido completamente limpiada.';
        RAISE NOTICE '   Estado: Equivalente a una base de datos completamente nueva.';
    ELSE
        RAISE WARNING '⚠️  ROLLBACK COMPLETADO CON ADVERTENCIAS';
        RAISE WARNING '   Algunos elementos no pudieron ser eliminados automáticamente.';
        RAISE WARNING '   Revisa manualmente los elementos restantes.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '💡 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. Si necesitas recrear el esquema: supabase db reset';
    RAISE NOTICE '   2. Si necesitas datos de prueba: ejecuta los seeds';
    RAISE NOTICE '   3. Verifica que la aplicación funcione correctamente';
END $$;
