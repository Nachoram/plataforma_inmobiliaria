-- Migración para agregar campo metadata a workflow_outputs
-- Fecha: 2025-10-03 17:00:00
-- Versión: v2.1.0
-- Descripción: Agrega campo metadata JSONB para almacenar información adicional de contratos recibidos via webhook

-- ===== AGREGAR CAMPO METADATA =====

-- 1. Agregar columna metadata de tipo JSONB
ALTER TABLE public.workflow_outputs
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Agregar comentario al campo metadata
COMMENT ON COLUMN public.workflow_outputs.metadata IS 'Metadatos adicionales del workflow (contract_id, application_id, source, etc.)';

-- ===== ACTUALIZAR ÍNDICES =====

-- 3. Crear índice para consultas por metadata (si es necesario)
CREATE INDEX IF NOT EXISTS idx_workflow_outputs_metadata_source
ON public.workflow_outputs USING gin ((metadata->>'source'));

-- ===== VERIFICACIÓN =====

-- 4. Verificación de la migración
DO $$
DECLARE
    metadata_column_exists boolean;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO MIGRACIÓN DEL CAMPO METADATA...';

    -- Verificar que la columna metadata existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'workflow_outputs'
        AND column_name = 'metadata'
    ) INTO metadata_column_exists;

    IF metadata_column_exists THEN
        RAISE NOTICE '✅ Columna metadata agregada correctamente a workflow_outputs';
    ELSE
        RAISE EXCEPTION '❌ Error: Columna metadata no fue agregada';
    END IF;

    RAISE NOTICE '🎉 MIGRACIÓN DEL CAMPO METADATA COMPLETADA EXITOSAMENTE';

END $$;

-- ===== MIGRACIÓN COMPLETADA =====

-- ✅ La migración del campo metadata ha sido completada exitosamente
-- Campo agregado: metadata (jsonb)
-- Índice agregado: idx_workflow_outputs_metadata_source
