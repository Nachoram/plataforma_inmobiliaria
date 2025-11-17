-- Migration: Add optional document columns for independent workers
-- Date: 2025-10-10 14:00:00
-- Description: Add columns to store file paths for independent worker documents (Formulario 22 and Boletas SII)

-- =====================================================
-- ADD OPTIONAL COLUMNS FOR INDEPENDENT WORKER DOCUMENTS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔄 Adding optional document columns for independent workers...';

  -- Add rutaFormulario22 column (optional - for applicant's Formulario 22)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_formulario22'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_formulario22 text;
    RAISE NOTICE '✅ Added ruta_formulario22 column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_formulario22 column already exists';
  END IF;

  -- Add rutaResumenBoletas column (optional - for applicant's Boletas SII summary)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_resumen_boletas'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_resumen_boletas text;
    RAISE NOTICE '✅ Added ruta_resumen_boletas column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_resumen_boletas column already exists';
  END IF;

  -- Add rutaFormulario22Aval column (optional - for guarantor's Formulario 22)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_formulario22_aval'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_formulario22_aval text;
    RAISE NOTICE '✅ Added ruta_formulario22_aval column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_formulario22_aval column already exists';
  END IF;

  -- Add rutaResumenBoletasAval column (optional - for guarantor's Boletas SII summary)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_resumen_boletas_aval'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_resumen_boletas_aval text;
    RAISE NOTICE '✅ Added ruta_resumen_boletas_aval column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_resumen_boletas_aval column already exists';
  END IF;

  RAISE NOTICE '✅ Migration completed successfully';
END $$;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN applications.ruta_formulario22 IS 'Ruta del archivo Formulario 22 del postulante (trabajadores independientes)';
COMMENT ON COLUMN applications.ruta_resumen_boletas IS 'Ruta del archivo resumen de boletas SII del postulante (trabajadores independientes)';
COMMENT ON COLUMN applications.ruta_formulario22_aval IS 'Ruta del archivo Formulario 22 del aval (trabajadores independientes)';
COMMENT ON COLUMN applications.ruta_resumen_boletas_aval IS 'Ruta del archivo resumen de boletas SII del aval (trabajadores independientes)';

-- =====================================================
-- VERIFY COLUMNS WERE ADDED
-- =====================================================

DO $$
DECLARE
  column_count integer;
BEGIN
  -- Count how many of our new columns exist
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'applications'
    AND column_name IN ('ruta_formulario22', 'ruta_resumen_boletas', 'ruta_formulario22_aval', 'ruta_resumen_boletas_aval');

  RAISE NOTICE '📊 Verification: % out of 4 independent worker document columns exist in applications table', column_count;

  IF column_count = 4 THEN
    RAISE NOTICE '✅ SUCCESS: All independent worker document columns have been added successfully';
  ELSIF column_count > 0 THEN
    RAISE NOTICE '⚠️ PARTIAL: Some columns were added, but not all. Check logs above.';
  ELSE
    RAISE EXCEPTION '❌ FAILURE: No independent worker document columns were added';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================

-- Summary of changes:
-- ✅ Added ruta_formulario22: Optional file path for applicant's Formulario 22 (independent workers)
-- ✅ Added ruta_resumen_boletas: Optional file path for applicant's SII Boletas summary (independent workers)
-- ✅ Added ruta_formulario22_aval: Optional file path for guarantor's Formulario 22 (independent workers)
-- ✅ Added ruta_resumen_boletas_aval: Optional file path for guarantor's SII Boletas summary (independent workers)
--
-- These columns are optional (nullable) and will store file paths when independent workers
-- upload their tax documents instead of traditional employment documents.
