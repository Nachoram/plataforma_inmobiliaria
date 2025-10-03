-- ============================================================================
-- DIAGNÓSTICO: Estructura de Tablas
-- ============================================================================
-- Este script muestra la estructura REAL de tus tablas
-- para poder crear políticas RLS correctas
-- ============================================================================

-- ============================================================================
-- 1. VER TODAS LAS TABLAS EN PUBLIC
-- ============================================================================
SELECT 
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. ESTRUCTURA DE PROFILES
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. ESTRUCTURA DE PROPERTIES
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. ESTRUCTURA DE APPLICATIONS
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'applications'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. ESTRUCTURA DE GUARANTORS ⚠️ IMPORTANTE
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'guarantors'
ORDER BY ordinal_position;

-- ============================================================================
-- 6. ESTRUCTURA DE RENTAL_CONTRACTS
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
ORDER BY ordinal_position;

-- ============================================================================
-- 7. VER FOREIGN KEYS (RELACIONES)
-- ============================================================================
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('guarantors', 'applications', 'rental_contracts', 'properties')
ORDER BY tc.table_name;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Copia los resultados (especialmente la sección 5 - GUARANTORS)
-- 3. Envíame los nombres de las columnas
-- 4. Con eso corregiré el script RLS
-- ============================================================================

