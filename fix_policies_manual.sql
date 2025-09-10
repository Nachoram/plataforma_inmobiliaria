-- =====================================================
-- SOLUCIÓN COMPLETA PARA CORREGIR POLÍTICAS RLS
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- =====================================================

-- === PASO 1: VERIFICAR POLÍTICAS ACTUALES ===
SELECT '=== PROPERTIES POLICIES ===' as table_check;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'properties';

SELECT '=== PROFILES POLICIES ===' as table_check;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'profiles';

-- === PASO 2: LIMPIAR POLÍTICAS CONFLICTIVAS ===

-- Limpiar properties policies
DROP POLICY IF EXISTS "properties_select_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_update_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

-- Limpiar profiles policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- === PASO 3: CREAR NUEVAS POLÍTICAS PARA PROPERTIES ===

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

-- === PASO 4: CREAR NUEVAS POLÍTICAS PARA PROFILES ===

-- Política SELECT: Usuarios autenticados pueden ver todos los perfiles (para info pública)
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Política INSERT: Solo crear perfil propio
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política UPDATE: Solo actualizar perfil propio
CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política DELETE: Solo eliminar perfil propio
CREATE POLICY "profiles_delete_policy"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- === PASO 5: VERIFICACIÓN FINAL ===
SELECT '=== PROPERTIES POLICIES AFTER FIX ===' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'properties';

SELECT '=== PROFILES POLICIES AFTER FIX ===' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- === PASO 6: MENSAJE DE CONFIRMACIÓN ===
DO $$
BEGIN
    RAISE NOTICE '🎉 POLÍTICAS RLS CORREGIDAS EXITOSAMENTE';
    RAISE NOTICE 'Los errores 403 Forbidden y 406 Not Acceptable deberían estar resueltos';
    RAISE NOTICE 'Los usuarios ahora pueden crear/ver propiedades correctamente';
END $$;
