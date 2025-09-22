-- =====================================================
-- SCRIPT SEGURO PARA SOLUCIONAR ERROR 403 EN TABLA GUARANTORS
-- =====================================================
-- Este script elimina TODAS las políticas existentes primero
-- y luego crea las nuevas para evitar conflictos

-- 1. HABILITAR RLS EN LA TABLA (si no está habilitado)
ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES PARA GARANTORS
-- Obtenemos la lista de todas las políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Eliminar todas las políticas existentes para la tabla guarantors
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'guarantors'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.guarantors', policy_record.policyname);
    END LOOP;
END $$;

-- 3. CREAR POLÍTICAS NUEVAS Y COMPLETAS
-- Estas políticas cubren todos los casos de uso necesarios

-- Política para SELECT (lectura)
CREATE POLICY "Allow authenticated to read guarantors"
ON public.guarantors
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT (inserción) - ESTA ES LA MÁS IMPORTANTE
CREATE POLICY "Allow authenticated to insert guarantors"
ON public.guarantors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE (actualización)
CREATE POLICY "Allow authenticated to update guarantors"
ON public.guarantors
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE (eliminación)
CREATE POLICY "Allow authenticated to delete guarantors"
ON public.guarantors
FOR DELETE
TO authenticated
USING (true);

-- 4. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT 
    policyname as "Policy Name",
    cmd as "Operation",
    permissive as "Type",
    roles as "Roles"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'guarantors'
ORDER BY policyname;

-- 5. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    CASE 
        WHEN relrowsecurity = 't' THEN 'RLS ENABLED ✓'
        ELSE 'RLS DISABLED ✗'
    END as "RLS Status"
FROM pg_class 
WHERE relname = 'guarantors' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =====================================================
-- RESULTADO ESPERADO:
-- - 4 políticas creadas para guarantors
-- - RLS habilitado
-- - Error 403 solucionado
-- =====================================================
