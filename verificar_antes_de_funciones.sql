-- Verificación antes de crear funciones - Ejecutar ANTES del PASO 6
-- Este script verifica que todas las columnas requeridas existan

SELECT '=== VERIFICACIÓN PREVIA A FUNCIONES ===' as titulo;

-- Verificar tablas requeridas
SELECT
  'Tabla documents existe' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents')
  THEN '✅ OK' ELSE '❌ FALTA' END as status
UNION ALL
SELECT
  'Tabla applicants existe' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applicants')
  THEN '✅ OK' ELSE '❌ FALTA' END as status
UNION ALL
SELECT
  'Tabla applicant_document_types existe' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applicant_document_types')
  THEN '✅ OK' ELSE '❌ FALTA' END as status
UNION ALL
SELECT
  'Tabla applicant_document_content existe' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applicant_document_content')
  THEN '✅ OK' ELSE '❌ FALTA' END as status;

-- Verificar columnas críticas en documents
SELECT
  'Columna applicant_id en documents' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_id')
  THEN '✅ OK' ELSE '❌ FALTA - EJECUTE PASO 3' END as status
UNION ALL
SELECT
  'Columna uploader_user_id en documents' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploader_user_id')
  THEN '✅ OK' ELSE '❌ FALTA - EJECUTE PASO 3' END as status
UNION ALL
SELECT
  'Columna processing_status en documents' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_status')
  THEN '✅ OK' ELSE '❌ FALTA - EJECUTE PASO 3' END as status
UNION ALL
SELECT
  'Columna applicant_document_type_code en documents' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_document_type_code')
  THEN '✅ OK' ELSE '❌ FALTA - EJECUTE PASO 3' END as status;

-- Verificar tipos de documentos
SELECT
  'Tipos de documentos creados' as check_name,
  CASE WHEN (SELECT COUNT(*) FROM applicant_document_types) > 0
  THEN '✅ ' || (SELECT COUNT(*)::text FROM applicant_document_types) || ' tipos'
  ELSE '❌ NINGUNO - EJECUTE PASO 1' END as status;

-- Si todo está OK, mostrar mensaje de confirmación
SELECT
  CASE
    WHEN (
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') AND
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_id') AND
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploader_user_id') AND
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_status') AND
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applicant_document_types') AND
      (SELECT COUNT(*) FROM applicant_document_types) > 0
    ) THEN '🎉 TODO LISTO - Puede proceder con el PASO 6 (funciones)'
    ELSE '⚠️  FALTAN PRERREQUISITOS - Revise los errores arriba'
  END as resultado_final;
