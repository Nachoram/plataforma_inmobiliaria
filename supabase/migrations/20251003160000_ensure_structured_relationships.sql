-- Migration to ensure structured_applicant_id and structured_guarantor_id columns exist
-- and fix any missing foreign key relationships in applications table
-- Fecha: 2025-10-03 16:00:00

-- =====================================================
-- ENSURE STRUCTURED RELATIONSHIPS EXIST
-- =====================================================

-- Add structured_applicant_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'structured_applicant_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN structured_applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added structured_applicant_id column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️  structured_applicant_id column already exists';
  END IF;
END $$;

-- Add structured_guarantor_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'structured_guarantor_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN structured_guarantor_id uuid REFERENCES guarantors(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added structured_guarantor_id column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️  structured_guarantor_id column already exists';
  END IF;
END $$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_applications_structured_applicant_id
ON applications(structured_applicant_id);

CREATE INDEX IF NOT EXISTS idx_applications_structured_guarantor_id
ON applications(structured_guarantor_id);

-- =====================================================
-- VERIFY FOREIGN KEY CONSTRAINTS
-- =====================================================

DO $$
DECLARE
  constraint_count integer;
BEGIN
  -- Check if structured_applicant_id has foreign key constraint
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'applications'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'structured_applicant_id';

  IF constraint_count = 0 THEN
    RAISE WARNING '⚠️  No foreign key constraint found for structured_applicant_id';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint exists for structured_applicant_id';
  END IF;

  -- Check if structured_guarantor_id has foreign key constraint
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'applications'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'structured_guarantor_id';

  IF constraint_count = 0 THEN
    RAISE WARNING '⚠️  No foreign key constraint found for structured_guarantor_id';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint exists for structured_guarantor_id';
  END IF;
END $$;

-- =====================================================
-- VERIFY APPLICANTS AND GUARANTORS TABLES EXIST
-- =====================================================

DO $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if applicants table exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'applicants'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION '❌ applicants table does not exist. Please run the applicants table migration first.';
  ELSE
    RAISE NOTICE '✅ applicants table exists';
  END IF;

  -- Check if guarantors table exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'guarantors'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION '❌ guarantors table does not exist. Please run the guarantors table migration first.';
  ELSE
    RAISE NOTICE '✅ guarantors table exists';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================

-- ✅ Migration ensure_structured_relationships completed successfully
-- Las columnas structured_applicant_id y structured_guarantor_id han sido verificadas/creadas
-- Los índices de rendimiento han sido creados
-- Las restricciones de clave foránea han sido verificadas
