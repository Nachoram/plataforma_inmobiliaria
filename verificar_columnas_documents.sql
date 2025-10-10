-- Verificación específica de las columnas de la tabla documents
-- Ejecutar antes de aplicar la sistematización

-- =====================================================
-- VERIFICACIÓN DETALLADA DE TABLA DOCUMENTS
-- =====================================================

-- Verificar que la tabla existe
SELECT
  'documents table exists' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents')
  THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- Verificar columnas requeridas (deben existir de migraciones anteriores)
SELECT
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name = 'id' THEN '✅ requerida'
    WHEN column_name = 'uploader_user_id' THEN '✅ requerida'
    WHEN column_name = 'applicant_id' THEN '✅ requerida'
    WHEN column_name = 'document_type' THEN '✅ requerida'
    WHEN column_name = 'file_url' THEN '✅ requerida'
    WHEN column_name = 'uploaded_at' THEN '✅ requerida'
    WHEN column_name = 'applicant_document_type_code' THEN '🆕 nueva'
    WHEN column_name = 'processing_status' THEN '🆕 nueva'
    WHEN column_name = 'processing_attempts' THEN '🆕 nueva'
    WHEN column_name = 'last_processed_at' THEN '🆕 nueva'
    WHEN column_name = 'ocr_text' THEN '🆕 nueva'
    WHEN column_name = 'metadata' THEN '🆕 nueva'
    ELSE 'ℹ️ opcional'
  END as tipo,
  CASE
    WHEN column_name IN ('id', 'uploader_user_id', 'applicant_id', 'document_type', 'file_url', 'uploaded_at') AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'documents' AND column_name = column_name
    ) THEN '✅ OK'
    WHEN column_name NOT IN ('id', 'uploader_user_id', 'applicant_id', 'document_type', 'file_url', 'uploaded_at') THEN '➕ será agregada'
    ELSE '❌ FALTA (requerida)'
  END as estado
FROM (
  VALUES
    ('id'),
    ('uploader_user_id'),
    ('applicant_id'),
    ('document_type'),
    ('file_url'),
    ('uploaded_at'),
    ('applicant_document_type_code'),
    ('processing_status'),
    ('processing_attempts'),
    ('last_processed_at'),
    ('ocr_text'),
    ('metadata')
) AS cols(column_name)
LEFT JOIN information_schema.columns ic ON ic.table_name = 'documents'
  AND ic.column_name = cols.column_name
ORDER BY column_name;

-- Verificar restricciones de clave foránea
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'documents'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;

-- Contar documentos existentes
SELECT
  'Total documents' as metrica,
  COUNT(*) as valor
FROM documents;

-- Documentos por estado de procesamiento
SELECT
  COALESCE(processing_status, 'no_status') as estado,
  COUNT(*) as cantidad
FROM documents
GROUP BY processing_status
ORDER BY cantidad DESC;

-- Documentos con applicant_id
SELECT
  'Documentos con applicant_id' as metrica,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM documents), 0), 2) as porcentaje
FROM documents
WHERE applicant_id IS NOT NULL;
