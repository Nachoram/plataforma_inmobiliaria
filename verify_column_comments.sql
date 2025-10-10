-- Script para verificar comentarios de columnas específicas
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- VERIFICACIÓN DETALLADA DE COMENTARIOS DE COLUMNAS
-- =====================================================

-- Verificar comentarios de TODAS las columnas de documentos
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    CASE
        WHEN c.column_name LIKE '%postulante%' THEN 'Postulante'
        WHEN c.column_name LIKE '%aval%' THEN 'Aval'
        ELSE 'General'
    END as categoria,
    CASE
        WHEN c.column_name LIKE '%formulario22%' OR c.column_name LIKE '%resumen_boletas%' THEN 'Independiente'
        ELSE 'Tradicional'
    END as tipo_documento,
    pgd.description as comentario_columna,
    CASE
        WHEN pgd.description IS NOT NULL THEN '✅ Tiene comentario'
        ELSE '❌ Sin comentario'
    END as estado_comentario
FROM information_schema.columns c
LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_schema = st.schemaname AND c.table_name = st.relname
LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
WHERE c.table_name = 'applications'
    AND c.column_name IN (
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
        WHEN c.column_name LIKE '%postulante%' THEN 1
        WHEN c.column_name LIKE '%aval%' AND NOT (c.column_name LIKE '%formulario22%' OR c.column_name LIKE '%resumen_boletas%') THEN 2
        WHEN c.column_name LIKE '%formulario22%' OR c.column_name LIKE '%resumen_boletas%' THEN 3
        ELSE 4
    END,
    c.column_name;

-- Contar comentarios por categoría
SELECT
    'RESUMEN DE COMENTARIOS:' as info,
    COUNT(*) as total_columnas,
    SUM(CASE WHEN pgd.description IS NOT NULL THEN 1 ELSE 0 END) as con_comentario,
    SUM(CASE WHEN pgd.description IS NULL THEN 1 ELSE 0 END) as sin_comentario
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
    );

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
  columns_with_comments integer;
  total_columns integer;
BEGIN
  -- Contar columnas con comentarios
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

  -- Contar columnas que tienen comentarios
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
  RAISE NOTICE '📝 VERIFICACIÓN DE COMENTARIOS DE COLUMNAS:';
  RAISE NOTICE '   Columnas totales: %', total_columns;
  RAISE NOTICE '   Con comentarios: %', columns_with_comments;
  RAISE NOTICE '   Sin comentarios: %', (total_columns - columns_with_comments);

  CASE
    WHEN columns_with_comments = total_columns THEN
      RAISE NOTICE '✅ ÉXITO: Todas las columnas de documentos tienen comentarios descriptivos';
    WHEN columns_with_comments > 0 THEN
      RAISE NOTICE '⚠️ PARCIAL: % columnas tienen comentarios, pero faltan %', columns_with_comments, (total_columns - columns_with_comments);
    ELSE
      RAISE NOTICE '❌ ERROR: Ninguna columna tiene comentarios configurados';
  END CASE;

  RAISE NOTICE '💡 Los comentarios ayudan a la documentación y mantenimiento del código';
END $$;
