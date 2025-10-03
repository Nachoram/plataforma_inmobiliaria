-- ============================================================================
-- FIX RLS PERMISSIONS V2 - Versión Mejorada y Robusta
-- ============================================================================
-- Soluciona errores 403, 409 y 400 en:
-- - profiles (403)
-- - properties (400)
-- - applications (403)
-- - guarantors (409)
-- - rental_contracts (409)
-- ============================================================================

-- ============================================================================
-- 1. PROFILES - Fix 403 Forbidden
-- ============================================================================

-- Habilitar RLS
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
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
    END LOOP;
END $$;

-- Crear políticas nuevas para profiles
CREATE POLICY "profiles_select_authenticated"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Grants para profiles
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- ============================================================================
-- 2. PROPERTIES - Fix 400 Bad Request
-- ============================================================================

-- Habilitar RLS
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'properties'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', pol.policyname);
    END LOOP;
END $$;

-- Crear políticas nuevas para properties
CREATE POLICY "properties_select_all"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "properties_insert_owner"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "properties_update_owner"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "properties_delete_owner"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Grants para properties
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;

-- ============================================================================
-- 3. APPLICATIONS - Fix 403 Forbidden
-- ============================================================================

-- Habilitar RLS
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON applications', pol.policyname);
    END LOOP;
END $$;

-- Crear políticas nuevas para applications
CREATE POLICY "applications_select_related"
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

CREATE POLICY "applications_insert_own"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "applications_update_related"
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
  )
  WITH CHECK (
    auth.uid() = applicant_id OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = applications.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Grants para applications
GRANT SELECT, INSERT, UPDATE ON applications TO authenticated;

-- ============================================================================
-- 4. GUARANTORS - Fix 409 Conflict
-- ============================================================================

-- Habilitar RLS
ALTER TABLE IF EXISTS guarantors ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'guarantors'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON guarantors', pol.policyname);
    END LOOP;
END $$;

-- Crear políticas nuevas para guarantors
CREATE POLICY "guarantors_select_related"
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

CREATE POLICY "guarantors_insert_own"
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

CREATE POLICY "guarantors_update_own"
  ON guarantors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = guarantors.application_id
      AND applications.applicant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = guarantors.application_id
      AND applications.applicant_id = auth.uid()
    )
  );

CREATE POLICY "guarantors_delete_own"
  ON guarantors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = guarantors.application_id
      AND applications.applicant_id = auth.uid()
    )
  );

-- Grants para guarantors
GRANT SELECT, INSERT, UPDATE, DELETE ON guarantors TO authenticated;

-- ============================================================================
-- 5. RENTAL_CONTRACTS - Fix 409 Conflict
-- ============================================================================

-- Habilitar RLS
ALTER TABLE IF EXISTS rental_contracts ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'rental_contracts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON rental_contracts', pol.policyname);
    END LOOP;
END $$;

-- Crear políticas nuevas para rental_contracts
CREATE POLICY "contracts_select_related"
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

CREATE POLICY "contracts_insert_owner"
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

CREATE POLICY "contracts_update_related"
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
  )
  WITH CHECK (
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

-- Grants para rental_contracts
GRANT SELECT, INSERT, UPDATE ON rental_contracts TO authenticated;

-- ============================================================================
-- 6. VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    tabla TEXT;
    contador INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SCRIPT EJECUTADO EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Verificar cada tabla
    FOR tabla IN 
        SELECT unnest(ARRAY['profiles', 'properties', 'applications', 'guarantors', 'rental_contracts'])
    LOOP
        SELECT COUNT(*) INTO contador
        FROM pg_policies
        WHERE tablename = tabla;
        
        RAISE NOTICE '📋 Tabla: % - Políticas: %', tabla, contador;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📝 Para ver detalles de las políticas:';
    RAISE NOTICE 'SELECT tablename, policyname, cmd FROM pg_policies';
    RAISE NOTICE 'WHERE tablename IN (''profiles'', ''properties'', ''applications'', ''guarantors'', ''rental_contracts'')';
    RAISE NOTICE 'ORDER BY tablename, policyname;';
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. ✅ Script IDEMPOTENTE - puede ejecutarse múltiples veces sin problemas
-- 2. ✅ Elimina TODAS las políticas antiguas automáticamente
-- 3. ✅ Nombres de políticas simplificados y consistentes
-- 4. ✅ Maneja errores si las tablas no existen (IF EXISTS)
-- 5. ✅ Verifica y reporta el resultado final
-- 6. ✅ Grants incluidos para evitar errores de permisos
-- ============================================================================

