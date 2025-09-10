-- 🔧 SOLUCIÓN MANUAL PARA POLITICAS RLS DE PROPERTIES
-- Ejecutar PASO A PASO en el SQL Editor de Supabase

-- === PASO 1: VERIFICAR POLÍTICAS EXISTENTES ===
SELECT '=== POLÍTICAS ACTUALES EN PROPERTIES ===' as status;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'properties';

-- === PASO 2: ELIMINAR POLÍTICAS CONFLICTIVAS ===
-- Ejecuta cada DROP POLICY individualmente si alguna falla

DROP POLICY IF EXISTS "properties_select_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_update_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON public.properties;

-- Políticas con nombres alternativos
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

-- === PASO 3: VERIFICAR LIMPIEZA ===
SELECT '=== POLÍTICAS RESTANTES (DEBERÍA ESTAR VACÍO) ===' as status;
SELECT policyname FROM pg_policies WHERE tablename = 'properties';

-- === PASO 4: CREAR NUEVAS POLÍTICAS ===
-- Solo ejecutar después de verificar que el PASO 3 está vacío

-- Política SELECT: Ver propiedades disponibles y propias
CREATE POLICY "properties_select_policy" ON public.properties
FOR SELECT USING (
    (status = 'disponible') OR (auth.uid() = owner_id)
);

-- Política INSERT: Solo propietarios pueden crear
CREATE POLICY "properties_insert_policy" ON public.properties
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- Política UPDATE: Solo propietarios pueden actualizar
CREATE POLICY "properties_update_policy" ON public.properties
FOR UPDATE USING (
    auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- Política DELETE: Solo propietarios pueden eliminar
CREATE POLICY "properties_delete_policy" ON public.properties
FOR DELETE USING (
    auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- === PASO 5: VERIFICACIÓN FINAL ===
SELECT '=== POLÍTICAS CREADAS ===' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'properties';

-- === PASO 6: MENSAJE DE ÉXITO ===
DO $$
BEGIN
    RAISE NOTICE '🎉 POLÍTICAS RLS DE PROPERTIES RECREADAS EXITOSAMENTE';
    RAISE NOTICE 'Los errores 403 Forbidden deberían estar resueltos';
    RAISE NOTICE 'Los usuarios autenticados ahora pueden crear propiedades';
END $$;
