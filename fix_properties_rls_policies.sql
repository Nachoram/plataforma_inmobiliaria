-- =====================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA TABLA PROPERTIES
-- Este script soluciona el error HTTP 406 implementando
-- las políticas RLS faltantes para la tabla properties
-- =====================================================

-- PASO 1: VERIFICAR POLÍTICAS ACTUALES PARA PROPERTIES
SELECT '=== VERIFICACIÓN INICIAL - PROPERTIES POLICIES ===' as step;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'properties';

-- PASO 2: HABILITAR RLS EN LA TABLA PROPERTIES
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- PASO 3: LIMPIAR POLÍTICAS EXISTENTES CONFLICTIVAS
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

-- PASO 4: CREAR LAS POLÍTICAS RLS CORRECTAS PARA PROPERTIES

-- Política SELECT: Usuarios pueden ver propiedades disponibles públicamente O sus propias propiedades
CREATE POLICY "properties_select_policy"
ON public.properties FOR SELECT
USING (
  (status = 'disponible'::property_status_enum) OR
  (auth.role() = 'authenticated' AND auth.uid() = owner_id)
);

-- Política INSERT: Solo usuarios autenticados pueden crear sus propias propiedades
CREATE POLICY "properties_insert_policy"
ON public.properties FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- Política UPDATE: Solo el propietario puede actualizar su propia propiedad
CREATE POLICY "properties_update_policy"
ON public.properties FOR UPDATE
USING (
  auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- Política DELETE: Solo el propietario puede eliminar su propia propiedad
CREATE POLICY "properties_delete_policy"
ON public.properties FOR DELETE
USING (
  auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- PASO 5: VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT '=== VERIFICACIÓN FINAL - PROPERTIES POLICIES CREADAS ===' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'properties';

-- PASO 6: CONFIRMAR QUE RLS ESTÁ HABILITADO
SELECT '=== VERIFICACIÓN RLS STATUS ===' as rls_check;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'properties';

-- PASO 7: MENSAJE DE CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '🎉 POLÍTICAS RLS PARA PROPERTIES CREADAS EXITOSAMENTE';
    RAISE NOTICE 'El error HTTP 406 Not Acceptable debería estar resuelto';
    RAISE NOTICE 'Los usuarios ahora pueden ver y crear propiedades correctamente';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Próximos pasos:';
    RAISE NOTICE '1. Recarga tu aplicación React (F5)';
    RAISE NOTICE '2. Abre la consola del navegador (F12)';
    RAISE NOTICE '3. Prueba el formulario de publicación de propiedades';
    RAISE NOTICE '4. Verifica que no aparezcan errores 406 en la consola';
END $$;
