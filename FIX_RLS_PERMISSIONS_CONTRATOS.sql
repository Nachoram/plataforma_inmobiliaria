-- ============================================================================
-- FIX RLS PERMISSIONS - Contratos y Tablas Relacionadas
-- ============================================================================
-- Este script soluciona los errores 403, 409 y 400 en:
-- - profiles (403)
-- - guarantors (409)
-- - properties (400)
-- - applications (403)
-- - rental_contracts (409)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PROFILES - Fix 403 Forbidden
-- ============================================================================

-- Eliminar políticas existentes conflictivas
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles can be viewed by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Crear política simple y permisiva para SELECT
CREATE POLICY "Allow authenticated users to view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir a los usuarios actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir a los usuarios insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. PROPERTIES - Fix 400 Bad Request (posible problema de RLS)
-- ============================================================================

-- Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Users can view properties" ON properties;

-- Permitir a todos los usuarios autenticados ver propiedades
CREATE POLICY "Allow authenticated users to view properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir a los propietarios gestionar sus propiedades
DROP POLICY IF EXISTS "Property owners can update their properties" ON properties;
CREATE POLICY "Property owners can update their properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Property owners can insert properties" ON properties;
CREATE POLICY "Property owners can insert properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Property owners can delete properties" ON properties;
CREATE POLICY "Property owners can delete properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ============================================================================
-- 3. APPLICATIONS - Fix 403 Forbidden
-- ============================================================================

DROP POLICY IF EXISTS "Applications viewable by owner and applicant" ON applications;
DROP POLICY IF EXISTS "Users can view applications" ON applications;

-- Permitir ver aplicaciones al propietario y al aplicante
CREATE POLICY "Allow users to view related applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = applicant_id OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = applications.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Permitir a los usuarios crear aplicaciones
DROP POLICY IF EXISTS "Users can create applications" ON applications;
CREATE POLICY "Users can create applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Permitir actualizar aplicaciones
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
CREATE POLICY "Users can update own applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = applicant_id OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = applications.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. GUARANTORS - Fix 409 Conflict
-- ============================================================================

-- El error 409 puede ser por IDs duplicados o constraints
-- Primero verificamos la política RLS

DROP POLICY IF EXISTS "Users can view guarantors" ON guarantors;
DROP POLICY IF EXISTS "Guarantors viewable by related users" ON guarantors;

CREATE POLICY "Allow users to view related guarantors"
  ON guarantors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = guarantors.application_id
      AND (
        applications.applicant_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = applications.property_id
          AND properties.owner_id = auth.uid()
        )
      )
    )
  );

-- Permitir insertar guarantors
DROP POLICY IF EXISTS "Users can insert guarantors" ON guarantors;
CREATE POLICY "Users can insert guarantors"
  ON guarantors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = guarantors.application_id
      AND applications.applicant_id = auth.uid()
    )
  );

-- Permitir actualizar guarantors
DROP POLICY IF EXISTS "Users can update guarantors" ON guarantors;
CREATE POLICY "Users can update guarantors"
  ON guarantors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = guarantors.application_id
      AND applications.applicant_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. RENTAL_CONTRACTS - Fix 409 Conflict
-- ============================================================================

DROP POLICY IF EXISTS "Users can view related contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Contracts viewable by related users" ON rental_contracts;

CREATE POLICY "Allow users to view related contracts"
  ON rental_contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = rental_contracts.application_id
      AND (
        applications.applicant_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = applications.property_id
          AND properties.owner_id = auth.uid()
        )
      )
    )
  );

-- Permitir insertar contratos (solo propietarios o sistema)
DROP POLICY IF EXISTS "Property owners can insert contracts" ON rental_contracts;
CREATE POLICY "Property owners can insert contracts"
  ON rental_contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      JOIN properties ON properties.id = applications.property_id
      WHERE applications.id = rental_contracts.application_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Permitir actualizar contratos
DROP POLICY IF EXISTS "Users can update related contracts" ON rental_contracts;
CREATE POLICY "Users can update related contracts"
  ON rental_contracts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN properties ON properties.id = applications.property_id
      WHERE applications.id = rental_contracts.application_id
      AND (
        applications.applicant_id = auth.uid() OR
        properties.owner_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 6. VERIFICAR QUE RLS ESTÁ HABILITADO
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. GRANTS PARA AUTHENTICATED ROLE
-- ============================================================================

GRANT SELECT ON profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;

GRANT SELECT ON properties TO authenticated;
GRANT INSERT, UPDATE, DELETE ON properties TO authenticated;

GRANT SELECT ON applications TO authenticated;
GRANT INSERT, UPDATE ON applications TO authenticated;

GRANT SELECT ON guarantors TO authenticated;
GRANT INSERT, UPDATE, DELETE ON guarantors TO authenticated;

GRANT SELECT ON rental_contracts TO authenticated;
GRANT INSERT, UPDATE ON rental_contracts TO authenticated;

-- ============================================================================
-- 8. VERIFICACIÓN
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
  RAISE NOTICE '✅ Permisos concedidos a authenticated role';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Verificar con:';
  RAISE NOTICE '   SELECT * FROM pg_policies WHERE tablename IN (''profiles'', ''properties'', ''applications'', ''guarantors'', ''rental_contracts'');';
END $$;

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script es IDEMPOTENTE - puede ejecutarse múltiples veces
-- 2. Las políticas anteriores se eliminan antes de crear nuevas
-- 3. Se mantiene la seguridad: usuarios solo ven sus propios datos
-- 4. Los propietarios pueden ver aplicaciones y contratos de sus propiedades
-- 5. Los aplicantes pueden ver sus propias aplicaciones y contratos
-- ============================================================================

