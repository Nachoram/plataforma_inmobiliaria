-- Migration: Add complete document path columns to applications table
-- Date: 2025-10-10 15:00:00
-- Description: Add all document path columns for traditional documents (applicant and guarantor) plus independent worker documents

-- =====================================================
-- ADD COMPLETE DOCUMENT PATH COLUMNS TO APPLICATIONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔄 Adding complete document path columns to applications table...';

  -- =====================================================
  -- DOCUMENTOS TRADICIONALES DEL POSTULANTE
  -- =====================================================

  -- Add ruta_cedula_postulante column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_cedula_postulante'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_cedula_postulante text;
    RAISE NOTICE '✅ Added ruta_cedula_postulante column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_cedula_postulante column already exists';
  END IF;

  -- Add ruta_contrato_postulante column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_contrato_postulante'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_contrato_postulante text;
    RAISE NOTICE '✅ Added ruta_contrato_postulante column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_contrato_postulante column already exists';
  END IF;

  -- Add ruta_liquidaciones_postulante column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_liquidaciones_postulante'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_liquidaciones_postulante text;
    RAISE NOTICE '✅ Added ruta_liquidaciones_postulante column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_liquidaciones_postulante column already exists';
  END IF;

  -- Add ruta_cotizaciones_postulante column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_cotizaciones_postulante'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_cotizaciones_postulante text;
    RAISE NOTICE '✅ Added ruta_cotizaciones_postulante column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_cotizaciones_postulante column already exists';
  END IF;

  -- Add ruta_dicom_postulante column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_dicom_postulante'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_dicom_postulante text;
    RAISE NOTICE '✅ Added ruta_dicom_postulante column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_dicom_postulante column already exists';
  END IF;

  -- =====================================================
  -- DOCUMENTOS TRADICIONALES DEL AVAL
  -- =====================================================

  -- Add ruta_cedula_aval column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_cedula_aval'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_cedula_aval text;
    RAISE NOTICE '✅ Added ruta_cedula_aval column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_cedula_aval column already exists';
  END IF;

  -- Add ruta_contrato_aval column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_contrato_aval'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_contrato_aval text;
    RAISE NOTICE '✅ Added ruta_contrato_aval column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_contrato_aval column already exists';
  END IF;

  -- Add ruta_liquidaciones_aval column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_liquidaciones_aval'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_liquidaciones_aval text;
    RAISE NOTICE '✅ Added ruta_liquidaciones_aval column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_liquidaciones_aval column already exists';
  END IF;

  -- Add ruta_cotizaciones_aval column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_cotizaciones_aval'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_cotizaciones_aval text;
    RAISE NOTICE '✅ Added ruta_cotizaciones_aval column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_cotizaciones_aval column already exists';
  END IF;

  -- Add ruta_dicom_aval column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_dicom_aval'
  ) THEN
    ALTER TABLE applications ADD COLUMN ruta_dicom_aval text;
    RAISE NOTICE '✅ Added ruta_dicom_aval column to applications table';
  ELSE
    RAISE NOTICE 'ℹ️ ruta_dicom_aval column already exists';
  END IF;

  -- =====================================================
  -- DOCUMENTOS DE TRABAJADORES INDEPENDIENTES (YA AGREGADOS ANTERIORMENTE)
  -- =====================================================

  -- Verificar que las columnas de independientes existen (de migración anterior)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_formulario22'
  ) THEN
    RAISE NOTICE '⚠️ ruta_formulario22 column missing - should have been added by previous migration';
  ELSE
    RAISE NOTICE '✅ ruta_formulario22 column exists (from previous migration)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_resumen_boletas'
  ) THEN
    RAISE NOTICE '⚠️ ruta_resumen_boletas column missing - should have been added by previous migration';
  ELSE
    RAISE NOTICE '✅ ruta_resumen_boletas column exists (from previous migration)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_formulario22_aval'
  ) THEN
    RAISE NOTICE '⚠️ ruta_formulario22_aval column missing - should have been added by previous migration';
  ELSE
    RAISE NOTICE '✅ ruta_formulario22_aval column exists (from previous migration)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ruta_resumen_boletas_aval'
  ) THEN
    RAISE NOTICE '⚠️ ruta_resumen_boletas_aval column missing - should have been added by previous migration';
  ELSE
    RAISE NOTICE '✅ ruta_resumen_boletas_aval column exists (from previous migration)';
  END IF;

  RAISE NOTICE '✅ Migration completed successfully';
END $$;

-- =====================================================
-- ADD COMMENTS FOR ALL COLUMNS
-- =====================================================

