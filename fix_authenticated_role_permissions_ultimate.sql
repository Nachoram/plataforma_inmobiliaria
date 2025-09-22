-- =====================================================
-- CORRECCIÓN DEFINITIVA DE PERMISOS DEL ROL AUTHENTICATED
-- Versión definitiva que resuelve ambigüedad de nombres y errores
-- =====================================================

-- OTORGAR PERMISOS SOLO EN TABLAS QUE EXISTEN
DO $$
DECLARE
    target_table text;
    tables_to_grant text[] := ARRAY[
        'profiles',
        'properties', 
        'property_images',
        'documents',
        'offers',
        'applications',
        'messages',
        'property_files',
        'rental_applications',
        'property_views'
    ];
BEGIN
    RAISE NOTICE '🔧 Starting permission grants for authenticated role...';
    RAISE NOTICE '';
    
    -- Iterar sobre cada tabla y otorgar permisos solo si existe
    FOREACH target_table IN ARRAY tables_to_grant
    LOOP
        -- Verificar si la tabla existe usando nombre de variable diferente
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_schema = 'public' 
            AND t.table_name = target_table
        ) THEN
            -- Otorgar permisos si la tabla existe
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', target_table);
            RAISE NOTICE '✅ Granted permissions on table: %', target_table;
        ELSE
            RAISE NOTICE '⚠️  Table does not exist (skipped): %', target_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Granting additional permissions...';
    
    -- Otorgar permisos en secuencias
    BEGIN
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        RAISE NOTICE '✅ Granted permissions on sequences';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Could not grant sequence permissions: %', SQLERRM;
    END;
    
    -- Otorgar permisos de ejecución en funciones
    BEGIN
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
        RAISE NOTICE '✅ Granted execute permissions on functions';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Could not grant function permissions: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
END $$;

-- OTORGAR PERMISOS EN TIPOS ENUM
DO $$
DECLARE
    enum_record RECORD;
    enum_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Granting permissions on ENUM types...';
    
    FOR enum_record IN 
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e' 
        AND typnamespace = 'public'::regnamespace
    LOOP
        BEGIN
            EXECUTE format('GRANT USAGE ON TYPE public.%I TO authenticated', enum_record.typname);
            RAISE NOTICE '✅ Granted USAGE on enum: %', enum_record.typname;
            enum_count := enum_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not grant on enum %: %', enum_record.typname, SQLERRM;
        END;
    END LOOP;
    
    IF enum_count = 0 THEN
        RAISE NOTICE '⚠️  No ENUM types found';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- VERIFICAR PERMISOS OTORGADOS
SELECT '=== VERIFICACIÓN DE PERMISOS OTORGADOS ===' as verification;
SELECT 
  t.table_name,
  string_agg(t.privilege_type, ', ' ORDER BY t.privilege_type) as permissions
FROM information_schema.table_privileges t
WHERE t.grantee = 'authenticated' 
  AND t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;

-- MENSAJE FINAL DE CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PERMISOS DEL ROL AUTHENTICATED OTORGADOS EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE '✅ El script otorgó permisos solo en tablas existentes';
    RAISE NOTICE '✅ Se incluyeron permisos adicionales de secuencias, funciones y enums';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Los errores HTTP 406 Not Acceptable deberían estar resueltos';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '1. Recarga tu aplicación React (Ctrl+F5)';
    RAISE NOTICE '2. Abre la consola del navegador (F12)';
    RAISE NOTICE '3. Limpia la consola y prueba las funcionalidades';
    RAISE NOTICE '4. Verifica que no aparezcan más errores 406';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Si aún tienes errores 406, compárteme la consola del navegador';
    RAISE NOTICE '';
END $$;
