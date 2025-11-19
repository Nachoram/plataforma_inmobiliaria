-- =====================================================
-- CONFIGURACIÓN MANUAL: Storage Bucket para Documentos
-- Ejecuta esto en el SQL Editor de Supabase si la migración falla
-- =====================================================

-- 1. Crear el bucket (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Verificar creación del bucket
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-documents') THEN
    RAISE NOTICE '✅ Bucket user-documents creado/verificado exitosamente';
  ELSE
    RAISE EXCEPTION '❌ Error al crear el bucket user-documents';
  END IF;
END $$;

-- =====================================================
-- ⚠️  CONFIGURACIÓN MANUAL DE POLÍTICAS REQUERIDA
-- =====================================================
--
-- Las políticas de storage deben configurarse MANUALMENTE desde el Dashboard de Supabase:
--
-- 1. Ve a: Storage → user-documents → Policies
-- 2. Crea 4 políticas nuevas con esta condición para cada una:
--
--    auth.uid()::text = split_part(name, '/', 1)
--
-- Políticas requeridas:
-- • SELECT (para ver documentos)
-- • INSERT (para subir documentos)
-- • UPDATE (para actualizar documentos)
-- • DELETE (para eliminar documentos)
--
-- Todas con la misma condición: auth.uid()::text = split_part(name, '/', 1)
-- =====================================================
