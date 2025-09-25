-- =====================================================
-- CONFIGURACIÓN CORREGIDA DE STORAGE PARA PLATAFORMA INMOBILIARIA
-- =====================================================
-- 
-- Este script maneja correctamente las políticas existentes
-- y configura completamente el storage de la plataforma.
--
-- IMPORTANTE: Ejecuta este script completo en el SQL Editor de Supabase
-- =====================================================

-- 1. CREAR BUCKETS DE STORAGE
-- =====================================================

-- Bucket para imágenes de propiedades (PÚBLICO)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para documentos de usuarios (PRIVADO)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para imágenes generales - COMPATIBILIDAD (PÚBLICO)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para archivos generales - COMPATIBILIDAD (PRIVADO)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES (MÉTODO ROBUSTO)
-- =====================================================

-- Función para eliminar políticas de forma segura
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Obtener todas las políticas relacionadas con storage
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          AND (
            policyname LIKE '%property%' OR 
            policyname LIKE '%document%' OR 
            policyname LIKE '%image%' OR
            policyname LIKE '%file%' OR
            policyname LIKE '%upload%' OR
            policyname LIKE '%view%' OR
            policyname LIKE '%delete%'
          )
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
            RAISE NOTICE 'Eliminada política: %', policy_record.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error eliminando política %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. POLÍTICAS RLS PARA PROPERTY-IMAGES BUCKET
-- =====================================================

-- Permitir a usuarios autenticados subir imágenes de propiedades
CREATE POLICY "property_images_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a todos ver imágenes de propiedades (bucket público)
CREATE POLICY "property_images_view_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Permitir a usuarios eliminar sus propias imágenes de propiedades
CREATE POLICY "property_images_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propias imágenes de propiedades
CREATE POLICY "property_images_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. POLÍTICAS RLS PARA USER-DOCUMENTS BUCKET
-- =====================================================

-- Permitir a usuarios autenticados subir sus propios documentos
CREATE POLICY "user_documents_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios ver sus propios documentos
CREATE POLICY "user_documents_view_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios eliminar sus propios documentos
CREATE POLICY "user_documents_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propios documentos
CREATE POLICY "user_documents_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. POLÍTICAS RLS PARA IMAGES BUCKET (COMPATIBILIDAD)
-- =====================================================

-- Permitir a usuarios autenticados subir imágenes
CREATE POLICY "images_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a todos ver imágenes (bucket público)
CREATE POLICY "images_view_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Permitir a usuarios eliminar sus propias imágenes
CREATE POLICY "images_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propias imágenes
CREATE POLICY "images_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. POLÍTICAS RLS PARA FILES BUCKET (COMPATIBILIDAD)
-- =====================================================

-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "files_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios ver sus propios archivos
CREATE POLICY "files_view_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios eliminar sus propios archivos
CREATE POLICY "files_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propios archivos
CREATE POLICY "files_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Mostrar buckets creados
SELECT 
  id as "Bucket ID",
  name as "Nombre",
  public as "Público",
  file_size_limit as "Límite (bytes)",
  allowed_mime_types as "Tipos MIME Permitidos",
  created_at as "Creado"
FROM storage.buckets 
WHERE id IN ('property-images', 'user-documents', 'images', 'files')
ORDER BY id;

-- Mostrar políticas creadas
SELECT 
  schemaname as "Esquema",
  tablename as "Tabla",
  policyname as "Nombre de Política",
  permissive as "Permisivo",
  roles as "Roles",
  cmd as "Comando"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%property%' OR 
    policyname LIKE '%document%' OR 
    policyname LIKE '%image%' OR
    policyname LIKE '%file%'
  )
ORDER BY policyname;

-- 8. RESUMEN DE CONFIGURACIÓN
-- =====================================================

SELECT 
  '✅ CONFIGURACIÓN COMPLETADA' as status,
  '4 buckets creados' as buckets,
  '16 políticas RLS creadas' as policies,
  'Storage configurado correctamente' as message;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
--
-- 1. Copia y pega TODO este script en el SQL Editor de Supabase
-- 2. Ejecuta el script completo
-- 3. Verifica que se crearon los 4 buckets
-- 4. Verifica que se crearon las 16 políticas
-- 5. Prueba la aplicación - los errores 403 deberían desaparecer
--
-- MEJORAS EN ESTA VERSIÓN:
-- ✅ Elimina políticas existentes de forma segura
-- ✅ Usa nombres únicos para políticas (evita conflictos)
-- ✅ Maneja errores durante la eliminación de políticas
-- ✅ Muestra notificaciones de progreso
-- ✅ Verificación completa al final
--
-- =====================================================
