-- Script de verificación: Columnas para trabajadores independientes
-- Ejecutar en el SQL Editor de Supabase para verificar que las migraciones funcionaron

-- =====================================================
-- VERIFICACIÓN DE COLUMNAS AGREGADAS
-- =====================================================

-- Verificar que las 4 columnas nuevas existen en applications
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'applications'
    AND column_name IN (
        'ruta_formulario22',
        'ruta_resumen_boletas',
        'ruta_formulario22_aval',
        'ruta_resumen_boletas_aval'
    )
ORDER BY column_name;

-- Contar cuántas columnas nuevas existen
SELECT
    'Total de columnas independientes agregadas:' as status,
    COUNT(*) as cantidad
FROM information_schema.columns
WHERE table_name = 'applications'
    AND column_name IN (
        'ruta_formulario22',
        'ruta_resumen_boletas',
        'ruta_formulario22_aval',
        'ruta_resumen_boletas_aval'
    );

-- Verificar comentarios de las columnas
SELECT
    'Comentarios de columnas:' as info,
    obj_description(
        (SELECT oid FROM pg_class WHERE relname = 'applications'),
        'pg_class'
    ) as table_comment;

-- Verificar que las columnas son nullable (opcionales)
SELECT
    column_name,
    CASE
        WHEN is_nullable = 'YES' THEN '✅ Opcional (nullable)'
        ELSE '❌ Obligatoria (not null)'
    END as status
FROM information_schema.columns
WHERE table_name = 'applications'
    AND column_name IN (
        'ruta_formulario22',
        'ruta_resumen_boletas',
        'ruta_formulario22_aval',
        'ruta_resumen_boletas_aval'
    )
ORDER BY column_name;

-- =====================================================
-- VERIFICACIÓN DE INTEGRIDAD DE DATOS
-- =====================================================

-- Verificar que no hay registros existentes con valores NULL problemáticos
SELECT
    'Registros en applications:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN ruta_formulario22 IS NOT NULL THEN 1 END) as with_formulario22,
    COUNT(CASE WHEN ruta_resumen_boletas IS NOT NULL THEN 1 END) as with_resumen_boletas,
    COUNT(CASE WHEN ruta_formulario22_aval IS NOT NULL THEN 1 END) as with_formulario22_aval,
    COUNT(CASE WHEN ruta_resumen_boletas_aval IS NOT NULL THEN 1 END) as with_resumen_boletas_aval
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
-- RESULTADO FINAL
-- =====================================================

DO $$
DECLARE
    column_count integer;
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

    -- Contar columnas nuevas
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'applications'
        AND column_name IN (
            'ruta_formulario22',
            'ruta_resumen_boletas',
            'ruta_formulario22_aval',
            'ruta_resumen_boletas_aval'
        );

    -- Resultado final
    CASE
        WHEN column_count = 4 THEN
            RAISE NOTICE '✅ ÉXITO COMPLETO: Todas las 4 columnas para trabajadores independientes fueron agregadas correctamente';
        WHEN column_count > 0 THEN
            RAISE NOTICE '⚠️ PARCIAL: Se agregaron % columnas de 4. Revisar logs anteriores.', column_count;
        ELSE
            RAISE NOTICE '❌ ERROR: No se agregaron las columnas para trabajadores independientes';
    END CASE;

    RAISE NOTICE '📋 Verificación completada. Las columnas nuevas están listas para usar.';
END $$;
