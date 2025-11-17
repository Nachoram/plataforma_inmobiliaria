-- =====================================================
-- ROLLBACK 05_STORAGE - Eliminar buckets y políticas de storage
-- =====================================================
-- Este script elimina todos los buckets de Supabase Storage
-- y sus políticas de seguridad

DO $$
BEGIN
    RAISE NOTICE '🗂️ Iniciando rollback de storage...';
END $$;

-- =====================================================
-- ELIMINAR POLÍTICAS DE STORAGE
-- =====================================================

-- Políticas del bucket user-documents
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects CASCADE;

-- Políticas del bucket property-images
DROP POLICY IF EXISTS "Property owners can delete their property images" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Property owners can update their property images" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects CASCADE;

-- Políticas de otros buckets creados en migraciones recientes
DROP POLICY IF EXISTS "Buyers can delete executives of their offers" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Buyers can update executives of their offers" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Buyers can insert executives in their offers" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Sellers can view executives of offers on their properties" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Buyers can view executives of their offers" ON storage.objects CASCADE;

-- =====================================================
-- VACIAR BUCKETS (ELIMINAR TODOS LOS ARCHIVOS)
-- =====================================================

-- Función auxiliar para eliminar todos los objetos de un bucket
CREATE OR REPLACE FUNCTION delete_all_objects_from_bucket(bucket_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Eliminar todos los objetos del bucket
    DELETE FROM storage.objects WHERE bucket_id = bucket_name;

    RAISE NOTICE 'Eliminados todos los objetos del bucket: %', bucket_name;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error al eliminar objetos del bucket %: %', bucket_name, SQLERRM;
END;
$$;

-- Vaciar buckets existentes
SELECT delete_all_objects_from_bucket('property-images');
SELECT delete_all_objects_from_bucket('user-documents');
SELECT delete_all_objects_from_bucket('jolly_fire');
SELECT delete_all_objects_from_bucket('odd_limit');
SELECT delete_all_objects_from_bucket('light_tree');
SELECT delete_all_objects_from_bucket('withered_marsh');

-- =====================================================
-- ELIMINAR BUCKETS
-- =====================================================

-- Eliminar buckets creados en migraciones recientes
DELETE FROM storage.buckets WHERE id = 'withered_marsh';
DELETE FROM storage.buckets WHERE id = 'light_tree';
DELETE FROM storage.buckets WHERE id = 'odd_limit';
DELETE FROM storage.buckets WHERE id = 'jolly_fire';

-- Eliminar buckets principales del esquema
DELETE FROM storage.buckets WHERE id = 'user-documents';
DELETE FROM storage.buckets WHERE id = 'property-images';

-- =====================================================
-- LIMPIEZA DE FUNCIONES AUXILIARES
-- =====================================================

-- Eliminar función auxiliar
DROP FUNCTION IF EXISTS delete_all_objects_from_bucket(text) CASCADE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    remaining_buckets integer;
    remaining_storage_policies integer;
    remaining_objects integer;
BEGIN
    SELECT COUNT(*) INTO remaining_buckets
    FROM storage.buckets;

    SELECT COUNT(*) INTO remaining_storage_policies
    FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage';

    SELECT COUNT(*) INTO remaining_objects
    FROM storage.objects;

    RAISE NOTICE '✅ Rollback de storage completado';
    RAISE NOTICE '   - Buckets restantes: %', remaining_buckets;
    RAISE NOTICE '   - Políticas de storage restantes: %', remaining_storage_policies;
    RAISE NOTICE '   - Objetos de storage restantes: %', remaining_objects;

    IF remaining_buckets = 0 AND remaining_storage_policies = 0 AND remaining_objects = 0 THEN
        RAISE NOTICE '🎉 Todo el storage ha sido limpiado exitosamente.';
    ELSE
        RAISE WARNING '⚠️  Aún quedan elementos de storage. Verifica manualmente si es necesario.';
    END IF;
END $$;
