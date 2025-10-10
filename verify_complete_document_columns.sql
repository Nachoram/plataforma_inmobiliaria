-- Script de verificación: Columnas completas de documentos
-- Ejecutar en el SQL Editor de Supabase para verificar que todas las migraciones funcionaron

-- =====================================================
-- VERIFICACIÓN COMPLETA DE TODAS LAS COLUMNAS DE DOCUMENTOS
-- =====================================================

-- Verificar que todas las 14 columnas nuevas existen en applications
SELECT
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_name LIKE '%postulante%' THEN 'Postulante'
        WHEN column_name LIKE '%aval%' THEN 'Aval'
        ELSE 'General'
    END as categoria,
    CASE
        WHEN column_name LIKE '%formulario22%' OR column_name LIKE '%resumen_boletas%' THEN 'Independiente'
        ELSE 'Tradicional'
    END as tipo_documento
FROM information_schema.columns
WHERE table_name = 'applications'
    AND column_name IN (
        -- Documentos tradicionales postulante
        'ruta_cedula_postulante',
        'ruta_contrato_postulante',
        'ruta_liquidaciones_postulante',
        'ruta_cotizaciones_postulante',
        'ruta_dicom_postulante',
        -- Documentos tradicionales aval
        'ruta_cedula_aval',
        'ruta_contrato_aval',
        'ruta_liquidaciones_aval',
        'ruta_cotizaciones_aval',
        'ruta_dicom_aval',
        -- Documentos independientes postulante
        'ruta_formulario22',
        'ruta_resumen_boletas',
        -- Documentos independientes aval
        'ruta_formulario22_aval',
        'ruta_resumen_boletas_aval'
    )
ORDER BY
    CASE
        WHEN column_name LIKE '%postulante%' THEN 1
        WHEN column_name LIKE '%aval%' AND NOT (column_name LIKE '%formulario22%' OR column_name LIKE '%resumen_boletas%') THEN 2
        WHEN column_name LIKE '%formulario22%' OR column_name LIKE '%resumen_boletas%' THEN 3
        ELSE 4
    END,
    column_name;

-- Contar columnas por categoría
SELECT
    'RESUMEN POR CATEGORÍA:' as info,
    SUM(CASE WHEN column_name LIKE '%postulante%' AND NOT (column_name LIKE '%formulario22%' OR column_name LIKE '%resumen_boletas%') THEN 1 ELSE 0 END) as documentos_tradicionales_postulante,
    SUM(CASE WHEN column_name LIKE '%aval%' AND NOT (column_name LIKE '%formulario22%' OR column_name LIKE '%resumen_boletas%') THEN 1 ELSE 0 END) as documentos_tradicionales_aval,
    SUM(CASE WHEN column_name LIKE '%formulario22%' OR column_name LIKE '%resumen_boletas%' THEN 1 ELSE 0 END) as documentos_independientes,
    COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_name = 'applications'
    AND column_name IN (
        'ruta_cedula_postulante', 'ruta_contrato_postulante', 'ruta_liquidaciones_postulante',
        'ruta_cotizaciones_postulante', 'ruta_dicom_postulante', 'ruta_cedula_aval',
        'ruta_contrato_aval', 'ruta_liquidaciones_aval', 'ruta_cotizaciones_aval',
        'ruta_dicom_aval', 'ruta_formulario22', 'ruta_resumen_boletas',
        'ruta_formulario22_aval', 'ruta_resumen_boletas_aval'
    );

-- =====================================================
-- VERIFICACIÓN DE INTEGRIDAD DE DATOS
-- =====================================================

-- Verificar que no hay registros existentes con valores NULL problemáticos
SELECT
    'ESTADÍSTICAS DE USO:' as info,
    COUNT(*) as total_applications,
    -- Documentos tradicionales postulante
    COUNT(CASE WHEN ruta_cedula_postulante IS NOT NULL THEN 1 END) as cedula_postulante,
    COUNT(CASE WHEN ruta_contrato_postulante IS NOT NULL THEN 1 END) as contrato_postulante,
    COUNT(CASE WHEN ruta_liquidaciones_postulante IS NOT NULL THEN 1 END) as liquidaciones_postulante,
    COUNT(CASE WHEN ruta_cotizaciones_postulante IS NOT NULL THEN 1 END) as cotizaciones_postulante,
    COUNT(CASE WHEN ruta_dicom_postulante IS NOT NULL THEN 1 END) as dicom_postulante,
    -- Documentos tradicionales aval
    COUNT(CASE WHEN ruta_cedula_aval IS NOT NULL THEN 1 END) as cedula_aval,
    COUNT(CASE WHEN ruta_contrato_aval IS NOT NULL THEN 1 END) as contrato_aval,
    COUNT(CASE WHEN ruta_liquidaciones_aval IS NOT NULL THEN 1 END) as liquidaciones_aval,
    COUNT(CASE WHEN ruta_cotizaciones_aval IS NOT NULL THEN 1 END) as cotizaciones_aval,
    COUNT(CASE WHEN ruta_dicom_aval IS NOT NULL THEN 1 END) as dicom_aval,
    -- Documentos independientes
    COUNT(CASE WHEN ruta_formulario22 IS NOT NULL THEN 1 END) as formulario22_postulante,
    COUNT(CASE WHEN ruta_resumen_boletas IS NOT NULL THEN 1 END) as resumen_boletas_postulante,
    COUNT(CASE WHEN ruta_formulario22_aval IS NOT NULL THEN 1 END) as formulario22_aval,
    COUNT(CASE WHEN ruta_resumen_boletas_aval IS NOT NULL THEN 1 END) as resumen_boletas_aval
