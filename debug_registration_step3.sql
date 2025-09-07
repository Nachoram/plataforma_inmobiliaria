-- =====================================================
-- PASO C: DESACTIVAR RLS TEMPORALMENTE - Diagnóstico Crítico
-- =====================================================
-- Ejecuta este script en tu SQL Editor de Supabase

-- ⚠️ ATENCIÓN: Esto DESACTIVA la seguridad temporalmente solo para diagnóstico
-- NO dejes esto activado en producción

-- 1. Verificar estado actual de RLS
SELECT
  '🔒 Estado actual de RLS en profiles:' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. DESACTIVAR RLS temporalmente para el diagnóstico
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Confirmar que RLS está desactivado
SELECT
  '🔓 RLS desactivado:' as status,
  CASE
    WHEN rowsecurity = false THEN '✅ OK: RLS desactivado para diagnóstico'
    ELSE '❌ ERROR: RLS sigue activo'
  END as confirmation
FROM pg_tables
WHERE tablename = 'profiles';

-- =====================================================
-- SIGUIENTE PASO:
-- Después de ejecutar esto, ve a tu aplicación e intenta registrar un usuario
-- Si funciona, el problema es 100% RLS
-- Si sigue fallando, el problema está en otra parte
-- =====================================================

