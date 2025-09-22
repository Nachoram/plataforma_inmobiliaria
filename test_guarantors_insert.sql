-- =====================================================
-- PRUEBA DIRECTA DE INSERCIÓN EN GUARANTORS
-- =====================================================
-- Esta prueba identificará si el problema es de políticas o autenticación

-- 1. VERIFICAR EL ESTADO ACTUAL EXACTO
SELECT 'ESTADO ACTUAL DE GUARANTORS' as info;

-- Ver si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '✓ RLS ACTIVO'
        ELSE '✗ RLS INACTIVO' 
    END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'guarantors';

-- Ver todas las políticas actuales
SELECT 
    policyname as "Política",
    cmd as "Operación",
    permissive as "Tipo",
    roles as "Roles",
    qual as "USING",
    with_check as "WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'guarantors'
ORDER BY cmd, policyname;

-- 2. PRUEBA DE INSERCIÓN COMO AUTHENTICATED
SELECT 'PROBANDO INSERCIÓN COMO AUTHENTICATED' as info;

-- Simular ser un usuario authenticated
SET ROLE authenticated;

-- Intentar inserción simple
INSERT INTO guarantors (
    first_name, 
    paternal_last_name, 
    rut,
    profession,
    monthly_income_clp
) VALUES (
    'Test',
    'Usuario',
    '12345678-9',
    'Desarrollador',
    1000000
);

-- Si la inserción funcionó, eliminar el registro de prueba
DELETE FROM guarantors WHERE first_name = 'Test' AND paternal_last_name = 'Usuario';

-- Volver al rol normal
RESET ROLE;

SELECT '✓ INSERCIÓN EXITOSA - LAS POLÍTICAS FUNCIONAN' as resultado;

-- 3. INFORMACIÓN ADICIONAL PARA DEBUGGING
SELECT 'INFORMACIÓN DE DEBUGGING' as info;

-- Ver la configuración de auth
SELECT 
    name,
    setting,
    short_desc
FROM pg_settings 
WHERE name LIKE '%auth%' OR name LIKE '%rls%'
ORDER BY name;

-- =====================================================
-- INTERPRETACIÓN DE RESULTADOS:
--
-- Si este script funciona SIN ERRORES:
--   -> Las políticas RLS están correctas
--   -> El problema está en la autenticación del frontend
--   -> Necesitamos revisar el token JWT
--
-- Si este script da ERROR:
--   -> Hay un problema con las políticas RLS
--   -> Necesitamos recrear las políticas
--
-- =====================================================

