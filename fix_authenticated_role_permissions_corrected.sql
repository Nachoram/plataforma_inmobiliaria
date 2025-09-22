-- =====================================================
-- CORRECCIÓN DEFINITIVA DE PERMISOS DEL ROL AUTHENTICATED
-- Versión corregida y simplificada que resuelve errores HTTP 406
-- =====================================================

-- PASO 1: OTORGAR PERMISOS BÁSICOS AL ROL AUTHENTICATED

-- Permisos para tabla profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Permisos para tabla properties  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;

-- Permisos para tabla property_images
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;

-- Permisos para tabla documents
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;

-- Permisos para tabla offers (si existe)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;

-- Permisos para tabla applications (si existe)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

-- Permisos para tabla messages (si existe) 
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

-- PASO 2: OTORGAR PERMISOS EN SECUENCIAS (para campos AUTO INCREMENT)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- PASO 3: OTORGAR PERMISOS DE EJECUCIÓN EN FUNCIONES
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- PASO 4: OTORGAR PERMISOS EN TIPOS ENUM
DO $$
DECLARE
    enum_record RECORD;
BEGIN
    -- Otorgar permisos en todos los tipos enum que existan
    FOR enum_record IN 
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e' 
        AND typnamespace = 'public'::regnamespace
    LOOP
        BEGIN
            EXECUTE format('GRANT USAGE ON TYPE public.%I TO authenticated', enum_record.typname);
            RAISE NOTICE 'Granted USAGE on enum: %', enum_record.typname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not grant on enum % (may not exist): %', enum_record.typname, SQLERRM;
        END;
    END LOOP;
END $$;

-- PASO 5: VERIFICAR QUE LOS PERMISOS SE OTORGARON CORRECTAMENTE
SELECT '=== VERIFICACIÓN DE PERMISOS OTORGADOS ===' as verification;
SELECT 
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- PASO 6: MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PERMISOS DEL ROL AUTHENTICATED OTORGADOS EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Permisos otorgados en las siguientes tablas:';
    RAISE NOTICE '   - profiles (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '   - properties (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '   - property_images (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '   - documents (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '   - offers, applications, messages (si existen)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Permisos adicionales otorgados:';
    RAISE NOTICE '   - Secuencias (USAGE, SELECT)';
    RAISE NOTICE '   - Funciones (EXECUTE)';
    RAISE NOTICE '   - Tipos ENUM (USAGE)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Los errores HTTP 406 Not Acceptable deberían estar resueltos';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '1. Recarga tu aplicación React (Ctrl+F5)';
    RAISE NOTICE '2. Abre la consola del navegador (F12)';
    RAISE NOTICE '3. Limpia la consola y prueba las funcionalidades';
    RAISE NOTICE '4. Verifica que no aparezcan más errores 406';
    RAISE NOTICE '';
END $$;
