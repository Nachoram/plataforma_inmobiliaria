-- =====================================================
-- PASO E/F: SOLUCIÓN FINAL - Si el registro FUNCIONÓ
-- =====================================================
-- Ejecuta este script SOLO SI el registro funcionó después de desactivar RLS

-- 🎉 ¡DIAGNÓSTICO CONFIRMADO: El problema era RLS!

-- 1. Reactivar la seguridad
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Crear la política correcta para el trigger
-- Esta política permite que el trigger inserte perfiles automáticamente
CREATE POLICY "Allow trigger to create user profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Políticas adicionales para que los usuarios manejen su perfil
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. Verificar que las políticas están activas
SELECT
  '📋 Políticas de RLS activas:' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'profiles';

SELECT
  '🔍 Detalle de políticas:' as status,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- =====================================================
-- VERIFICACIÓN FINAL:
-- 1. Ejecuta este script
-- 2. Ve a tu aplicación
-- 3. Intenta registrar un usuario nuevo
-- 4. Debería funcionar correctamente
-- 5. Si funciona, ¡problema RESUELTO! 🎉
-- =====================================================

