-- Script para aplicar la migración de campos de aprobación
-- Ejecutar este script directamente en Supabase SQL Editor o psql

-- =====================================================
-- ADD APPROVAL TRACKING FIELDS TO APPLICATIONS TABLE
-- =====================================================

DO $$
BEGIN
  -- Add approved_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE applications ADD COLUMN approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added approved_by column to applications table';
  ELSE
    RAISE NOTICE 'approved_by column already exists';
  END IF;

  -- Add approved_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE applications ADD COLUMN approved_at timestamptz;
    RAISE NOTICE 'Added approved_at column to applications table';
  ELSE
    RAISE NOTICE 'approved_at column already exists';
  END IF;
END $$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_applications_approved_by ON applications(approved_by);
CREATE INDEX IF NOT EXISTS idx_applications_approved_at ON applications(approved_at);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that the columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
  AND column_name IN ('approved_by', 'approved_at')
ORDER BY column_name;
