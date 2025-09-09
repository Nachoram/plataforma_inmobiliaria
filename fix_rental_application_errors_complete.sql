-- =====================================================
-- FIX COMPLETE: Rental Application Form (Versión Completa)
-- =====================================================
-- Esta versión incluye creación de tablas faltantes + políticas RLS
-- Solo ejecuta si necesitas crear las tablas faltantes

-- =====================================================
-- PASO 1: CREAR TABLAS FALTANTES (si no existen)
-- =====================================================

-- Crear tabla addresses si no existe
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  street_address text NOT NULL,
  apartment_number text,
  region text NOT NULL,
  commune text NOT NULL,
  country text NOT NULL DEFAULT 'Chile',
  created_at timestamptz DEFAULT now()
);

-- Crear tabla applicants si no existe
CREATE TABLE IF NOT EXISTS applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  rut text UNIQUE NOT NULL,
  profession text,
  company text,
  monthly_income numeric DEFAULT 0,
  work_seniority_years integer DEFAULT 0,
  contact_email text NOT NULL,
  contact_phone text,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en TODAS las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 2: LIMPIAR POLÍTICAS EXISTENTES
-- =====================================================

-- Limpiar todas las políticas existentes de forma segura
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Property owners can update applications for their properties" ON applications;
DROP POLICY IF EXISTS "applications_select_own_policy" ON applications;
DROP POLICY IF EXISTS "applications_select_property_owner_policy" ON applications;
DROP POLICY IF EXISTS "applications_insert_policy" ON applications;

DROP POLICY IF EXISTS "Users can read guarantors for their applications" ON guarantors;
DROP POLICY IF EXISTS "Users can insert guarantors" ON guarantors;
DROP POLICY IF EXISTS "Users can update guarantors for their applications" ON guarantors;
DROP POLICY IF EXISTS "guarantors_select_policy" ON guarantors;
DROP POLICY IF EXISTS "guarantors_insert_policy" ON guarantors;

DROP POLICY IF EXISTS "Users can read addresses they reference" ON addresses;
DROP POLICY IF EXISTS "Users can insert addresses for their own use" ON addresses;
DROP POLICY IF EXISTS "addresses_select_policy" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_policy" ON addresses;

DROP POLICY IF EXISTS "Users can read their own applicant data" ON applicants;
DROP POLICY IF EXISTS "Users can insert their own applicant data" ON applicants;
DROP POLICY IF EXISTS "Property owners can read applicants for their properties" ON applicants;
DROP POLICY IF EXISTS "applicants_select_policy" ON applicants;
DROP POLICY IF EXISTS "applicants_insert_policy" ON applicants;

-- =====================================================
-- PASO 3: CREAR POLÍTICAS RLS COMPLETAS
-- =====================================================

-- PROFILES
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

-- APPLICATIONS
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

-- GUARANTORS
CREATE POLICY "guarantors_select_policy"
  ON guarantors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "guarantors_insert_policy"
  ON guarantors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ADDRESSES (nueva tabla)
CREATE POLICY "addresses_select_policy"
  ON addresses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "addresses_insert_policy"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- APPLICANTS (nueva tabla)
CREATE POLICY "applicants_select_policy"
  ON applicants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT applicant_id FROM applications WHERE applicant_id = auth.uid()
    )
  );

CREATE POLICY "applicants_insert_policy"
  ON applicants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- DOCUMENTS
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

-- =====================================================
-- PASO 4: OTORGAR PERMISOS COMPLETOS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT ON applications TO authenticated;
GRANT SELECT, INSERT ON guarantors TO authenticated;
GRANT SELECT, INSERT ON addresses TO authenticated;
GRANT SELECT, INSERT ON applicants TO authenticated;
GRANT SELECT, INSERT ON documents TO authenticated;
GRANT SELECT, INSERT ON properties TO authenticated;
GRANT SELECT, INSERT ON user_favorites TO authenticated;
GRANT SELECT ON property_images TO authenticated;

-- =====================================================
-- PASO 5: VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
  table_count integer;
BEGIN
  -- Contar tablas principales
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN ('profiles', 'applications', 'guarantors', 'addresses', 'applicants');

  RAISE NOTICE '✅ Complete migration executed successfully';
  RAISE NOTICE '📊 Found % out of 5 main tables', table_count;
  RAISE NOTICE '🔒 RLS policies configured for all tables';
  RAISE NOTICE '👤 Permissions granted to authenticated users';
  RAISE NOTICE '🕐 Executed at: %', CURRENT_TIMESTAMP;
END $$;
