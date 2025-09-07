-- =====================================================
-- ROLLBACK: Revertir Cambios de Depuración
-- =====================================================
-- Ejecuta este script SOLO SI necesitas revertir los cambios

-- ⚠️ ATENCIÓN: Solo ejecuta si algo salió mal durante la depuración

-- 1. Eliminar trigger y función de prueba
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_public_profile_for_new_user();

-- 2. Reactivar RLS si estaba desactivado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Verificar estado final
SELECT
  '🔄 Estado después del rollback:' as status,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '❌ Trigger aún existe'
    ELSE '✅ Trigger eliminado'
  END as trigger_status,
  CASE
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') = true
    THEN '✅ RLS activado'
    ELSE '❌ RLS desactivado'
  END as rls_status;

-- =====================================================
-- DESPUÉS DEL ROLLBACK:
-- - El registro NO funcionará (trigger eliminado)
-- - Tendrás que aplicar la solución final correcta
-- - Revisa DEBUG_REGISTRATION_README.md para el proceso completo
-- =====================================================

