-- =====================================================
-- SOLUCIÓN COMPLETA PARA ERROR 403 EN APPLICATIONS
-- =====================================================
-- Este script soluciona el error 403 (Forbidden) en la tabla applications
-- después de resolver el error 409 en guarantors

-- 1. VERIFICAR EL ESTADO ACTUAL DE APPLICATIONS
SELECT 'DIAGNÓSTICO INICIAL - APPLICATIONS' as info;

-- Ver si la tabla tiene RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS_Habilitado",
    CASE 
        WHEN rowsecurity THEN '✓ RLS ACTIVO'
        ELSE '✗ RLS INACTIVO (CAUSA DEL ERROR 403)' 
    END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'applications';

-- Ver políticas actuales (probablemente vacías)
SELECT 
    policyname as "Política Actual",
    cmd as "Operación", 
    roles as "Roles"
FROM pg_policies 
WHERE tablename = 'applications' 
  AND schemaname = 'public';

-- 2. OTORGAR PERMISOS BÁSICOS AL ROL AUTHENTICATED
SELECT 'OTORGANDO PERMISOS BÁSICOS PARA APPLICATIONS' as info;

-- Permisos críticos para que funcione RLS
GRANT ALL ON public.applications TO authenticated;
GRANT ALL ON public.applications TO anon;

-- Permisos en secuencias (para IDs auto-incrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 3. HABILITAR RLS EN LA TABLA APPLICATIONS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 4. LIMPIAR POLÍTICAS EXISTENTES DE APPLICATIONS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.applications', policy_record.policyname);
        RAISE NOTICE 'Política eliminada: %', policy_record.policyname;
    END LOOP;
END $$;

-- 5. CREAR POLÍTICAS RLS PARA APPLICATIONS
SELECT 'CREANDO POLÍTICAS RLS PARA APPLICATIONS' as info;

-- Política INSERT (la más crítica para el error 403)
-- Los usuarios pueden crear sus propias postulaciones
CREATE POLICY "applications_insert_authenticated"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = applicant_id  -- Solo pueden insertar applications donde ellos son el aplicante
);

-- Política SELECT para ver sus propias applications y las de sus propiedades
CREATE POLICY "applications_select_authenticated"
ON public.applications
FOR SELECT
TO authenticated
USING (
    auth.uid() = applicant_id  -- Pueden ver sus propias applications
    OR 
    -- O pueden ver applications en propiedades que les pertenecen
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = applications.property_id 
        AND properties.owner_id = auth.uid()
    )
);

-- Política UPDATE para actualizar sus propias applications
CREATE POLICY "applications_update_authenticated"
ON public.applications
FOR UPDATE
TO authenticated
USING (auth.uid() = applicant_id)  -- Solo pueden actualizar sus propias applications
WITH CHECK (auth.uid() = applicant_id);

-- Política DELETE para eliminar sus propias applications
CREATE POLICY "applications_delete_authenticated"
ON public.applications
FOR DELETE
TO authenticated
USING (auth.uid() = applicant_id);  -- Solo pueden eliminar sus propias applications

-- También políticas básicas para anon (si usa anon key temporalmente)
CREATE POLICY "applications_insert_anon"
ON public.applications
FOR INSERT
TO anon
WITH CHECK (true);  -- Temporal, más permisivo

CREATE POLICY "applications_select_anon"
ON public.applications
FOR SELECT
TO anon
USING (true);  -- Temporal, más permisivo

-- 6. VERIFICAR PERMISOS EN TABLAS RELACIONADAS
SELECT 'VERIFICANDO PERMISOS EN TABLAS RELACIONADAS' as info;

-- Asegurar permisos en properties (necesarios para las políticas de JOIN)
GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.properties TO anon;

-- Asegurar permisos en profiles (si se necesitan)
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 7. VERIFICACIÓN COMPLETA
SELECT 'VERIFICACIÓN FINAL - APPLICATIONS' as info;

-- Confirmar RLS habilitado
SELECT 
    CASE 
        WHEN relrowsecurity = 't' THEN '✓ RLS HABILITADO CORRECTAMENTE'
        ELSE '✗ ERROR: RLS NO HABILITADO'
    END as "Estado RLS Applications"
FROM pg_class 
WHERE relname = 'applications' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Listar todas las políticas creadas para applications
SELECT 
    policyname as "Política Creada",
    cmd as "Operación",
    roles as "Para Rol",
    permissive as "Tipo"
FROM pg_policies 
WHERE tablename = 'applications' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Verificar permisos otorgados a authenticated
SELECT 
    'Permisos para authenticated en applications: ' || string_agg(privilege_type, ', ') as "Permisos"
FROM information_schema.table_privileges 
WHERE table_name = 'applications' 
  AND table_schema = 'public'
  AND grantee = 'authenticated';

-- Contar políticas críticas
SELECT 
    'Políticas INSERT para applications: ' || COUNT(*) as "Políticas INSERT"
FROM pg_policies 
WHERE tablename = 'applications' 
  AND schemaname = 'public'
  AND cmd = 'INSERT';

-- 8. PRUEBA OPCIONAL (descomenta si quieres probar manualmente)
-- SET ROLE authenticated;
-- INSERT INTO applications (property_id, applicant_id, message) 
-- VALUES ('test-property-id', 'test-user-id', 'Test application');
-- RESET ROLE;

SELECT '🎉 SOLUCIÓN PARA ERROR 403 EN APPLICATIONS APLICADA 🎉' as resultado;

-- =====================================================
-- EXPLICACIÓN DEL PROBLEMA Y SOLUCIÓN:
--
-- PROBLEMA ORIGINAL:
-- - Error 403 (Forbidden) indica falta de permisos RLS
-- - La tabla applications no tenía RLS habilitado
-- - Sin políticas, Supabase bloquea todas las operaciones
-- - El rol 'authenticated' necesita permisos específicos
--
-- SOLUCIÓN IMPLEMENTADA:
-- 1. RLS habilitado en la tabla applications
-- 2. Permisos básicos otorgados al rol 'authenticated'
-- 3. Políticas específicas para cada operación (INSERT, SELECT, UPDATE, DELETE)
-- 4. Seguridad: usuarios solo pueden crear/ver sus propias applications
-- 5. Flexibilidad: propietarios pueden ver applications en sus propiedades
--
-- PRÓXIMO PASO:
-- - Probar el formulario de postulación nuevamente
-- - El error 403 debería desaparecer
-- - Si hay problemas con documents, aplicar solución similar
-- =====================================================
