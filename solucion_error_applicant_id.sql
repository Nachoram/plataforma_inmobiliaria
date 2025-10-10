-- SOLUCIÓN PARA ERROR: column d.applicant_id does not exist
-- Ejecutar este script PASO A PASO en el SQL Editor de Supabase

-- =====================================================
-- DIAGNÓSTICO DEL PROBLEMA
-- =====================================================

SELECT '🔍 DIAGNÓSTICO DEL ERROR applicant_id' as titulo;

-- Verificar si la columna existe
SELECT
  '¿Existe applicant_id en documents?' as pregunta,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_id')
  THEN '✅ SÍ - La columna existe'
  ELSE '❌ NO - La columna FALTA, ejecute el PASO 2 abajo' END as respuesta;

-- =====================================================
-- PASO 1: VERIFICACIÓN COMPLETA
-- =====================================================

-- Ejecutar el script de diagnóstico completo
-- (Copiar y pegar el contenido de verificar_columnas_documents.sql)

-- =====================================================
-- PASO 2: AGREGAR COLUMNAS FALTANTES (SOLUCIÓN)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔧 Agregando columnas faltantes a la tabla documents...';

  -- Verificar y agregar columnas BÁSICAS que deberían existir (de migraciones anteriores)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'document_type') THEN
    ALTER TABLE documents ADD COLUMN document_type text NOT NULL DEFAULT 'general';
    RAISE NOTICE '✅ Columna document_type agregada (requerida)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_url') THEN
    ALTER TABLE documents ADD COLUMN file_url text NOT NULL DEFAULT '';
    RAISE NOTICE '✅ Columna file_url agregada (requerida)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_at') THEN
    ALTER TABLE documents ADD COLUMN uploaded_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Columna uploaded_at agregada (requerida)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'storage_path') THEN
    ALTER TABLE documents ADD COLUMN storage_path text;
    RAISE NOTICE '✅ Columna storage_path agregada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_size_bytes') THEN
    ALTER TABLE documents ADD COLUMN file_size_bytes integer DEFAULT 0;
    RAISE NOTICE '✅ Columna file_size_bytes agregada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'mime_type') THEN
    ALTER TABLE documents ADD COLUMN mime_type text;
    RAISE NOTICE '✅ Columna mime_type agregada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'property_id') THEN
    ALTER TABLE documents ADD COLUMN property_id uuid REFERENCES properties(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Columna property_id agregada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'guarantor_id') THEN
    ALTER TABLE documents ADD COLUMN guarantor_id uuid REFERENCES guarantors(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Columna guarantor_id agregada';
  END IF;

  -- Agregar application_id si no existe (debería existir de migraciones anteriores)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'application_id') THEN
    ALTER TABLE documents ADD COLUMN application_id uuid REFERENCES applications(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Columna application_id agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna application_id ya existe';
  END IF;

  -- Agregar applicant_id si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_id') THEN
    ALTER TABLE documents ADD COLUMN applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Columna applicant_id agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna applicant_id ya existe';
  END IF;

  -- Agregar uploader_user_id si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploader_user_id') THEN
    -- Agregar sin NOT NULL primero para evitar error con registros existentes
    ALTER TABLE documents ADD COLUMN uploader_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Columna uploader_user_id agregada (sin restricción NOT NULL por ahora)';

    -- Intentar llenar con valores existentes de applicant_id (si existe y es válido)
    -- Si no hay applicant_id, usar un valor por defecto o NULL
    UPDATE documents SET uploader_user_id = applicant_id WHERE uploader_user_id IS NULL AND applicant_id IS NOT NULL;

    -- Verificar cuántos documentos tienen uploader_user_id NULL
    -- y dar recomendaciones para actualizarlos

    -- Hacer la columna NOT NULL si todos los valores están llenos
    -- Si no, dejar como nullable y dar instrucciones para actualizar manualmente

    -- Contar documentos con uploader_user_id NULL
    IF EXISTS (SELECT 1 FROM documents WHERE uploader_user_id IS NULL LIMIT 1) THEN
      RAISE NOTICE '⚠️ ADVERTENCIA: Algunos documentos tienen uploader_user_id NULL';
      RAISE NOTICE '   Para hacer la columna NOT NULL, ejecuta manualmente:';
      RAISE NOTICE '   UPDATE documents SET uploader_user_id = ''usuario-por-defecto-id'' WHERE uploader_user_id IS NULL;';
      RAISE NOTICE '   ALTER TABLE documents ALTER COLUMN uploader_user_id SET NOT NULL;';
    ELSE
      -- Si todos tienen valores, hacer NOT NULL
      ALTER TABLE documents ALTER COLUMN uploader_user_id SET NOT NULL;
      RAISE NOTICE '✅ Columna uploader_user_id convertida a NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Columna uploader_user_id ya existe';
  END IF;

  -- Agregar applicant_document_type_code si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_document_type_code') THEN
    ALTER TABLE documents ADD COLUMN applicant_document_type_code text REFERENCES applicant_document_types(code);
    RAISE NOTICE '✅ Columna applicant_document_type_code agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna applicant_document_type_code ya existe';
  END IF;

  -- Agregar processing_status si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_status') THEN
    ALTER TABLE documents ADD COLUMN processing_status text DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed'));
    RAISE NOTICE '✅ Columna processing_status agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna processing_status ya existe';
  END IF;

  -- Agregar processing_attempts si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_attempts') THEN
    ALTER TABLE documents ADD COLUMN processing_attempts integer DEFAULT 0;
    RAISE NOTICE '✅ Columna processing_attempts agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna processing_attempts ya existe';
  END IF;

  -- Agregar last_processed_at si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'last_processed_at') THEN
    ALTER TABLE documents ADD COLUMN last_processed_at timestamptz;
    RAISE NOTICE '✅ Columna last_processed_at agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna last_processed_at ya existe';
  END IF;

  -- Agregar ocr_text si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'ocr_text') THEN
    ALTER TABLE documents ADD COLUMN ocr_text text;
    RAISE NOTICE '✅ Columna ocr_text agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna ocr_text ya existe';
  END IF;

  -- Agregar metadata si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'metadata') THEN
    ALTER TABLE documents ADD COLUMN metadata jsonb DEFAULT '{}';
    RAISE NOTICE '✅ Columna metadata agregada correctamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna metadata ya existe';
  END IF;

  RAISE NOTICE '✅ Todas las columnas han sido verificadas/agregadas';
