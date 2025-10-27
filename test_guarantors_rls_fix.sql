-- ============================================================================
-- SCRIPT DE TEST: Verificar Políticas RLS de guarantors después de la migración
-- Ejecutar este script en Supabase SQL Editor para validar los cambios
-- ============================================================================

-- Test 1: Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'guarantors';
-- Resultado esperado: rowsecurity = true

-- Test 2: Listar todas las políticas de guarantors
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
-- Resultado esperado: 4 políticas listadas

-- Test 3: Verificar columna created_by existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'guarantors'
AND column_name = 'created_by';
-- Resultado esperado: 1 fila con tipo UUID

-- Test 4: Verificar índice created_by
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'guarantors'
AND indexname = 'idx_guarantors_created_by';
-- Resultado esperado: 1 fila con definición del índice

-- Test 5: Verificar estructura de la tabla guarantors
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'guarantors'
ORDER BY ordinal_position;
