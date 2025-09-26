-- =====================================================
-- CONFIGURACIÓN COMPLETA DE STORAGE PARA PLATAFORMA INMOBILIARIA
-- =====================================================
-- 
-- Este script configura completamente los buckets de storage
-- y las políticas RLS necesarias para la plataforma inmobiliaria.
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

-- 2. LIMPIAR POLÍTICAS EXISTENTES (EVITAR CONFLICTOS)
-- =====================================================

-- Eliminar todas las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- 3. POLÍTICAS RLS PARA PROPERTY-IMAGES BUCKET
-- =====================================================

-- Permitir a usuarios autenticados subir imágenes de propiedades
CREATE POLICY "Users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a todos ver imágenes de propiedades (bucket público)
CREATE POLICY "Anyone can view property images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Permitir a usuarios eliminar sus propias imágenes de propiedades
CREATE POLICY "Users can delete their own property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propias imágenes de propiedades
CREATE POLICY "Users can update their own property images"
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
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios ver sus propios documentos
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios eliminar sus propios documentos
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propios documentos
CREATE POLICY "Users can update their own documents"
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
CREATE POLICY "Users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a todos ver imágenes (bucket público)
CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Permitir a usuarios eliminar sus propias imágenes
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propias imágenes
CREATE POLICY "Users can update their own images"
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
CREATE POLICY "Users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios ver sus propios archivos
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios eliminar sus propios archivos
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propios archivos
CREATE POLICY "Users can update their own files"
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
  cmd as "Comando",
  qual as "Condición WHERE",
  with_check as "Condición WITH CHECK"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (
    policyname LIKE '%property%' OR 
    policyname LIKE '%document%' OR 
    policyname LIKE '%image%' OR
    policyname LIKE '%file%'
  )
ORDER BY policyname;

-- 8. INFORMACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Mostrar resumen de configuración
SELECT 
  'property-images' as bucket,
  'Público - Imágenes de propiedades' as descripcion,
  '10MB' as limite,
  'JPEG, PNG, WebP' as tipos
UNION ALL
SELECT 
  'user-documents' as bucket,
  'Privado - Documentos de usuarios' as descripcion,
  '50MB' as limite,
  'PDF, JPEG, PNG' as tipos
UNION ALL
SELECT 
  'images' as bucket,
  'Público - Imágenes generales (compatibilidad)' as descripcion,
  '10MB' as limite,
  'JPEG, PNG, WebP' as tipos
UNION ALL
SELECT 
  'files' as bucket,
  'Privado - Archivos generales (compatibilidad)' as descripcion,
  '50MB' as limite,
  'PDF, JPEG, PNG' as tipos;

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
-- BUCKETS CREADOS:
-- ✅ property-images (público, 10MB, imágenes)
-- ✅ user-documents (privado, 50MB, documentos)
-- ✅ images (público, 10MB, imágenes - compatibilidad)
-- ✅ files (privado, 50MB, archivos - compatibilidad)
--
-- POLÍTICAS CREADAS:
-- ✅ Upload, View, Delete, Update para cada bucket
-- ✅ Solo usuarios autenticados pueden subir archivos
-- ✅ Solo propietarios pueden eliminar sus archivos
-- ✅ Imágenes públicas visibles para todos
-- ✅ Documentos privados solo para el propietario
--
-- =====================================================

