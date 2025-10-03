-- ============================================================================
-- TEST RLS SIMPLE - Prueba solo con PROFILES primero
-- ============================================================================
-- Ejecuta esto primero para verificar que funciona antes del script completo
-- ============================================================================

-- Ver políticas actuales
SELECT 
  tablename,
  policyname,
  cmd as operacion,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Ver si RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'profiles';

-- ============================================================================
-- AHORA SÍ, APLICAR FIX PARA PROFILES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas de profiles (con nombres dinámicos)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
        RAISE NOTICE 'Eliminada política: %', pol.policyname;
    END LOOP;
END $$;

-- Crear nueva política simple
CREATE POLICY "profiles_view_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant necesario
GRANT SELECT ON profiles TO authenticated;

-- Verificar resultado
SELECT 
  policyname,
  cmd as operacion,
  CASE 
    WHEN qual IS NOT NULL THEN 'Con restricción'
    ELSE 'Sin restricción'
  END as tipo
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================================================
-- Si esto funciona ✅, entonces ejecuta FIX_RLS_PERMISSIONS_CONTRATOS_V2.sql
-- ============================================================================

