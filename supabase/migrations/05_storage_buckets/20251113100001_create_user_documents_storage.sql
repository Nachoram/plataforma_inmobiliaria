-- =====================================================
-- MIGRACION: Storage Bucket para Documentos de Usuario
-- Descripción: Crea bucket para documentos de usuario
-- NOTA: Las políticas deben configurarse desde el Dashboard de Supabase
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

-- 2. Verificación y mensaje
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Bucket user-documents creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Configura las políticas manualmente desde el Dashboard de Supabase:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Ve a Storage → user-documents → Policies';
  RAISE NOTICE '2. Crea estas 4 políticas:';
  RAISE NOTICE '';
  RAISE NOTICE '   📖 SELECT: bucket_id = user-documents AND auth.uid()::text = split_part(name, ''/'', 1)';
  RAISE NOTICE '   📤 INSERT: bucket_id = user-documents AND auth.uid()::text = split_part(name, ''/'', 1)';
  RAISE NOTICE '   ✏️  UPDATE: bucket_id = user-documents AND auth.uid()::text = split_part(name, ''/'', 1)';
  RAISE NOTICE '   🗑️  DELETE: bucket_id = user-documents AND auth.uid()::text = split_part(name, ''/'', 1)';
  RAISE NOTICE '';
  RAISE NOTICE '3. Una vez configuradas las políticas, los documentos se subirán correctamente.';
END $$;

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


