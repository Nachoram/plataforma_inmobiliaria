-- Script de verificación para PostulationAdminPanel después de aplicar las correcciones
-- =================================================================================
-- Ejecutar este script en el SQL Editor de Supabase Dashboard para verificar que todo funciona

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO CORRECCIONES PARA POSTULATIONADMINPANEL ===';
END $$;

-- 1. Verificar tabla application_audit_log
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ Tabla application_audit_log existe'
         ELSE '❌ Tabla application_audit_log NO existe' END as status
FROM information_schema.tables
WHERE table_name = 'application_audit_log' AND table_schema = 'public';

-- 2. Verificar tabla application_modifications
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ Tabla application_modifications existe'
         ELSE '❌ Tabla application_modifications NO existe' END as status
FROM information_schema.tables
WHERE table_name = 'application_modifications' AND table_schema = 'public';

-- 3. Verificar función log_application_audit
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ Función log_application_audit existe'
         ELSE '❌ Función log_application_audit NO existe' END as status
FROM information_schema.routines
WHERE routine_name = 'log_application_audit' AND routine_schema = 'public';

-- 4. Verificar función get_application_modifications
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ Función get_application_modifications existe'
         ELSE '❌ Función get_application_modifications NO existe' END as status
FROM information_schema.routines
WHERE routine_name = 'get_application_modifications' AND routine_schema = 'public';

-- 5. Verificar columna monthly_income_clp en profiles
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ Columna monthly_income_clp existe en profiles'
         ELSE '❌ Columna monthly_income_clp NO existe en profiles' END as status
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'monthly_income_clp' AND table_schema = 'public';

-- 6. Verificar tipo de dato de monthly_income_clp
SELECT
    column_name,
    data_type,
    CASE WHEN data_type = 'bigint' THEN '✅ Tipo correcto (bigint)'
         ELSE '⚠️ Tipo diferente: ' || data_type END as type_status
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'monthly_income_clp' AND table_schema = 'public';

-- 7. Probar consultas que antes fallaban
DO $$
DECLARE
    audit_count INTEGER;
    mod_count INTEGER;
    profile_count INTEGER;
BEGIN
    RAISE NOTICE 'Probando consultas que antes fallaban...';

    -- Consulta a application_audit_log
    SELECT COUNT(*) INTO audit_count FROM application_audit_log LIMIT 1;
    RAISE NOTICE '✅ Consulta a application_audit_log funciona (registros: %)', audit_count;

    -- Consulta a application_modifications
    SELECT COUNT(*) INTO mod_count FROM application_modifications LIMIT 1;
    RAISE NOTICE '✅ Consulta a application_modifications funciona (registros: %)', mod_count;

    -- Consulta a profiles.monthly_income_clp
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE monthly_income_clp >= 0 LIMIT 1;
    RAISE NOTICE '✅ Consulta a profiles.monthly_income_clp funciona (perfiles: %)', profile_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Una de las consultas falla: %', SQLERRM;
END $$;

-- 8. Verificar permisos
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ Permisos SELECT en application_audit_log configurados'
         ELSE '⚠️ Permisos SELECT en application_audit_log pueden no estar configurados' END as permissions_status
FROM information_schema.table_privileges
WHERE table_name = 'application_audit_log'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT';

-- 9. Verificar políticas RLS
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ Políticas RLS en application_audit_log configuradas'
         ELSE '⚠️ Políticas RLS en application_audit_log pueden no estar configuradas' END as rls_status
FROM pg_policies
WHERE tablename = 'application_audit_log';

-- 10. Resumen final
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN COMPLETADA ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Si todas las verificaciones muestran ✅ entonces los errores 404 y 42P01';
    RAISE NOTICE 'deberían estar resueltos en el PostulationAdminPanel.';
    RAISE NOTICE '';
    RAISE NOTICE 'Para probar desde el frontend:';
    RAISE NOTICE '1. Ve al panel de postulaciones de una propiedad';
    RAISE NOTICE '2. Abre los detalles de una postulación';
    RAISE NOTICE '3. Verifica que no hay errores 404 en la consola';
    RAISE NOTICE '4. Verifica que se muestran los historiales de auditoría y modificaciones';
END $$;
