-- ============================================================================
-- VERIFICACIÓN: Políticas RLS de guarantors después de aplicar la migración
-- Ejecutar en Supabase SQL Editor para confirmar que todo está correcto
-- ============================================================================

-- 1. Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'guarantors';

-- 2. Listar TODAS las políticas actuales de guarantors
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'guarantors'
ORDER BY policyname;

-- 3. Verificar columna created_by
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'guarantors'
AND column_name = 'created_by';

-- 4. Verificar índice created_by
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'guarantors'
AND indexname = 'idx_guarantors_created_by';

-- 5. Verificar registros existentes
SELECT
  COUNT(*) as total_guarantors,
  COUNT(created_by) as with_created_by,
  COUNT(*) FILTER (WHERE created_by IS NULL) as without_created_by
FROM guarantors;