COMMENT ON COLUMN applications.ruta_cedula_postulante IS 'Ruta del archivo de cédula de identidad del postulante';
COMMENT ON COLUMN applications.ruta_contrato_postulante IS 'Ruta del archivo de contrato de trabajo del postulante';
COMMENT ON COLUMN applications.ruta_liquidaciones_postulante IS 'Ruta del archivo de liquidaciones de sueldo del postulante';
COMMENT ON COLUMN applications.ruta_cotizaciones_postulante IS 'Ruta del archivo de cotizaciones previsionales del postulante';
COMMENT ON COLUMN applications.ruta_dicom_postulante IS 'Ruta del archivo de certificado DICOM del postulante';

COMMENT ON COLUMN applications.ruta_cedula_aval IS 'Ruta del archivo de cédula de identidad del aval';
COMMENT ON COLUMN applications.ruta_contrato_aval IS 'Ruta del archivo de contrato de trabajo del aval';
COMMENT ON COLUMN applications.ruta_liquidaciones_aval IS 'Ruta del archivo de liquidaciones de sueldo del aval';
COMMENT ON COLUMN applications.ruta_cotizaciones_aval IS 'Ruta del archivo de cotizaciones previsionales del aval';
COMMENT ON COLUMN applications.ruta_dicom_aval IS 'Ruta del archivo de certificado DICOM del aval';

-- =====================================================
-- VERIFY ALL COLUMNS WERE ADDED
-- =====================================================

DO $$
DECLARE
  traditional_columns_count integer;
  independent_columns_count integer;
  total_columns_count integer;
BEGIN
  -- Count traditional document columns
  SELECT COUNT(*) INTO traditional_columns_count
  FROM information_schema.columns
  WHERE table_name = 'applications'
    AND column_name IN (
      'ruta_cedula_postulante', 'ruta_contrato_postulante', 'ruta_liquidaciones_postulante',
      'ruta_cotizaciones_postulante', 'ruta_dicom_postulante', 'ruta_cedula_aval',
      'ruta_contrato_aval', 'ruta_liquidaciones_aval', 'ruta_cotizaciones_aval', 'ruta_dicom_aval'
    );

  -- Count independent worker columns
  SELECT COUNT(*) INTO independent_columns_count
  FROM information_schema.columns
  WHERE table_name = 'applications'
    AND column_name IN (
      'ruta_formulario22', 'ruta_resumen_boletas', 'ruta_formulario22_aval', 'ruta_resumen_boletas_aval'
    );

  total_columns_count := traditional_columns_count + independent_columns_count;

  -- Result
  RAISE NOTICE '📊 VERIFICATION RESULTS:';
  RAISE NOTICE '   Traditional document columns: % out of 10', traditional_columns_count;
  RAISE NOTICE '   Independent worker columns: % out of 4', independent_columns_count;
  RAISE NOTICE '   TOTAL: % out of 14 columns', total_columns_count;

  CASE
    WHEN total_columns_count = 14 THEN
      RAISE NOTICE '✅ SUCCESS: All 14 document path columns are present in applications table';
    WHEN total_columns_count >= 10 THEN
      RAISE NOTICE '⚠️ PARTIAL: % columns added. Independent worker columns may be missing.', total_columns_count;
    ELSE
      RAISE EXCEPTION '❌ FAILURE: Only % columns added. Check migration logs.', total_columns_count;
  END CASE;
END $$;

-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================

-- Summary of changes:
-- ✅ Added 10 traditional document path columns (5 applicant + 5 guarantor)
-- ✅ Verified 4 independent worker columns (from previous migration)
-- ✅ Added descriptive comments to all columns
-- ✅ All columns are optional (nullable) for flexibility
--
-- Document paths stored:
-- POSTULANTE TRADICIONAL:
--   - ruta_cedula_postulante: Cédula de identidad
--   - ruta_contrato_postulante: Contrato de trabajo
--   - ruta_liquidaciones_postulante: Liquidaciones de sueldo
--   - ruta_cotizaciones_postulante: Cotizaciones previsionales
--   - ruta_dicom_postulante: Certificado DICOM
--
-- AVAL TRADICIONAL:
--   - ruta_cedula_aval: Cédula de identidad del aval
--   - ruta_contrato_aval: Contrato de trabajo del aval
--   - ruta_liquidaciones_aval: Liquidaciones de sueldo del aval
--   - ruta_cotizaciones_aval: Cotizaciones previsionales del aval
--   - ruta_dicom_aval: Certificado DICOM del aval
--
-- POSTULANTE INDEPENDIENTE:
--   - ruta_formulario22: Declaración anual de renta
--   - ruta_resumen_boletas: Resumen de boletas SII
--
-- AVAL INDEPENDIENTE:
--   - ruta_formulario22_aval: Declaración anual de renta del aval
--   - ruta_resumen_boletas_aval: Resumen de boletas SII del aval
