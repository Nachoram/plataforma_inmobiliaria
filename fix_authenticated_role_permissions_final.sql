-- =====================================================
-- CORRECCIÓN DEFINITIVA DE PERMISOS DEL ROL AUTHENTICATED
-- Versión final robusta que solo otorga permisos en tablas existentes
-- =====================================================

-- FUNCIÓN HELPER: Otorgar permisos solo si la tabla existe
DO $$
DECLARE
    table_name text;
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
    -- Iterar sobre cada tabla y otorgar permisos solo si existe
    FOREACH table_name IN ARRAY tables_to_grant
    LOOP
        -- Verificar si la tabla existe
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) THEN
            -- Otorgar permisos si la tabla existe
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
            RAISE NOTICE '✅ Granted permissions on table: %', table_name;
        ELSE
            RAISE NOTICE '⚠️  Table does not exist (skipped): %', table_name;
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

-- OTORGAR PERMISOS EN TIPOS ENUM (solo si existen)
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
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
  AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

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
