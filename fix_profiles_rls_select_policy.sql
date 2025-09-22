-- =====================================================
-- FASE 2: CORRECCIÓN ERROR 406 - POLÍTICA RLS PROFILES
-- Crear política SELECT faltante para la tabla profiles
-- =====================================================

-- PASO 1: VERIFICAR POLÍTICAS RLS ACTUALES PARA PROFILES
SELECT '=== POLÍTICAS ACTUALES PARA PROFILES ===' as verification_step;
SELECT 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- PASO 2: VERIFICAR QUE RLS ESTÉ HABILITADO
SELECT '=== VERIFICAR RLS HABILITADO ===' as rls_status;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'profiles';

-- PASO 3: HABILITAR RLS (por si no estuviera habilitado)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- PASO 4: CREAR LA POLÍTICA SELECT FALTANTE
-- Esta política permite a cada usuario leer su propio perfil
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- PASO 5: VERIFICAR QUE LA POLÍTICA SE CREÓ CORRECTAMENTE
SELECT '=== POLÍTICAS DESPUÉS DE LA CORRECCIÓN ===' as final_verification;
SELECT 
    policyname, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Permite leer perfil propio'
        WHEN cmd = 'INSERT' THEN 'Permite crear perfil propio'
        WHEN cmd = 'UPDATE' THEN 'Permite actualizar perfil propio'
        WHEN cmd = 'DELETE' THEN 'Permite eliminar perfil propio'
        ELSE 'Otra operación'
    END as descripcion
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- PASO 6: MENSAJE DE CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 POLÍTICA RLS PARA PROFILES CREADA EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Política creada:';
    RAISE NOTICE '   - "Users can view their own profile" (SELECT)';
    RAISE NOTICE '   - Permite a cada usuario leer solo su propio perfil';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Seguridad mantenida:';
    RAISE NOTICE '   - Los usuarios NO pueden ver perfiles de otros usuarios';
    RAISE NOTICE '   - Solo pueden acceder a sus propios datos usando auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 El error 406 Not Acceptable para profiles debería estar resuelto';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '1. Recarga tu aplicación React (Ctrl+F5)';
    RAISE NOTICE '2. Prueba acceder a tu perfil de usuario';
    RAISE NOTICE '3. Verifica que no aparezcan más errores 406 en la consola';
    RAISE NOTICE '';
END $$;