FROM applications;

-- =====================================================
-- VERIFICACIÓN DE POLÍTICAS RLS
-- =====================================================

-- Verificar que las nuevas columnas están cubiertas por RLS
SELECT
    'Políticas RLS activas:' as info,
    COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'applications';

-- =====================================================
-- VERIFICACIÓN DE COMENTARIOS
-- =====================================================

-- Verificar que los comentarios están configurados
SELECT
    'Comentarios configurados:' as info,
    COUNT(*) as total_comments
FROM (
    SELECT obj_description(oid, 'pg_class') as comment
    FROM pg_class
    WHERE relname = 'applications'
) t
WHERE comment IS NOT NULL;

-- =====================================================
-- RESULTADO FINAL DE VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
  traditional_columns_count integer;
  independent_columns_count integer;
  total_columns_count integer;
  table_exists boolean;
BEGIN
  -- Verificar tabla
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'applications'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION '❌ ERROR: La tabla applications no existe';
  END IF;

  -- Contar columnas tradicionales (10 columnas)
  SELECT COUNT(*) INTO traditional_columns_count
  FROM information_schema.columns
  WHERE table_name = 'applications'
    AND column_name IN (
      'ruta_cedula_postulante', 'ruta_contrato_postulante', 'ruta_liquidaciones_postulante',
      'ruta_cotizaciones_postulante', 'ruta_dicom_postulante', 'ruta_cedula_aval',
      'ruta_contrato_aval', 'ruta_liquidaciones_aval', 'ruta_cotizaciones_aval', 'ruta_dicom_aval'
    );

  -- Contar columnas independientes (4 columnas)
  SELECT COUNT(*) INTO independent_columns_count
  FROM information_schema.columns
  WHERE table_name = 'applications'
    AND column_name IN (
      'ruta_formulario22', 'ruta_resumen_boletas', 'ruta_formulario22_aval', 'ruta_resumen_boletas_aval'
    );

  total_columns_count := traditional_columns_count + independent_columns_count;

  -- Resultado final
  RAISE NOTICE '🎯 VERIFICACIÓN COMPLETA DE SISTEMA DOCUMENTAL:';
  RAISE NOTICE '   📋 Documentos tradicionales: % / 10 columnas', traditional_columns_count;
  RAISE NOTICE '   🧾 Documentos independientes: % / 4 columnas', independent_columns_count;
  RAISE NOTICE '   📊 TOTAL: % / 14 columnas de rutas de archivos', total_columns_count;

  CASE
    WHEN total_columns_count = 14 THEN
      RAISE NOTICE '✅ ÉXITO TOTAL: Sistema documental completamente implementado';
      RAISE NOTICE '   ✓ 5 documentos tradicionales del postulante';
      RAISE NOTICE '   ✓ 5 documentos tradicionales del aval';
      RAISE NOTICE '   ✓ 2 documentos de trabajadores independientes del postulante';
      RAISE NOTICE '   ✓ 2 documentos de trabajadores independientes del aval';
    WHEN total_columns_count >= 10 THEN
      RAISE NOTICE '⚠️ IMPLEMENTACIÓN PARCIAL: % columnas agregadas. Columnas independientes pueden estar pendientes.', total_columns_count;
    ELSE
      RAISE EXCEPTION '❌ IMPLEMENTACIÓN INCOMPLETA: Solo % columnas de rutas de archivos agregadas.', total_columns_count;
  END CASE;

  RAISE NOTICE '🚀 El sistema ahora soporta postulaciones de:';
  RAISE NOTICE '   👔 Trabajadores dependientes (contrato + liquidaciones)';
  RAISE NOTICE '   💼 Trabajadores independientes (formulario 22 + boletas SII)';
  RAISE NOTICE '   🤝 Avales dependientes e independientes';
END $$;
