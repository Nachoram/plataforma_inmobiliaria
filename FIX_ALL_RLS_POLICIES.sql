-- =====================================================
-- CORREGIR TODAS LAS POLÍTICAS RLS CRÍTICAS
-- =====================================================
-- 
-- Este script corrige las políticas RLS que están bloqueando
-- las operaciones en properties, property_images, y otras tablas
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL DE LAS TABLAS
-- =====================================================

-- Verificar qué tablas tienen RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Habilitado",
  relforcerowsecurity as "RLS Forzado"
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('properties', 'property_images', 'rental_owners', 'sale_owners')
ORDER BY tablename;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar políticas de properties
DROP POLICY IF EXISTS "Users can insert properties" ON properties;
DROP POLICY IF EXISTS "Users can view properties" ON properties;
DROP POLICY IF EXISTS "Users can update properties" ON properties;
DROP POLICY IF EXISTS "Users can delete properties" ON properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON properties;
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON properties;

-- Eliminar políticas de property_images
DROP POLICY IF EXISTS "Users can insert property images" ON property_images;
DROP POLICY IF EXISTS "Users can view property images" ON property_images;
DROP POLICY IF EXISTS "Users can update property images" ON property_images;
DROP POLICY IF EXISTS "Users can delete property images" ON property_images;
DROP POLICY IF EXISTS "property_images_insert_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_select_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_update_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_delete_policy" ON property_images;

-- Eliminar políticas de rental_owners
DROP POLICY IF EXISTS "Users can insert rental owners" ON rental_owners;
DROP POLICY IF EXISTS "Users can view rental owners" ON rental_owners;
DROP POLICY IF EXISTS "Users can update rental owners" ON rental_owners;
DROP POLICY IF EXISTS "Users can delete rental owners" ON rental_owners;

-- Eliminar políticas de sale_owners
DROP POLICY IF EXISTS "Users can insert sale owners" ON sale_owners;
DROP POLICY IF EXISTS "Users can view sale owners" ON sale_owners;
DROP POLICY IF EXISTS "Users can update sale owners" ON sale_owners;
DROP POLICY IF EXISTS "Users can delete sale owners" ON sale_owners;

-- 3. CREAR POLÍTICAS RLS PARA PROPERTIES
-- =====================================================

-- Política para INSERT: Permitir a usuarios autenticados crear propiedades
CREATE POLICY "properties_insert_policy"
ON properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Política para SELECT: Permitir ver propiedades públicas y propias
CREATE POLICY "properties_select_policy"
ON properties
FOR SELECT
TO public
USING (
  -- Propiedades públicas (disponibles, activas)
  status IN ('disponible', 'activa')
  OR
  -- Propiedades propias
  auth.uid() = owner_id
);

-- Política para UPDATE: Permitir a propietarios actualizar sus propiedades
CREATE POLICY "properties_update_policy"
ON properties
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Política para DELETE: Permitir a propietarios eliminar sus propiedades
CREATE POLICY "properties_delete_policy"
ON properties
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 4. CREAR POLÍTICAS RLS PARA PROPERTY_IMAGES
-- =====================================================

