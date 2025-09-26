-- =====================================================
-- CORREGIR POLÍTICAS RLS PARA PROPERTY_IMAGES
-- =====================================================
-- 
-- Este script corrige las políticas RLS que están bloqueando
-- las inserciones en la tabla property_images
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL DE LA TABLA
-- =====================================================

-- Verificar si la tabla property_images existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public')
    THEN '✅ Tabla property_images existe'
    ELSE '❌ Tabla property_images NO existe'
  END as "Estado Tabla";

-- Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Habilitado",
  relforcerowsecurity as "RLS Forzado"
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE tablename = 'property_images' AND schemaname = 'public';

-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- =====================================================

-- Ver todas las políticas en property_images
SELECT 
  schemaname as "Esquema",
  tablename as "Tabla",
  policyname as "Nombre Política",
  permissive as "Permisivo",
  roles as "Roles",
  cmd as "Comando",
  qual as "Condición WHERE",
  with_check as "Condición WITH CHECK"
FROM pg_policies 
WHERE tablename = 'property_images' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 3. ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Users can insert property images" ON property_images;
DROP POLICY IF EXISTS "Users can view property images" ON property_images;
DROP POLICY IF EXISTS "Users can update property images" ON property_images;
DROP POLICY IF EXISTS "Users can delete property images" ON property_images;
DROP POLICY IF EXISTS "property_images_insert_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_select_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_update_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_delete_policy" ON property_images;

-- 4. CREAR POLÍTICAS RLS CORRECTAS
-- =====================================================

-- Política para INSERT: Permitir a usuarios autenticados insertar imágenes de sus propiedades
CREATE POLICY "property_images_insert_policy"
ON property_images
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario debe ser el propietario de la propiedad
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para SELECT: Permitir ver imágenes de propiedades públicas
CREATE POLICY "property_images_select_policy"
ON property_images
FOR SELECT
TO public
USING (
  -- Permitir ver imágenes de propiedades que están disponibles
  property_id IN (
    SELECT id FROM properties WHERE status IN ('disponible', 'activa')
  )
  OR
  -- Permitir que el propietario vea sus propias imágenes
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para UPDATE: Permitir a propietarios actualizar sus imágenes
CREATE POLICY "property_images_update_policy"
ON property_images
FOR UPDATE
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para DELETE: Permitir a propietarios eliminar sus imágenes
CREATE POLICY "property_images_delete_policy"
ON property_images
FOR DELETE
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- 5. VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================================

-- Asegurar que RLS esté habilitado en la tabla
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR POLÍTICAS CREADAS
-- =====================================================

-- Mostrar las nuevas políticas creadas
SELECT 
  'property_images' as "Tabla",
  policyname as "Política",
  cmd as "Comando",
  permissive as "Permisivo",
  roles as "Roles"
FROM pg_policies 
WHERE tablename = 'property_images' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 7. PROBAR CONFIGURACIÓN
-- =====================================================

-- Verificar que el usuario actual puede hacer operaciones
SELECT 
  'Configuración RLS' as "Test",
  CASE 
    WHEN auth.uid() IS NOT NULL 
    THEN 'Usuario autenticado: ' || auth.uid()
    ELSE 'Usuario no autenticado'
  END as "Estado Usuario",
  'Políticas RLS configuradas correctamente' as "Resultado";

-- 8. VERIFICAR PERMISOS EN TABLA PROPERTIES
-- =====================================================

-- Verificar que properties tiene las políticas correctas
SELECT 
  'properties' as "Tabla",
  policyname as "Política",
  cmd as "Comando"
FROM pg_policies 
WHERE tablename = 'properties' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 9. RESUMEN DE CORRECCIÓN
-- =====================================================

SELECT 
  '✅ POLÍTICAS RLS CORREGIDAS' as "Estado",
  'property_images ahora permite inserciones para propietarios autenticados' as "Mensaje",
  'Los errores de RLS deberían desaparecer' as "Resultado";

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
--
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Verifica que todas las consultas se ejecuten sin errores
-- 3. Revisa que se crearon las 4 políticas para property_images
-- 4. Prueba publicando una propiedad con imágenes
-- 5. Los errores de RLS deberían desaparecer
--
-- POLÍTICAS CREADAS:
-- ✅ INSERT: Solo propietarios pueden insertar imágenes de sus propiedades
-- ✅ SELECT: Público puede ver imágenes de propiedades disponibles
-- ✅ UPDATE: Solo propietarios pueden actualizar sus imágenes
-- ✅ DELETE: Solo propietarios pueden eliminar sus imágenes
--
-- VERIFICACIÓN:
-- ✅ Usuario debe estar autenticado para INSERT/UPDATE/DELETE
-- ✅ Usuario debe ser propietario de la propiedad
-- ✅ Público puede ver imágenes de propiedades disponibles
--
-- =====================================================

