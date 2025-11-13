-- =====================================================
-- MIGRACION: Storage Bucket para Documentos de Usuario
-- Descripción: Crea bucket y políticas para documentos
--             de perfil de usuario y avales
-- =====================================================

-- 1. Crear bucket para documentos de usuario
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acceso para el bucket
-- =====================================================

-- Los usuarios pueden ver sus propios documentos
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Los usuarios pueden subir sus propios documentos
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Los usuarios pueden actualizar sus propios documentos
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Los usuarios pueden eliminar sus propios documentos
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- 3. Comentarios
-- =====================================================

COMMENT ON POLICY "Users can view their own documents" ON storage.objects IS
'Permite a los usuarios ver solo sus propios documentos en user-documents';

COMMENT ON POLICY "Users can upload their own documents" ON storage.objects IS
'Permite a los usuarios subir documentos en su carpeta personal';

COMMENT ON POLICY "Users can update their own documents" ON storage.objects IS
'Permite a los usuarios actualizar sus propios documentos';

COMMENT ON POLICY "Users can delete their own documents" ON storage.objects IS
'Permite a los usuarios eliminar sus propios documentos';

