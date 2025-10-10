-- Script para arreglar documentos con uploader_user_id NULL
-- Ejecutar DESPUÉS de agregar la columna uploader_user_id

-- =====================================================
-- DIAGNÓSTICO DE DOCUMENTOS CON uploader_user_id NULL
-- =====================================================

SELECT
  'Documentos totales' as metrica,
  COUNT(*) as cantidad
FROM documents
UNION ALL
SELECT
  'Documentos con uploader_user_id NULL' as metrica,
  COUNT(*) as cantidad
FROM documents
WHERE uploader_user_id IS NULL
UNION ALL
SELECT
  'Documentos con applicant_id (posible fuente)' as metrica,
  COUNT(*) as cantidad
FROM documents
WHERE applicant_id IS NOT NULL;

-- Mostrar algunos documentos con uploader_user_id NULL
SELECT
  id,
  document_type,
  applicant_id,
  uploaded_at,
  LEFT(file_url, 50) || '...' as file_url_preview
FROM documents
WHERE uploader_user_id IS NULL
ORDER BY uploaded_at DESC
LIMIT 10;

-- =====================================================
-- SOLUCIONES PARA ASIGNAR uploader_user_id
-- =====================================================

-- Opción 1: Asignar uploader_user_id = applicant_id (si applicant_id existe)
-- Esto asume que el postulante subió sus propios documentos
UPDATE documents
SET uploader_user_id = applicant_id
WHERE uploader_user_id IS NULL
  AND applicant_id IS NOT NULL;

-- Verificar cuántos se actualizaron
SELECT
  'Documentos actualizados con applicant_id' as resultado,
  COUNT(*) as cantidad
FROM documents
WHERE uploader_user_id = applicant_id
  AND applicant_id IS NOT NULL;

-- =====================================================
-- Opción 2: PARA DOCUMENTOS QUE AÚN SON NULL
-- =====================================================

-- Si aún quedan documentos con uploader_user_id NULL,
-- puedes asignar un usuario por defecto (reemplaza 'user-id-aqui' con un ID real)

-- PRIMERO: Encuentra un usuario administrador o por defecto
-- SELECT id, email FROM profiles LIMIT 5;

-- LUEGO: Actualiza con ese ID (descomenta y reemplaza)
-- UPDATE documents
-- SET uploader_user_id = 'user-id-aqui'  -- ← REEMPLAZAR CON ID REAL
-- WHERE uploader_user_id IS NULL;

-- =====================================================
-- Opción 3: MARCAR COMO SISTEMA (si no hay usuario apropiado)
-- =====================================================

-- Si no hay usuario apropiado, puedes crear un usuario 'system'
-- o usar NULL temporalmente (no recomendado para producción)

-- =====================================================
-- HACER LA COLUMNA NOT NULL (DESPUÉS DE ASIGNAR VALORES)
-- =====================================================

-- Solo ejecutar esto DESPUÉS de que todos los documentos tengan uploader_user_id
DO $$
BEGIN
  -- Verificar que no hay NULLs antes de hacer NOT NULL
  IF NOT EXISTS (SELECT 1 FROM documents WHERE uploader_user_id IS NULL) THEN
    ALTER TABLE documents ALTER COLUMN uploader_user_id SET NOT NULL;
    RAISE NOTICE '✅ Columna uploader_user_id convertida a NOT NULL';
  ELSE
    RAISE NOTICE '⚠️ Aún hay documentos con uploader_user_id NULL - no se puede hacer NOT NULL';
    RAISE NOTICE '   Documentos restantes: %', (SELECT COUNT(*) FROM documents WHERE uploader_user_id IS NULL);
  END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT
  'Estado final de uploader_user_id' as verificacion,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM documents WHERE uploader_user_id IS NULL)
    THEN '✅ TODOS LOS DOCUMENTOS TIENEN uploader_user_id'
    ELSE '⚠️ AÚN QUEDAN DOCUMENTOS SIN uploader_user_id: ' || (SELECT COUNT(*) FROM documents WHERE uploader_user_id IS NULL)::text
  END as resultado;

-- Mostrar resumen
SELECT
  'Resumen final' as titulo,
  COUNT(*) as total_documentos,
  COUNT(CASE WHEN uploader_user_id IS NOT NULL THEN 1 END) as con_uploader_id,
  COUNT(CASE WHEN uploader_user_id IS NULL THEN 1 END) as sin_uploader_id,
  ROUND(
    COUNT(CASE WHEN uploader_user_id IS NOT NULL THEN 1 END)::numeric /
    COUNT(*)::numeric * 100, 1
  ) as porcentaje_completado
FROM documents;
