-- Migración para sistema de generación y almacenamiento de informes HTML
-- Fecha: 2025-10-03 15:00:00
-- Versión: v2.0.0
-- Descripción: Agrega tabla workflow_outputs, bucket storage privado y políticas RLS

-- ===== CREACIÓN DE TABLA PRINCIPAL =====

-- 1. Crear la tabla para registrar metadatos de los informes generados.
CREATE TABLE IF NOT EXISTS public.workflow_outputs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
    workflow_type text NOT NULL,
    output_storage_path text NOT NULL UNIQUE,
    file_size_bytes bigint,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Agregar comentario a la tabla
COMMENT ON TABLE public.workflow_outputs IS 'Tabla para almacenar metadatos de informes HTML generados por workflows';

-- 3. Agregar comentarios a las columnas
COMMENT ON COLUMN public.workflow_outputs.user_id IS 'Usuario que generó el informe';
COMMENT ON COLUMN public.workflow_outputs.property_id IS 'Propiedad relacionada (opcional)';
COMMENT ON COLUMN public.workflow_outputs.workflow_type IS 'Tipo de workflow/informe generado';
COMMENT ON COLUMN public.workflow_outputs.output_storage_path IS 'Ruta del archivo en Storage';
COMMENT ON COLUMN public.workflow_outputs.file_size_bytes IS 'Tamaño del archivo en bytes';

-- ===== ROW LEVEL SECURITY =====

-- 4. Activar Row Level Security (RLS) en la nueva tabla.
ALTER TABLE public.workflow_outputs ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS: los usuarios solo pueden acceder a sus propios informes.
CREATE POLICY "workflow_outputs_select_policy"
ON public.workflow_outputs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "workflow_outputs_insert_policy"
ON public.workflow_outputs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ===== STORAGE BUCKET =====

-- 6. Crear el bucket PRIVADO 'workflow-outputs' en Storage.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('workflow-outputs', 'workflow-outputs', false, 5242880, ARRAY['text/html'])
ON CONFLICT (id) DO NOTHING;

-- 7. Crear políticas de Storage: los usuarios solo pueden gestionar sus propios archivos.
CREATE POLICY "workflow_outputs_storage_select_policy"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'workflow-outputs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "workflow_outputs_storage_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'workflow-outputs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ===== ÍNDICES PARA OPTIMIZACIÓN =====

-- 8. Crear índices para optimizar las consultas.
CREATE INDEX IF NOT EXISTS idx_workflow_outputs_user_id
ON public.workflow_outputs(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_outputs_created_at
ON public.workflow_outputs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_outputs_workflow_type
ON public.workflow_outputs(workflow_type);

CREATE INDEX IF NOT EXISTS idx_workflow_outputs_property_id
ON public.workflow_outputs(property_id) WHERE property_id IS NOT NULL;

-- ===== VERIFICACIÓN =====

-- 9. Verificación de la migración
DO $$
DECLARE
    table_exists boolean;
    rls_enabled boolean;
    bucket_exists boolean;
    policies_count integer;
    indexes_count integer;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO MIGRACIÓN DEL SISTEMA DE INFORMES...';

    -- Verificar tabla
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'workflow_outputs'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE '✅ Tabla workflow_outputs creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Tabla workflow_outputs no fue creada';
    END IF;

    -- Verificar RLS
    SELECT rowsecurity FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'workflow_outputs'
    INTO rls_enabled;

    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS habilitado en workflow_outputs';
    ELSE
        RAISE EXCEPTION '❌ Error: RLS no está habilitado en workflow_outputs';
    END IF;

    -- Verificar políticas RLS
    SELECT COUNT(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workflow_outputs'
    INTO policies_count;

    IF policies_count >= 2 THEN
        RAISE NOTICE '✅ Políticas RLS creadas (% políticas)', policies_count;
    ELSE
        RAISE EXCEPTION '❌ Error: Políticas RLS insuficientes (% políticas)', policies_count;
    END IF;

    -- Verificar bucket de storage
    SELECT EXISTS(
        SELECT 1 FROM storage.buckets WHERE id = 'workflow-outputs'
    ) INTO bucket_exists;

    IF bucket_exists THEN
        RAISE NOTICE '✅ Bucket workflow-outputs creado en Storage';
    ELSE
        RAISE EXCEPTION '❌ Error: Bucket workflow-outputs no fue creado';
    END IF;

    -- Verificar índices
    SELECT COUNT(*) FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'workflow_outputs'
    INTO indexes_count;

    IF indexes_count >= 2 THEN
        RAISE NOTICE '✅ Índices creados (% índices)', indexes_count;
    ELSE
        RAISE WARNING '⚠️  Advertencia: Pocos índices creados (% índices)', indexes_count;
    END IF;

    RAISE NOTICE '🎉 MIGRACIÓN DEL SISTEMA DE INFORMES COMPLETADA EXITOSAMENTE';

END $$;

-- ===== MIGRACIÓN COMPLETADA =====

-- ✅ La migración del sistema de informes HTML ha sido completada exitosamente
-- Tablas creadas: workflow_outputs
-- Buckets creados: workflow-outputs
-- Políticas RLS: 4 políticas implementadas
-- Índices: 4 índices optimizados
