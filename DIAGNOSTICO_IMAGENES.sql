-- =====================================================
-- DIAGNÓSTICO DE IMÁGENES DE PROPIEDADES
-- =====================================================
-- 
-- Este script diagnostica por qué las imágenes no se muestran
-- después de aplicar la solución.
--
-- IMPORTANTE: Ejecuta este script para diagnosticar problemas
-- =====================================================

-- 1. VERIFICAR SI HAY IMÁGENES EN LA BASE DE DATOS
-- =====================================================

SELECT 
  'IMÁGENES EN BASE DE DATOS' as "Verificación",
  COUNT(*) as "Total Imágenes",
  COUNT(DISTINCT property_id) as "Propiedades con Imágenes"
FROM property_images;

-- 2. VERIFICAR IMÁGENES POR PROPIEDAD
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

-- 3. VERIFICAR ARCHIVOS EN STORAGE
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

-- 4. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT 
  'POLÍTICAS PROPERTY_IMAGES' as "Verificación",
  policyname as "Política",
  cmd as "Comando",
  permissive as "Permisivo",
  roles as "Roles"
FROM pg_policies 
WHERE tablename = 'property_images' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 5. VERIFICAR BUCKETS DE STORAGE
-- =====================================================

SELECT 
  'BUCKETS DE STORAGE' as "Verificación",
  id as "Bucket ID",
  name as "Nombre",
  public as "Público",
  file_size_limit as "Límite (bytes)"
FROM storage.buckets 
WHERE id IN ('property-images', 'images')
ORDER BY id;

-- 6. PROBAR CONSULTA FRONTEND
-- =====================================================

-- Esta consulta simula lo que hace el frontend
SELECT 
  'CONSULTA FRONTEND SIMULADA' as "Verificación",
  p.id as "Property ID",
  p.address_street as "Dirección",
  p.status as "Estado",
  pi.image_url as "URL Imagen",
  CASE 
    WHEN pi.image_url LIKE '%property-images%' THEN '✅ Bucket Correcto'
    WHEN pi.image_url LIKE '%images%' THEN '⚠️ Bucket Antiguo'
    ELSE '❌ URL Desconocida'
  END as "Estado URL"
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
WHERE p.status IN ('disponible', 'activa')
ORDER BY p.created_at DESC
LIMIT 5;

-- 7. VERIFICAR PERMISOS DE USUARIO
-- =====================================================

SELECT 
  'PERMISOS USUARIO' as "Verificación",
  CASE 
    WHEN auth.uid() IS NOT NULL 
    THEN 'Usuario autenticado: ' || auth.uid()
    ELSE 'Usuario no autenticado'
  END as "Estado Usuario";

-- 8. RESUMEN DE DIAGNÓSTICO
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
-- 1. Ejecuta este script para diagnosticar problemas
-- 2. Revisa cada sección de verificación
-- 3. Si hay problemas, ejecuta las correcciones específicas
-- 4. Verifica que:
--    - Hay imágenes en la base de datos
--    - Hay archivos en storage
--    - Las políticas RLS están configuradas
--    - Los buckets son públicos
--    - Las URLs son correctas
--
-- PROBLEMAS COMUNES Y SOLUCIONES:
-- ❌ No hay imágenes en BD: Verificar proceso de subida
-- ❌ No hay archivos en storage: Verificar políticas de upload
-- ❌ Políticas RLS faltantes: Ejecutar SOLUCION_IMAGENES_FINAL.sql
-- ❌ Buckets no públicos: Verificar configuración de buckets
-- ❌ URLs incorrectas: Verificar migración de buckets
--
-- =====================================================
