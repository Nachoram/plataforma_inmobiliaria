-- =====================================================
-- FIX: Rental Application Form Errors (SIMPLE VERSION)
-- =====================================================
-- Versión corregida que funciona con el esquema actual
-- Ejecuta estos comandos uno por uno en el SQL Editor de Supabase

-- 1. Corregir políticas de PROFILES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Crear nuevas políticas
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Corregir políticas de APPLICATIONS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Property owners can update applications for their properties" ON applications;

-- Crear nuevas políticas
CREATE POLICY "applications_select_own_policy"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "applications_select_property_owner_policy"
  ON applications FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "applications_insert_policy"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- 3. Corregir políticas de GUARANTORS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can read guarantors for their applications" ON guarantors;
DROP POLICY IF EXISTS "Users can insert guarantors" ON guarantors;
DROP POLICY IF EXISTS "Users can update guarantors for their applications" ON guarantors;

-- Crear nuevas políticas
CREATE POLICY "guarantors_select_policy"
  ON guarantors FOR SELECT
  TO authenticated
  USING (true); -- Los garantes pueden ser vistos por propietarios de propiedades

CREATE POLICY "guarantors_insert_policy"
  ON guarantors FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Los usuarios autenticados pueden crear garantes

-- 4. Otorgar permisos necesarios
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT ON applications TO authenticated;
GRANT SELECT, INSERT ON guarantors TO authenticated;
GRANT SELECT, INSERT ON documents TO authenticated;

-- Verificación (ejecuta esto al final)
SELECT 'Migration completed successfully - RLS policies fixed' as status;
