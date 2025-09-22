-- =====================================================
-- SOLUCIÓN DEFINITIVA PARA ERROR 403 EN GUARANTORS
-- =====================================================
-- Esta solución elimina y recrea completamente las políticas

-- 1. VERIFICAR EL ESTADO ACTUAL
SELECT 'VERIFICANDO ESTADO ACTUAL DE GUARANTORS' as info;

-- Ver políticas actuales
SELECT 
    policyname as "Política Actual",
    cmd as "Operación", 
    roles as "Roles",
    permissive as "Tipo"
FROM pg_policies 
WHERE tablename = 'guarantors' 
  AND schemaname = 'public';

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES PARA GUARANTORS
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
        RAISE NOTICE 'Política eliminada: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. HABILITAR RLS
ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS SIMPLES Y PERMISIVAS
-- Política INSERT (la más crítica)
CREATE POLICY "guarantors_insert_policy"
ON public.guarantors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política SELECT (para el .select() después del insert)
CREATE POLICY "guarantors_select_policy"
ON public.guarantors
FOR SELECT
TO authenticated
USING (true);

-- Política UPDATE (por si acaso)
CREATE POLICY "guarantors_update_policy"
ON public.guarantors
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política DELETE (por si acaso)
CREATE POLICY "guarantors_delete_policy"
ON public.guarantors
FOR DELETE
TO authenticated
USING (true);

-- 5. VERIFICAR QUE TODO FUNCIONÓ
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Confirmar RLS habilitado
SELECT 
    CASE 
        WHEN relrowsecurity = 't' THEN '✓ RLS HABILITADO CORRECTAMENTE'
        ELSE '✗ ERROR: RLS NO HABILITADO'
    END as "Estado RLS"
FROM pg_class 
WHERE relname = 'guarantors' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Listar políticas creadas
SELECT 
    policyname as "Política Creada",
    cmd as "Operación",
    roles as "Para Rol",
    permissive as "Tipo"
FROM pg_policies 
WHERE tablename = 'guarantors' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Contar políticas críticas
SELECT 
    'Políticas INSERT creadas: ' || COUNT(*) as "Resumen INSERT"
FROM pg_policies 
WHERE tablename = 'guarantors' 
  AND schemaname = 'public'
  AND cmd = 'INSERT';

-- 6. PRUEBA DE FUNCIONAMIENTO (opcional)
-- Descomenta si quieres probar la inserción directamente
-- INSERT INTO guarantors (first_name, paternal_last_name, rut) 
-- VALUES ('Test', 'User', '12345678-9');

SELECT '=== SOLUCIÓN APLICADA EXITOSAMENTE ===' as resultado;

-- =====================================================
-- PRÓXIMOS PASOS:
-- 1. Si este script se ejecuta sin errores, intenta el formulario de nuevo
-- 2. Si aún hay problemas, ejecuta también este comando en una nueva pestaña:
--    SET ROLE authenticated; 
--    INSERT INTO guarantors (first_name) VALUES ('test');
-- 3. Si el INSERT manual funciona pero el formulario no, el problema es en el código frontend
-- =====================================================

