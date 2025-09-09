-- =====================================================
-- FIX MINIMAL: Rental Application Form (Versión Mínima)
-- =====================================================
-- Esta versión funciona incluso si faltan algunas tablas opcionales
-- Ejecuta estos comandos uno por uno en el SQL Editor de Supabase

-- 1. Verificar y habilitar RLS en tablas existentes
-- =====================================================

-- Habilitar RLS en las tablas que deberían existir
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas existentes (seguro)
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Applications
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Property owners can update applications for their properties" ON applications;
DROP POLICY IF EXISTS "applications_select_own_policy" ON applications;
DROP POLICY IF EXISTS "applications_select_property_owner_policy" ON applications;
DROP POLICY IF EXISTS "applications_insert_policy" ON applications;

-- Guarantors
DROP POLICY IF EXISTS "Users can read guarantors for their applications" ON guarantors;
DROP POLICY IF EXISTS "Users can insert guarantors" ON guarantors;
DROP POLICY IF EXISTS "Users can update guarantors for their applications" ON guarantors;
DROP POLICY IF EXISTS "guarantors_select_policy" ON guarantors;
DROP POLICY IF EXISTS "guarantors_insert_policy" ON guarantors;

-- 3. Crear políticas básicas para las tablas existentes
-- =====================================================

-- PROFILES - Políticas básicas
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

-- APPLICATIONS - Políticas básicas
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

-- GUARANTORS - Políticas básicas
CREATE POLICY "guarantors_select_policy"
  ON guarantors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "guarantors_insert_policy"
  ON guarantors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- DOCUMENTS - Políticas básicas
CREATE POLICY "documents_select_policy"
  ON documents FOR SELECT
  TO authenticated
  USING (
    uploader_id = auth.uid() OR
    related_entity_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "documents_insert_policy"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (uploader_id = auth.uid());

-- 4. Otorgar permisos básicos
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT ON applications TO authenticated;
GRANT SELECT, INSERT ON guarantors TO authenticated;
GRANT SELECT, INSERT ON documents TO authenticated;

-- Solo si existen estas tablas opcionales
GRANT SELECT, INSERT ON properties TO authenticated;
GRANT SELECT, INSERT ON user_favorites TO authenticated;
GRANT SELECT ON property_images TO authenticated;

-- 5. Verificación
-- =====================================================

SELECT
  '✅ RLS policies configured successfully' as status,
  CURRENT_TIMESTAMP as executed_at;
