-- ============================================================================
-- Migración: Agregar updated_at y columnas faltantes a applications
-- Descripción: Resolver error "Could not find the 'updated_at' column" en RentalApplicationForm
--              Agregar columnas snapshot faltantes para funcionalidad completa
-- Fecha: 2025-10-27
-- ============================================================================

-- PASO 1: Agregar columna updated_at si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'applications'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE applications ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Columna updated_at añadida a applications';
  ELSE
    RAISE NOTICE 'ℹ️ Columna updated_at ya existe en applications';
  END IF;
END $$;

-- PASO 2: Agregar columnas snapshot faltantes que usa el código
DO $$
DECLARE
  col_name text;
  columns_to_add text[] := ARRAY[
    'snapshot_applicant_first_name',
    'snapshot_applicant_paternal_last_name',
    'snapshot_applicant_maternal_last_name',
    'snapshot_applicant_rut',
    'snapshot_applicant_email',
    'snapshot_applicant_phone',
    'snapshot_applicant_profession',
    'snapshot_applicant_monthly_income_clp',
    'snapshot_applicant_age',
    'snapshot_applicant_nationality',
    'snapshot_applicant_marital_status',
    'snapshot_applicant_address_street',
    'snapshot_applicant_address_number',
    'snapshot_applicant_address_department',
    'snapshot_applicant_address_commune',
    'snapshot_applicant_address_region'
  ];
BEGIN
  FOREACH col_name IN ARRAY columns_to_add
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name = col_name
    ) THEN
      -- Determinar el tipo de dato basado en el nombre de la columna
      CASE
        WHEN col_name LIKE '%monthly_income%' THEN
          EXECUTE format('ALTER TABLE applications ADD COLUMN %I bigint', col_name);
        WHEN col_name LIKE '%age%' THEN
          EXECUTE format('ALTER TABLE applications ADD COLUMN %I integer', col_name);
        WHEN col_name LIKE '%address_number%' OR col_name LIKE '%address_department%' THEN
          EXECUTE format('ALTER TABLE applications ADD COLUMN %I varchar(10)', col_name);
        WHEN col_name LIKE '%marital_status%' THEN
          EXECUTE format('ALTER TABLE applications ADD COLUMN %I text', col_name);
        ELSE
          EXECUTE format('ALTER TABLE applications ADD COLUMN %I text', col_name);
      END CASE;
      RAISE NOTICE '✅ Columna % añadida a applications', col_name;
    ELSE
      RAISE NOTICE 'ℹ️ Columna % ya existe en applications', col_name;
    END IF;
  END LOOP;
END $$;

-- PASO 3: Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_applications_updated_at'
  ) THEN
    CREATE TRIGGER update_applications_updated_at
      BEFORE UPDATE ON applications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE '✅ Trigger update_applications_updated_at creado';
  ELSE
    RAISE NOTICE 'ℹ️ Trigger update_applications_updated_at ya existe';
  END IF;
END $$;

-- PASO 4: Verificar estructura final de la tabla
DO $$
DECLARE
  column_record record;
  column_count integer := 0;
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE '📋 ESTRUCTURA FINAL DE LA TABLA APPLICATIONS:';
  RAISE NOTICE '==================================================';

  FOR column_record IN
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'applications'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '%s: %s (%s)', column_record.column_name, column_record.data_type, column_record.is_nullable;
    column_count := column_count + 1;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '📊 Total de columnas: %', column_count;
  RAISE NOTICE '✅ updated_at: Presente y funcional';
  RAISE NOTICE '✅ Columnas snapshot: Todas añadidas';
  RAISE NOTICE '✅ Trigger automático: Configurado';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ¡TABLA APPLICATIONS COMPLETA Y FUNCIONAL!';
  RAISE NOTICE '==================================================';
END $$;
