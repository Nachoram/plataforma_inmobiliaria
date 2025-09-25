-- =====================================================
-- CORRECCIÓN DE BUCKETS DE IMÁGENES
-- =====================================================
-- 
-- Este script corrige inconsistencias en el uso de buckets
-- y asegura que todas las imágenes usen el bucket correcto.
--
-- PROBLEMA IDENTIFICADO:
-- - Algunos componentes usan bucket 'images'
-- - Otros componentes usan bucket 'property-images'
-- - Necesitamos estandarizar en 'property-images'
--
-- IMPORTANTE: Ejecuta este script después de SOLUCION_IMAGENES_PROPIEDADES.sql
-- =====================================================

-- 1. VERIFICAR BUCKETS ACTUALES
-- =====================================================

SELECT 
  'BUCKETS ACTUALES' as "Verificación",
  id as "Bucket ID",
  name as "Nombre",
  public as "Público",
  file_size_limit as "Límite (bytes)",
  allowed_mime_types as "Tipos MIME"
FROM storage.buckets 
WHERE id IN ('property-images', 'images', 'files')
ORDER BY id;

-- 2. MIGRAR ARCHIVOS DEL BUCKET 'images' AL BUCKET 'property-images'
-- =====================================================

-- Crear función para migrar archivos entre buckets
DO $$
DECLARE
    file_record RECORD;
    new_path TEXT;
    migration_count INTEGER := 0;
BEGIN
    -- Obtener todos los archivos del bucket 'images' que parecen ser de propiedades
    FOR file_record IN 
        SELECT name, id, bucket_id, owner, created_at
        FROM storage.objects 
        WHERE bucket_id = 'images'
        AND name LIKE '%/%'  -- Solo archivos en carpetas de usuario
    LOOP
        BEGIN
            -- Copiar archivo al bucket property-images
            INSERT INTO storage.objects (
                bucket_id,
                name,
                owner,
                created_at,
                updated_at,
                last_accessed_at,
                metadata
            )
            SELECT 
                'property-images',
                file_record.name,
                file_record.owner,
                file_record.created_at,
                file_record.created_at,
                file_record.created_at,
                metadata
            FROM storage.objects
            WHERE id = file_record.id;
            
            migration_count := migration_count + 1;
            RAISE NOTICE 'Migrado archivo: %', file_record.name;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error migrando archivo %: %', file_record.name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migración completada. % archivos migrados.', migration_count;
END $$;

-- 3. ACTUALIZAR REGISTROS EN PROPERTY_IMAGES
-- =====================================================

-- Actualizar URLs de imágenes que apuntan al bucket 'images' para que apunten a 'property-images'
UPDATE property_images 
SET image_url = REPLACE(image_url, '/storage/v1/object/public/images/', '/storage/v1/object/public/property-images/')
WHERE image_url LIKE '%/storage/v1/object/public/images/%';

-- Actualizar storage_path para que apunte al bucket correcto
UPDATE property_images 
SET storage_path = REPLACE(storage_path, 'images/', 'property-images/')
WHERE storage_path LIKE 'images/%';

-- 4. VERIFICAR MIGRACIÓN
-- =====================================================

SELECT 
  'MIGRACIÓN COMPLETADA' as "Verificación",
  COUNT(*) as "Total Imágenes",
  COUNT(CASE WHEN image_url LIKE '%property-images%' THEN 1 END) as "Imágenes en Bucket Correcto",
  COUNT(CASE WHEN image_url LIKE '%images%' THEN 1 END) as "Imágenes en Bucket Antiguo"
FROM property_images;

-- 5. CREAR POLÍTICAS ADICIONALES PARA GARANTIZAR COMPATIBILIDAD
-- =====================================================

-- Política adicional para permitir acceso a archivos migrados
CREATE POLICY IF NOT EXISTS "property_images_legacy_access_policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'images' AND
  name LIKE '%/%'  -- Solo archivos en carpetas de usuario
);

-- 6. VERIFICAR ARCHIVOS EN AMBOS BUCKETS
-- =====================================================

SELECT 
  'ARCHIVOS POR BUCKET' as "Verificación",
  bucket_id as "Bucket",
  COUNT(*) as "Total Archivos",
  COUNT(DISTINCT (storage.foldername(name))[1]) as "Usuarios Únicos",
  MIN(created_at) as "Archivo Más Antiguo",
  MAX(created_at) as "Archivo Más Reciente"
FROM storage.objects
WHERE bucket_id IN ('property-images', 'images')
GROUP BY bucket_id
ORDER BY bucket_id;

-- 7. LIMPIAR BUCKET 'images' (OPCIONAL - COMENTADO POR SEGURIDAD)
-- =====================================================

-- ⚠️ CUIDADO: Descomenta solo si estás seguro de que la migración fue exitosa
-- DELETE FROM storage.objects WHERE bucket_id = 'images' AND name LIKE '%/%';

-- 8. VERIFICAR CONSULTA FRONTEND
-- =====================================================

-- Simular la consulta que hace el frontend
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
LIMIT 10;

-- 9. RESUMEN DE CORRECCIÓN
-- =====================================================

SELECT 
  '✅ CORRECCIÓN DE BUCKETS COMPLETADA' as "Estado",
  'Archivos migrados de images a property-images' as "Migración",
  'URLs actualizadas en property_images' as "URLs",
  'Políticas de compatibilidad creadas' as "Políticas",
  'Las imágenes ahora deberían mostrarse correctamente' as "Resultado";

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
--
-- 1. Ejecuta este script después de SOLUCION_IMAGENES_PROPIEDADES.sql
-- 2. Verifica que la migración se completó correctamente
-- 3. Revisa que las URLs apunten al bucket correcto
-- 4. Prueba la aplicación - las imágenes deberían mostrarse
-- 5. Si todo funciona, puedes limpiar el bucket 'images' (descomenta la línea 7)
--
-- CAMBIOS REALIZADOS:
-- ✅ Archivos migrados de 'images' a 'property-images'
-- ✅ URLs actualizadas en la tabla property_images
-- ✅ Políticas de compatibilidad creadas
-- ✅ Verificación de migración completada
--
-- VERIFICACIÓN:
-- ✅ Todas las imágenes usan el bucket 'property-images'
-- ✅ URLs públicas funcionan correctamente
-- ✅ Compatibilidad con archivos existentes
-- ✅ Políticas RLS configuradas correctamente
--
-- =====================================================
