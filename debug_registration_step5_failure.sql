-- =====================================================
-- PASO E/F: DIAGNÓSTICO AVANZADO - Si el registro SIGUE FALLANDO
-- =====================================================
-- Ejecuta este script SOLO SI el registro sigue fallando con RLS desactivado

-- 🔍 El problema NO es RLS, vamos a investigar más profundo

-- 1. Verificar logs de la base de datos
SELECT
  '📊 Logs recientes de la base de datos:' as status,
  query,
  error_message,
  created_at
FROM postgres_log
WHERE created_at > NOW() - INTERVAL '5 minutes'
  AND error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar restricciones de la tabla profiles
SELECT
  '🔒 Restricciones de la tabla profiles:' as status,
  conname as constraint_name,
  contype as constraint_type,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 3. Verificar índices únicos que puedan estar causando conflictos
SELECT
  '🔑 Índices únicos en profiles:' as status,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexdef LIKE '%UNIQUE%';

-- 4. Verificar estructura completa de la tabla
SELECT
  '📋 Estructura de la tabla profiles:' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- ANÁLISIS DE RESULTADOS:
-- 1. Revisa los logs por mensajes de error específicos
-- 2. Busca restricciones UNIQUE que puedan estar fallando
-- 3. Verifica que la estructura de la tabla sea correcta
--
-- POSIBLES CAUSAS SI SIGUE FALLANDO:
-- - Violación de restricción UNIQUE en email o rut
-- - Problema con el tipo de dato de alguna columna
-- - Trigger conflictuando con alguna regla de integridad
-- =====================================================

-- 5. Si encuentras un conflicto de email, limpia datos huérfanos:
-- DELETE FROM public.profiles WHERE email = 'tu-email-problematico@gmail.com';

-- 6. Verificar que auth.users esté funcionando correctamente:
-- SELECT COUNT(*) as total_users FROM auth.users;

