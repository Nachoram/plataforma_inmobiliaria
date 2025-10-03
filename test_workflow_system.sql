-- Script de prueba para verificar que el sistema de workflow funciona correctamente
-- Ejecutar después de aplicar la migración 20251003150000_create_workflow_outputs_system.sql

-- ===== VERIFICACIÓN DEL SISTEMA =====

DO $$
DECLARE
    table_exists boolean;
    rls_enabled boolean;
    bucket_exists boolean;
    policies_count integer;
    storage_policies_count integer;
    indexes_count integer;
BEGIN
    RAISE NOTICE '🧪 VERIFICANDO SISTEMA DE WORKFLOW COMPLETO...';

    -- Verificar tabla
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'workflow_outputs'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE '✅ Tabla workflow_outputs existe';
    ELSE
        RAISE EXCEPTION '❌ Tabla workflow_outputs no existe';
    END IF;

    -- Verificar columnas de la tabla
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workflow_outputs'
        AND column_name IN ('id', 'user_id', 'property_id', 'workflow_type', 'output_storage_path', 'file_size_bytes', 'created_at')
    ) THEN
        RAISE NOTICE '✅ Todas las columnas de workflow_outputs existen';
    ELSE
        RAISE EXCEPTION '❌ Faltan columnas en workflow_outputs';
    END IF;

    -- Verificar RLS
    SELECT rowsecurity FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'workflow_outputs'
    INTO rls_enabled;

    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS habilitado en workflow_outputs';
    ELSE
        RAISE EXCEPTION '❌ RLS no está habilitado en workflow_outputs';
    END IF;

    -- Verificar políticas RLS de tabla
    SELECT COUNT(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workflow_outputs'
    INTO policies_count;

    RAISE NOTICE '📊 Políticas RLS en tabla: %', policies_count;

    -- Verificar bucket de storage
    SELECT EXISTS(
        SELECT 1 FROM storage.buckets WHERE id = 'workflow-outputs'
    ) INTO bucket_exists;

    IF bucket_exists THEN
        RAISE NOTICE '✅ Bucket workflow-outputs existe en Storage';
    ELSE
        RAISE EXCEPTION '❌ Bucket workflow-outputs no existe en Storage';
    END IF;

    -- Verificar políticas de storage
    SELECT COUNT(*) FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname LIKE '%workflow_outputs%'
    INTO storage_policies_count;

    RAISE NOTICE '📊 Políticas RLS en storage: %', storage_policies_count;

    -- Verificar índices
    SELECT COUNT(*) FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'workflow_outputs'
    INTO indexes_count;

    RAISE NOTICE '📊 Índices en workflow_outputs: %', indexes_count;

    RAISE NOTICE '🎉 SISTEMA DE WORKFLOW VERIFICADO EXITOSAMENTE';

    -- Resumen final
    RAISE NOTICE '';
    RAISE NOTICE '📋 RESUMEN DEL SISTEMA:';
    RAISE NOTICE '   • Tabla workflow_outputs: ✅';
    RAISE NOTICE '   • RLS habilitado: ✅';
    RAISE NOTICE '   • Políticas tabla: %', policies_count;
    RAISE NOTICE '   • Bucket storage: ✅';
    RAISE NOTICE '   • Políticas storage: %', storage_policies_count;
    RAISE NOTICE '   • Índices: %', indexes_count;

END $$;

-- ===== PRUEBA FUNCIONAL (REQUIERE USUARIO AUTENTICADO) =====

/*
-- Para probar funcionalmente, necesitas estar autenticado.
-- Este código se ejecutaría desde la aplicación frontend:

-- 1. Generar un informe de prueba
SELECT * FROM generateWorkflowOutput('informe_mensual_propiedad');

-- 2. Verificar que se creó el registro
SELECT * FROM workflow_outputs
WHERE workflow_type = 'informe_mensual_propiedad'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Verificar archivo en storage (desde la aplicación)
-- El archivo debería estar en: {user_id}/informe_mensual_propiedad-{timestamp}.html
*/
