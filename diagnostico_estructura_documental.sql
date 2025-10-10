-- Diagnóstico para verificar la estructura documental antes de aplicar la sistematización
-- Ejecutar en el SQL Editor de Supabase

-- =====================================================
-- VERIFICACIÓN DE TABLAS EXISTENTES
-- =====================================================

-- Verificar tabla documents
SELECT
  'documents' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents')
  THEN '✅ Existe' ELSE '❌ FALTA' END as estado;

-- Verificar columnas de documents
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documents' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tabla applicants
SELECT
  'applicants' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applicants')
  THEN '✅ Existe' ELSE '❌ FALTA' END as estado;

-- Verificar tabla profiles (referenciada por documents.uploader_user_id)
SELECT
  'profiles' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
  THEN '✅ Existe' ELSE '❌ FALTA' END as estado;

-- =====================================================
-- VERIFICACIÓN DE COLUMNAS ESPECÍFICAS
-- =====================================================

-- Verificar si uploader_user_id existe en documents
SELECT
  'uploader_user_id en documents' as verificacion,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'uploader_user_id'
  ) THEN '✅ Existe' ELSE '❌ FALTA' END as estado;

-- Verificar si applicant_id existe en documents
SELECT
  'applicant_id en documents' as verificacion,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'applicant_id'
  ) THEN '✅ Existe' ELSE '❌ FALTA' END as estado;

-- Verificar si user_id existe en applicants
SELECT
  'user_id en applicants' as verificacion,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applicants' AND column_name = 'user_id'
  ) THEN '✅ Existe' ELSE '❌ FALTA' END as estado;

-- =====================================================
-- CONTADORES DE REGISTROS
-- =====================================================

-- Contar documentos existentes
SELECT 'Total documentos' as metrica, COUNT(*) as valor FROM documents;

-- Contar postulantes
SELECT 'Total postulantes' as metrica, COUNT(*) as valor FROM applicants;

-- Documentos por tipo actual
SELECT
  document_type,
  COUNT(*) as cantidad
FROM documents
GROUP BY document_type
ORDER BY cantidad DESC;

-- Documentos con applicant_id
SELECT
  'Documentos con applicant_id' as metrica,
  COUNT(*) as valor
FROM documents
WHERE applicant_id IS NOT NULL;

-- =====================================================
-- MUESTRA DE DATOS
-- =====================================================

-- Mostrar algunos documentos recientes
SELECT
  id,
  document_type,
  applicant_id,
  uploaded_at,
  LEFT(file_url, 50) || '...' as file_url_preview
FROM documents
ORDER BY uploaded_at DESC
LIMIT 5;

-- Mostrar algunos postulantes
SELECT
  id,
  full_name,
  rut,
  user_id
FROM applicants
LIMIT 5;
