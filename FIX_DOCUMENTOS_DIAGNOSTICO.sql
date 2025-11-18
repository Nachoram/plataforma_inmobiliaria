-- =====================================================
-- SCRIPT DE DIAGNÓSTICO Y CORRECCIÓN
-- Sistema de Documentos para Postulantes y Avales
-- =====================================================

-- PASO 1: DIAGNÓSTICO
-- Ejecuta esto primero para ver qué está pasando
-- =====================================================

DO $$
DECLARE
    v_app_columns text;
    v_gua_columns text;
    v_app_pk text;
    v_gua_pk text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 DIAGNÓSTICO DE TABLAS';
    RAISE NOTICE '========================================';
    
    -- Ver columnas de application_applicants
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    INTO v_app_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'application_applicants';
    
    RAISE NOTICE 'Columnas de application_applicants:';
    RAISE NOTICE '%', v_app_columns;
    RAISE NOTICE '';
    
    -- Ver columnas de application_guarantors
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    INTO v_gua_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'application_guarantors';
    
    RAISE NOTICE 'Columnas de application_guarantors:';
    RAISE NOTICE '%', v_gua_columns;
    RAISE NOTICE '';
    
    -- Ver PRIMARY KEY de application_applicants
    SELECT a.attname
    INTO v_app_pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'application_applicants'::regclass
      AND i.indisprimary;
    
    RAISE NOTICE 'PRIMARY KEY de application_applicants: %', COALESCE(v_app_pk, '❌ NO TIENE');
    
    -- Ver PRIMARY KEY de application_guarantors
    SELECT a.attname
    INTO v_gua_pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'application_guarantors'::regclass
      AND i.indisprimary;
    
    RAISE NOTICE 'PRIMARY KEY de application_guarantors: %', COALESCE(v_gua_pk, '❌ NO TIENE');
    RAISE NOTICE '========================================';
    
    -- Verificar si existe la columna id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'application_applicants'
          AND column_name = 'id'
    ) THEN
        RAISE NOTICE '✅ application_applicants tiene columna "id"';
    ELSE
        RAISE NOTICE '❌ application_applicants NO tiene columna "id"';
        RAISE NOTICE '⚠️  La PRIMARY KEY es: %', v_app_pk;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'application_guarantors'
          AND column_name = 'id'
    ) THEN
        RAISE NOTICE '✅ application_guarantors tiene columna "id"';
    ELSE
        RAISE NOTICE '❌ application_guarantors NO tiene columna "id"';
        RAISE NOTICE '⚠️  La PRIMARY KEY es: %', v_gua_pk;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PASO 2: VER ESTRUCTURA DETALLADA
-- =====================================================

-- Ejecuta esto para ver la estructura completa
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'id' THEN '⭐ ES EL ID'
        ELSE ''
    END as nota
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('application_applicants', 'application_guarantors')
ORDER BY table_name, ordinal_position;



