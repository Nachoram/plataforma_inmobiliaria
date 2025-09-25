-- =====================================================
-- VERIFICACIÓN Y DIAGNÓSTICO DE IMÁGENES DE PROPIEDADES
-- =====================================================
-- 
-- Este script verifica el estado actual de las imágenes
-- y diagnostica problemas específicos.
--
-- IMPORTANTE: Ejecuta este script después de SOLUCION_IMAGENES_PROPIEDADES.sql
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA DE LA TABLA PROPERTY_IMAGES
-- =====================================================

SELECT 
  'ESTRUCTURA DE TABLA' as "Verificación",
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable",
  column_default as "Default"
FROM information_schema.columns 
WHERE table_name = 'property_images' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR BUCKETS DE STORAGE
-- =====================================================

SELECT 
  'BUCKETS DE STORAGE' as "Verificación",
  id as "Bucket ID",
  name as "Nombre",
  public as "Público",
  file_size_limit as "Límite (bytes)",
  allowed_mime_types as "Tipos MIME",
  created_at as "Creado"
FROM storage.buckets 
WHERE id IN ('property-images', 'images', 'files')
ORDER BY id;

-- 3. VERIFICAR POLÍTICAS RLS EN PROPERTY_IMAGES
-- =====================================================

SELECT 
  'POLÍTICAS PROPERTY_IMAGES' as "Verificación",
  policyname as "Política",
  cmd as "Comando",
  permissive as "Permisivo",
  roles as "Roles",
  qual as "Condición WHERE",
  with_check as "Condición WITH CHECK"
FROM pg_policies 
WHERE tablename = 'property_images' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 4. VERIFICAR POLÍTICAS RLS EN STORAGE.OBJECTS
-- =====================================================

SELECT 
  'POLÍTICAS STORAGE' as "Verificación",
  policyname as "Política",
  cmd as "Comando",
  permissive as "Permisivo",
  roles as "Roles"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%property%' OR policyname LIKE '%image%')
ORDER BY policyname;

-- 5. VERIFICAR SI HAY IMÁGENES EN LA BASE DE DATOS
-- =====================================================

SELECT 
  'IMÁGENES EXISTENTES' as "Verificación",
  COUNT(*) as "Total Imágenes",
  COUNT(DISTINCT property_id) as "Propiedades con Imágenes"
FROM property_images;

-- 6. VERIFICAR IMÁGENES POR PROPIEDAD
-- =====================================================

SELECT 
  'IMÁGENES POR PROPIEDAD' as "Verificación",
  p.id as "Property ID",
  p.address_street as "Dirección",
  p.status as "Estado",
  COUNT(pi.id) as "Cantidad Imágenes",
  STRING_AGG(pi.image_url, ', ') as "URLs de Imágenes"
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id, p.address_street, p.status
HAVING COUNT(pi.id) > 0
ORDER BY COUNT(pi.id) DESC
LIMIT 10;

-- 7. VERIFICAR ARCHIVOS EN STORAGE
-- =====================================================

SELECT 
  'ARCHIVOS EN STORAGE' as "Verificación",
  bucket_id as "Bucket",
  COUNT(*) as "Total Archivos",
  COUNT(DISTINCT (storage.foldername(name))[1]) as "Usuarios Únicos"
FROM storage.objects
WHERE bucket_id IN ('property-images', 'images')
GROUP BY bucket_id
ORDER BY bucket_id;

-- 8. VERIFICAR PERMISOS DE USUARIO ACTUAL
-- =====================================================

SELECT 
  'PERMISOS USUARIO' as "Verificación",
  CASE 
    WHEN auth.uid() IS NOT NULL 
    THEN 'Usuario autenticado: ' || auth.uid()
    ELSE 'Usuario no autenticado'
  END as "Estado Usuario",
  'Verificando permisos...' as "Permisos";

-- 9. PROBAR CONSULTA DE PROPIEDADES CON IMÁGENES
-- =====================================================

-- Esta consulta simula lo que hace el frontend
SELECT 
  'CONSULTA FRONTEND' as "Verificación",
  p.id,
  p.address_street,
  p.status,
  pi.image_url,
  pi.storage_path
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
WHERE p.status IN ('disponible', 'activa')
ORDER BY p.created_at DESC
LIMIT 5;

-- 10. VERIFICAR RLS EN TABLA PROPERTIES
-- =====================================================

SELECT 
  'POLÍTICAS PROPERTIES' as "Verificación",
  policyname as "Política",
  cmd as "Comando",
  permissive as "Permisivo",
  roles as "Roles"
FROM pg_policies 
WHERE tablename = 'properties' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 11. RESUMEN DE DIAGNÓSTICO
-- =====================================================

SELECT 
  '📊 RESUMEN DE DIAGNÓSTICO' as "Estado",
  CASE 
    WHEN EXISTS (SELECT 1 FROM property_images LIMIT 1)
    THEN '✅ Hay imágenes en la base de datos'
    ELSE '❌ No hay imágenes en la base de datos'
  END as "Imágenes BD",
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id IN ('property-images', 'images') LIMIT 1)
    THEN '✅ Hay archivos en storage'
    ELSE '❌ No hay archivos en storage'
  END as "Archivos Storage",
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_images' AND schemaname = 'public' LIMIT 1)
    THEN '✅ Políticas RLS configuradas'
    ELSE '❌ Políticas RLS faltantes'
  END as "Políticas RLS";

-- =====================================================
-- INSTRUCCIONES DE DIAGNÓSTICO
-- =====================================================
--
-- 1. Ejecuta este script después de SOLUCION_IMAGENES_PROPIEDADES.sql
-- 2. Revisa cada sección de verificación
-- 3. Si hay problemas, ejecuta las correcciones específicas
-- 4. Verifica que:
--    - La tabla property_images existe y tiene la estructura correcta
--    - Los buckets de storage están configurados como públicos
--    - Las políticas RLS permiten acceso público a las imágenes
--    - Hay imágenes en la base de datos
--    - Los archivos están en storage
--
-- PROBLEMAS COMUNES Y SOLUCIONES:
-- ❌ No hay imágenes en BD: Verificar proceso de subida
-- ❌ No hay archivos en storage: Verificar políticas de upload
-- ❌ Políticas RLS faltantes: Ejecutar SOLUCION_IMAGENES_PROPIEDADES.sql
-- ❌ Buckets no públicos: Verificar configuración de buckets
--
-- =====================================================
