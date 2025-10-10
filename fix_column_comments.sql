-- Script para corregir comentarios faltantes en columnas de documentos
-- Ejecutar en Supabase SQL Editor si los comentarios no se aplicaron correctamente

-- =====================================================
-- CORRECCIÓN DE COMENTARIOS DE COLUMNAS
-- =====================================================

DO $$
DECLARE
  comments_applied integer := 0;
BEGIN
  RAISE NOTICE '🔧 Aplicando comentarios faltantes a columnas de documentos...';

  -- Documentos tradicionales del postulante
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_cedula_postulante' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_cedula_postulante IS 'Ruta del archivo de cédula de identidad del postulante';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_cedula_postulante';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_contrato_postulante' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_contrato_postulante IS 'Ruta del archivo de contrato de trabajo del postulante';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_contrato_postulante';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_liquidaciones_postulante' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_liquidaciones_postulante IS 'Ruta del archivo de liquidaciones de sueldo del postulante';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_liquidaciones_postulante';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_cotizaciones_postulante' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_cotizaciones_postulante IS 'Ruta del archivo de cotizaciones previsionales del postulante';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_cotizaciones_postulante';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_dicom_postulante' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_dicom_postulante IS 'Ruta del archivo de certificado DICOM del postulante';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_dicom_postulante';
  END IF;

  -- Documentos tradicionales del aval
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_cedula_aval' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_cedula_aval IS 'Ruta del archivo de cédula de identidad del aval';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_cedula_aval';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_contrato_aval' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_contrato_aval IS 'Ruta del archivo de contrato de trabajo del aval';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_contrato_aval';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_liquidaciones_aval' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_liquidaciones_aval IS 'Ruta del archivo de liquidaciones de sueldo del aval';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_liquidaciones_aval';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_cotizaciones_aval' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_cotizaciones_aval IS 'Ruta del archivo de cotizaciones previsionales del aval';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_cotizaciones_aval';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_dicom_aval' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_dicom_aval IS 'Ruta del archivo de certificado DICOM del aval';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_dicom_aval';
  END IF;

  -- Verificar comentarios de columnas independientes (de migración anterior)
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_formulario22' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_formulario22 IS 'Ruta del archivo Formulario 22 del postulante (trabajadores independientes)';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_formulario22';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_resumen_boletas' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_resumen_boletas IS 'Ruta del archivo resumen de boletas SII del postulante (trabajadores independientes)';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_resumen_boletas';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_formulario22_aval' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_formulario22_aval IS 'Ruta del archivo Formulario 22 del aval (trabajadores independientes)';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_formulario22_aval';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description pd
    JOIN pg_catalog.pg_class pc ON pd.objoid = pc.oid
    JOIN pg_catalog.pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'applications' AND pa.attname = 'ruta_resumen_boletas_aval' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON COLUMN applications.ruta_resumen_boletas_aval IS 'Ruta del archivo resumen de boletas SII del aval (trabajadores independientes)';
    comments_applied := comments_applied + 1;
    RAISE NOTICE '✅ Comentario aplicado: ruta_resumen_boletas_aval';
  END IF;

  RAISE NOTICE '🎯 Comentarios aplicados: %', comments_applied;

  IF comments_applied = 0 THEN
    RAISE NOTICE 'ℹ️ Todos los comentarios ya estaban aplicados correctamente';
  ELSE
    RAISE NOTICE '✅ Se aplicaron % comentarios faltantes', comments_applied;
  END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL DE COMENTARIOS
-- =====================================================

DO $$
DECLARE
  columns_with_comments integer;
  total_columns integer;
BEGIN
  -- Contar columnas totales
  SELECT COUNT(*) INTO total_columns
  FROM information_schema.columns c
  WHERE c.table_name = 'applications'
    AND c.column_name IN (
      'ruta_cedula_postulante', 'ruta_contrato_postulante', 'ruta_liquidaciones_postulante',
      'ruta_cotizaciones_postulante', 'ruta_dicom_postulante', 'ruta_cedula_aval',
      'ruta_contrato_aval', 'ruta_liquidaciones_aval', 'ruta_cotizaciones_aval',
      'ruta_dicom_aval', 'ruta_formulario22', 'ruta_resumen_boletas',
      'ruta_formulario22_aval', 'ruta_resumen_boletas_aval'
    );

  -- Contar columnas con comentarios
  SELECT COUNT(*) INTO columns_with_comments
  FROM information_schema.columns c
  LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_schema = st.schemaname AND c.table_name = st.relname
  LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
  WHERE c.table_name = 'applications'
    AND c.column_name IN (
      'ruta_cedula_postulante', 'ruta_contrato_postulante', 'ruta_liquidaciones_postulante',
      'ruta_cotizaciones_postulante', 'ruta_dicom_postulante', 'ruta_cedula_aval',
      'ruta_contrato_aval', 'ruta_liquidaciones_aval', 'ruta_cotizaciones_aval',
      'ruta_dicom_aval', 'ruta_formulario22', 'ruta_resumen_boletas',
      'ruta_formulario22_aval', 'ruta_resumen_boletas_aval'
    )
    AND pgd.description IS NOT NULL;

  -- Resultado
  RAISE NOTICE '📝 ESTADO FINAL DE COMENTARIOS:';
  RAISE NOTICE '   Columnas totales: %', total_columns;
  RAISE NOTICE '   Con comentarios: %', columns_with_comments;
  RAISE NOTICE '   Sin comentarios: %', (total_columns - columns_with_comments);

  CASE
    WHEN columns_with_comments = total_columns THEN
      RAISE NOTICE '✅ ÉXITO: Todas las columnas de documentos tienen comentarios descriptivos';
    WHEN columns_with_comments >= total_columns * 0.8 THEN
      RAISE NOTICE '⚠️ CASI COMPLETO: % de las columnas tienen comentarios', ROUND((columns_with_comments::decimal / total_columns) * 100, 1);
    ELSE
      RAISE NOTICE '❌ INCOMPLETO: Solo % de las columnas tienen comentarios', ROUND((columns_with_comments::decimal / total_columns) * 100, 1);
  END CASE;
END $$;
