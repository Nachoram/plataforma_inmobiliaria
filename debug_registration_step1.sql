-- =====================================================
-- PASO A: LIMPIEZA INICIAL - Depuración Avanzada
-- =====================================================
-- Ejecuta este script PRIMERO en tu SQL Editor de Supabase

-- 1. Eliminar trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar función existente
DROP FUNCTION IF EXISTS public.create_public_profile_for_new_user;

-- 3. Verificar que se eliminaron correctamente
SELECT
  'Trigger eliminado:' as status,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN '✅ OK' ELSE '❌ FALLÓ' END as trigger_status;

SELECT
  'Función eliminada:' as status,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_public_profile_for_new_user'
  ) THEN '✅ OK' ELSE '❌ FALLÓ' END as function_status;

-- =====================================================
-- RESULTADO ESPERADO:
-- Después de ejecutar esto, deberías ver:
-- status               | trigger_status
-- Trigger eliminado:   | ✅ OK
--
-- status               | function_status
-- Función eliminada:   | ✅ OK
-- =====================================================