END $$;

-- =====================================================
-- PASO 3: VERIFICAR QUE SE AGREGARON
-- =====================================================

SELECT '📋 VERIFICACIÓN DE COLUMNAS AGREGADAS' as titulo;

SELECT
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name IN ('application_id', 'applicant_id', 'uploader_user_id') THEN 'requerida'
    WHEN column_name = 'processing_status' THEN 'nueva-sistema'
    ELSE 'nueva-opcional'
  END as categoria
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('application_id', 'applicant_id', 'uploader_user_id', 'applicant_document_type_code', 'processing_status', 'processing_attempts', 'last_processed_at', 'ocr_text', 'metadata')
ORDER BY column_name;

-- =====================================================
-- PASO 4: AGREGAR ÍNDICES PARA LAS NUEVAS COLUMNAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant_id ON documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_user_id ON documents(uploader_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant_type ON documents(applicant_document_type_code);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_last_processed ON documents(last_processed_at);

SELECT '✅ Índices creados para optimización' as confirmacion;

-- =====================================================
-- PASO 5: VERIFICACIÓN FINAL
-- =====================================================

-- Ahora ejecutar la verificación antes de funciones
-- (Copiar y pegar el contenido de verificar_antes_de_funciones.sql)

-- =====================================================
-- PASO 6: PROCEDER CON LAS FUNCIONES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 Si la verificación anterior muestra TODO LISTO, puede proceder con el PASO 6 del archivo sistema_documental_paso_a_paso.sql';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximos pasos:';
  RAISE NOTICE '   1. Ejecutar el PASO 6 (funciones) del archivo sistema_documental_paso_a_paso.sql';
  RAISE NOTICE '   2. Si hay errores, verificar que las tablas applicant_document_types y applicant_document_content existan';
  RAISE NOTICE '   3. Continuar con los pasos 7, 8, 9';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ¡El error applicant_id debería estar resuelto!';
END $$;