-- Política para INSERT: Permitir a usuarios insertar imágenes de sus propiedades
CREATE POLICY "property_images_insert_policy"
ON property_images
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario debe ser propietario de la propiedad
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para SELECT: Permitir ver imágenes de propiedades públicas y propias
CREATE POLICY "property_images_select_policy"
ON property_images
FOR SELECT
TO public
USING (
  -- Imágenes de propiedades públicas
  property_id IN (
    SELECT id FROM properties WHERE status IN ('disponible', 'activa')
  )
  OR
  -- Imágenes de propiedades propias
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

-- 5. CREAR POLÍTICAS RLS PARA RENTAL_OWNERS
-- =====================================================

-- Política para INSERT: Permitir a usuarios insertar owners de sus propiedades
CREATE POLICY "rental_owners_insert_policy"
ON rental_owners
FOR INSERT
TO authenticated
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para SELECT: Permitir ver owners de propiedades públicas y propias
CREATE POLICY "rental_owners_select_policy"
ON rental_owners
FOR SELECT
TO public
USING (
  property_id IN (
    SELECT id FROM properties WHERE status IN ('disponible', 'activa')
  )
  OR
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para UPDATE: Permitir a propietarios actualizar owners
CREATE POLICY "rental_owners_update_policy"
ON rental_owners
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

-- Política para DELETE: Permitir a propietarios eliminar owners
CREATE POLICY "rental_owners_delete_policy"
ON rental_owners
FOR DELETE
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- 6. CREAR POLÍTICAS RLS PARA SALE_OWNERS
-- =====================================================

-- Política para INSERT: Permitir a usuarios insertar owners de sus propiedades
CREATE POLICY "sale_owners_insert_policy"
ON sale_owners
FOR INSERT
TO authenticated
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para SELECT: Permitir ver owners de propiedades públicas y propias
CREATE POLICY "sale_owners_select_policy"
ON sale_owners
FOR SELECT
TO public
USING (
  property_id IN (
    SELECT id FROM properties WHERE status IN ('disponible', 'activa')
  )
  OR
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Política para UPDATE: Permitir a propietarios actualizar owners
CREATE POLICY "sale_owners_update_policy"
ON sale_owners
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

-- Política para DELETE: Permitir a propietarios eliminar owners
CREATE POLICY "sale_owners_delete_policy"
ON sale_owners
FOR DELETE
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- 7. ASEGURAR QUE RLS ESTÉ HABILITADO
-- =====================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_owners ENABLE ROW LEVEL SECURITY;

-- 8. VERIFICAR POLÍTICAS CREADAS
-- =====================================================

-- Mostrar todas las políticas creadas
SELECT 
  tablename as "Tabla",
  policyname as "Política",
  cmd as "Comando",
  permissive as "Permisivo",
  roles as "Roles"
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'property_images', 'rental_owners', 'sale_owners')
ORDER BY tablename, policyname;

-- 9. PROBAR CONFIGURACIÓN
-- =====================================================

-- Verificar estado del usuario actual
SELECT 
  'Configuración RLS' as "Test",
  CASE 
    WHEN auth.uid() IS NOT NULL 
    THEN 'Usuario autenticado: ' || auth.uid()
    ELSE 'Usuario no autenticado'
  END as "Estado Usuario",
  'Políticas RLS configuradas para todas las tablas críticas' as "Resultado";

-- 10. RESUMEN DE CORRECCIÓN
-- =====================================================

SELECT 
  '✅ TODAS LAS POLÍTICAS RLS CORREGIDAS' as "Estado",
  'properties, property_images, rental_owners, sale_owners configuradas' as "Mensaje",
  'Los errores 403 y RLS deberían desaparecer completamente' as "Resultado";

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
--
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Verifica que todas las consultas se ejecuten sin errores
-- 3. Revisa que se crearon 16 políticas (4 por tabla)
-- 4. Prueba publicando una propiedad con imágenes
-- 5. Los errores 403 y RLS deberían desaparecer completamente
--
-- POLÍTICAS CREADAS:
-- ✅ PROPERTIES: 4 políticas (INSERT, SELECT, UPDATE, DELETE)
-- ✅ PROPERTY_IMAGES: 4 políticas (INSERT, SELECT, UPDATE, DELETE)
-- ✅ RENTAL_OWNERS: 4 políticas (INSERT, SELECT, UPDATE, DELETE)
-- ✅ SALE_OWNERS: 4 políticas (INSERT, SELECT, UPDATE, DELETE)
--
-- PERMISOS:
-- ✅ Usuarios autenticados pueden crear/editar sus propiedades
-- ✅ Público puede ver propiedades disponibles
-- ✅ Solo propietarios pueden modificar sus datos
-- ✅ Relaciones entre tablas respetadas
--
-- =====================================================
