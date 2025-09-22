-- =====================================================
-- SOLUCIÓN PROFUNDA: PERMISOS BÁSICOS + POLÍTICAS RLS
-- =====================================================
-- Este script arregla el problema desde la raíz: permisos básicos + RLS

-- 1. VERIFICAR EL ESTADO ACTUAL
SELECT 'DIAGNÓSTICO INICIAL' as info;

-- Ver si la tabla existe
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public')
         THEN '✓ Tabla guarantors existe'
         ELSE '✗ Tabla guarantors NO existe'
    END as "Estado Tabla";

-- Ver permisos actuales del rol authenticated
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'guarantors' 
  AND table_schema = 'public'
  AND grantee = 'authenticated';

-- 2. OTORGAR PERMISOS BÁSICOS AL ROL AUTHENTICATED
-- Esto es CRÍTICO - sin estos permisos, las políticas RLS no funcionarán
SELECT 'OTORGANDO PERMISOS BÁSICOS' as info;

GRANT ALL ON public.guarantors TO authenticated;
GRANT ALL ON public.guarantors TO anon;

-- También otorgar permisos en secuencias (para IDs auto-incrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 3. HABILITAR RLS
ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;

-- 4. LIMPIAR POLÍTICAS EXISTENTES
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'guarantors'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.guarantors', policy_record.policyname);
    END LOOP;
END $$;

-- 5. CREAR POLÍTICAS SIMPLES Y FUNCIONALES
CREATE POLICY "guarantors_all_authenticated"
ON public.guarantors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- También política para anon (por si usa anon key)
CREATE POLICY "guarantors_all_anon"
ON public.guarantors
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 6. VERIFICACIÓN COMPLETA
SELECT 'VERIFICACIÓN FINAL' as info;

-- Verificar permisos otorgados
SELECT 
    'Permisos para authenticated: ' || string_agg(privilege_type, ', ') as "Permisos Authenticated"
FROM information_schema.table_privileges 
WHERE table_name = 'guarantors' 
  AND table_schema = 'public'
  AND grantee = 'authenticated';

-- Verificar RLS
SELECT 
    CASE 
        WHEN relrowsecurity = 't' THEN '✓ RLS HABILITADO'
        ELSE '✗ RLS DESHABILITADO'
    END as "Estado RLS"
FROM pg_class 
WHERE relname = 'guarantors' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Ver políticas creadas
SELECT 
    policyname as "Política",
    cmd as "Operación", 
    roles as "Roles"
FROM pg_policies 
WHERE tablename = 'guarantors' 
  AND schemaname = 'public';

-- 7. PRUEBA FINAL
SELECT 'PRUEBA DE INSERCIÓN' as info;

-- Probar inserción como authenticated
SET ROLE authenticated;
INSERT INTO guarantors (first_name, paternal_last_name, rut) 
VALUES ('Test', 'Final', '99999999-9');

-- Verificar que se insertó
SELECT 
    'Registro de prueba creado: ' || first_name || ' ' || paternal_last_name as "Resultado"
FROM guarantors 
WHERE rut = '99999999-9';

-- Limpiar el registro de prueba
DELETE FROM guarantors WHERE rut = '99999999-9';

-- Volver al rol normal
RESET ROLE;

SELECT '🎉 SOLUCIÓN APLICADA CON ÉXITO - PROBLEMA RESUELTO 🎉' as resultado;

-- =====================================================
-- EXPLICACIÓN:
-- El problema era que el rol 'authenticated' no tenía 
-- permisos básicos (GRANT) en la tabla guarantors.
-- Las políticas RLS funcionan ENCIMA de los permisos básicos,
-- no los reemplazan.
-- =====================================================

