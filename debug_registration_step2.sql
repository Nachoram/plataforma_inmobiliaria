-- =====================================================
-- PASO B: BUSCAR DATOS HUÉRFANOS - Depuración Avanzada
-- =====================================================
-- Ejecuta este script en tu SQL Editor de Supabase

-- ⚠️ IMPORTANTE: Reemplaza 'tu-email-de-prueba@gmail.com' con el email real que estás usando

-- 1. Buscar si el email ya existe en profiles (esto causaría conflicto UNIQUE)
SELECT
  '🔍 Buscando email en profiles...' as status,
  COUNT(*) as registros_encontrados,
  CASE
    WHEN COUNT(*) > 0 THEN '❌ PROBLEMA: Email ya existe en profiles!'
    WHEN COUNT(*) = 0 THEN '✅ OK: Email no existe en profiles'
  END as diagnostico
FROM public.profiles
WHERE email = 'tu-email-de-prueba@gmail.com';

-- 2. Ver qué registros hay en profiles
SELECT
  '📊 Registros totales en profiles:' as info,
  COUNT(*) as total_profiles
FROM public.profiles;

-- 3. Verificar si hay registros sin usuario correspondiente en auth.users
SELECT
  '🔗 Registros huérfanos en profiles:' as info,
  COUNT(p.*) as perfiles_huerfanos
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 4. Si encuentras registros huérfanos, elimínalos con:
-- DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- =====================================================
-- INSTRUCCIONES PARA USUARIO:
-- 1. Reemplaza 'tu-email-de-prueba@gmail.com' con tu email real
-- 2. Ejecuta la consulta
-- 3. Si ves "❌ PROBLEMA: Email ya existe en profiles!", ejecuta:
--    DELETE FROM public.profiles WHERE email = 'tu-email-de-prueba@gmail.com';
-- =====================================================

