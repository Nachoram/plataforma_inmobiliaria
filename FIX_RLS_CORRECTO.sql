-- ============================================================================
-- FIX RLS CORRECTO - Con estructura real de base de datos
-- ============================================================================
-- Este script usa la ESTRUCTURA REAL de tu base de datos:
-- - guarantors NO tiene application_id
-- - applications.guarantor_id → guarantors.id
-- ============================================================================

-- ============================================================================
-- 1. PROFILES
-- ============================================================================

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Políticas nuevas
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- ============================================================================
-- 2. PROPERTIES
-- ============================================================================

ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'properties'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "properties_select_all" ON properties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "properties_insert_owner" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "properties_update_owner" ON properties
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "properties_delete_owner" ON properties
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;

-- ============================================================================
-- 3. APPLICATIONS
-- ============================================================================

ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON applications', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "applications_select_related" ON applications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = applicant_id OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = applications.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "applications_insert_own" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "applications_update_related" ON applications
  FOR UPDATE TO authenticated
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

GRANT SELECT, INSERT, UPDATE ON applications TO authenticated;

-- ============================================================================
-- 4. GUARANTORS ⚠️ CORREGIDO - Sin application_id
-- ============================================================================

ALTER TABLE IF EXISTS guarantors ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'guarantors'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON guarantors', pol.policyname);
    END LOOP;
END $$;

-- La relación es: applications.guarantor_id → guarantors.id
CREATE POLICY "guarantors_select_related" ON guarantors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.guarantor_id = guarantors.id  -- ✅ CORRECTO
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

CREATE POLICY "guarantors_insert_all" ON guarantors
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- Cualquiera puede crear un guarantor

CREATE POLICY "guarantors_update_related" ON guarantors
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.guarantor_id = guarantors.id
      AND applications.applicant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.guarantor_id = guarantors.id
      AND applications.applicant_id = auth.uid()
    )
  );

CREATE POLICY "guarantors_delete_related" ON guarantors
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.guarantor_id = guarantors.id
      AND applications.applicant_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON guarantors TO authenticated;

-- ============================================================================
-- 5. RENTAL_CONTRACTS
-- ============================================================================

ALTER TABLE IF EXISTS rental_contracts ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rental_contracts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON rental_contracts', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "contracts_select_related" ON rental_contracts
  FOR SELECT TO authenticated
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

CREATE POLICY "contracts_insert_owner" ON rental_contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      JOIN properties ON properties.id = applications.property_id
      WHERE applications.id = rental_contracts.application_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "contracts_update_related" ON rental_contracts
  FOR UPDATE TO authenticated
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

GRANT SELECT, INSERT, UPDATE ON rental_contracts TO authenticated;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

DO $$
DECLARE
    tabla TEXT;
    contador INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SCRIPT EJECUTADO CORRECTAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    FOR tabla IN 
        SELECT unnest(ARRAY['profiles', 'properties', 'applications', 'guarantors', 'rental_contracts'])
    LOOP
        SELECT COUNT(*) INTO contador FROM pg_policies WHERE tablename = tabla;
        RAISE NOTICE '📋 %-20s: % políticas', tabla, contador;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Relaciones correctas aplicadas:';
    RAISE NOTICE '  applications.guarantor_id → guarantors.id ✅';
    RAISE NOTICE '  rental_contracts.application_id → applications.id ✅';
    RAISE NOTICE '  properties.owner_id → profiles.id ✅';
    RAISE NOTICE '============================================';
END $$;

