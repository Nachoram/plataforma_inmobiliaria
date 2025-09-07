-- =====================================================
-- PASO D: RECREAR TRIGGER MINIMALISTA - Prueba Final
-- =====================================================
-- Ejecuta este script DESPUÉS de desactivar RLS

-- 1. Crear la función ultra-simple (solo campos garantizados)
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_public_profile_for_new_user();

-- 3. Verificar que todo está creado correctamente
SELECT
  '🔧 Función creada:' as status,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_public_profile_for_new_user')
    THEN '✅ OK'
    ELSE '❌ ERROR'
  END as function_status;

SELECT
  '🎯 Trigger creado:' as status,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✅ OK'
    ELSE '❌ ERROR'
  END as trigger_status;

-- =====================================================
-- PRUEBA CRÍTICA:
-- 1. Ejecuta este script
-- 2. Ve a tu aplicación
-- 3. Intenta registrar un usuario nuevo
-- 4. Si funciona → Problema era RLS (continúa al Paso E)
-- 5. Si falla → Problema es otra cosa (revisa logs de Supabase)
-- =====================================================

