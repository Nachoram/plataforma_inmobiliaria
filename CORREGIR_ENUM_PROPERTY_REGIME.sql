-- =====================================================
-- CORRECCIÓN DEL ENUM PROPERTY_REGIME_ENUM
-- =====================================================
-- 
-- Este script corrige el enum property_regime_enum
-- agregando los valores faltantes.
--
-- PROBLEMA: "invalid input value for enum property_regime_enum: separacion_bienes"
-- SOLUCIÓN: Agregar los valores faltantes al enum
--
-- IMPORTANTE: Ejecuta este script PRIMERO, luego ejecuta el siguiente
-- =====================================================

-- 1. VERIFICAR VALORES ACTUALES DEL ENUM
-- =====================================================

SELECT 
  'VALORES ACTUALES DEL ENUM' as "Verificación",
  unnest(enum_range(NULL::property_regime_enum)) as "Valores Válidos";

-- 2. AGREGAR VALORES FALTANTES AL ENUM
-- =====================================================

-- Agregar 'separacion_bienes' si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'property_regime_enum'
        AND e.enumlabel = 'separacion_bienes'
    ) THEN
        ALTER TYPE property_regime_enum ADD VALUE 'separacion_bienes';
        RAISE NOTICE '✅ Agregado valor separacion_bienes al enum';
    ELSE
        RAISE NOTICE 'ℹ️ Valor separacion_bienes ya existe en el enum';
    END IF;
END $$;

-- Agregar 'sociedad_conyugal' si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'property_regime_enum'
        AND e.enumlabel = 'sociedad_conyugal'
    ) THEN
        ALTER TYPE property_regime_enum ADD VALUE 'sociedad_conyugal';
        RAISE NOTICE '✅ Agregado valor sociedad_conyugal al enum';
    ELSE
        RAISE NOTICE 'ℹ️ Valor sociedad_conyugal ya existe en el enum';
    END IF;
END $$;

-- Agregar 'participacion_gananciales' si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'property_regime_enum'
        AND e.enumlabel = 'participacion_gananciales'
    ) THEN
        ALTER TYPE property_regime_enum ADD VALUE 'participacion_gananciales';
        RAISE NOTICE '✅ Agregado valor participacion_gananciales al enum';
    ELSE
        RAISE NOTICE 'ℹ️ Valor participacion_gananciales ya existe en el enum';
    END IF;
END $$;

-- 3. VERIFICAR VALORES FINALES DEL ENUM
-- =====================================================

SELECT 
  'VALORES FINALES DEL ENUM' as "Verificación",
  unnest(enum_range(NULL::property_regime_enum)) as "Valores Válidos";

-- 4. RESUMEN DE CORRECCIÓN
-- =====================================================

SELECT 
  '✅ ENUM CORREGIDO' as "Estado",
  'Valores agregados al enum property_regime_enum' as "Acción",
  'Ahora ejecuta el siguiente script' as "Siguiente Paso";

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
--
-- 1. Ejecuta este script PRIMERO
-- 2. Espera a que se complete
-- 3. Luego ejecuta CORREGIR_POLITICAS_RLS_IMAGENES.sql
--
-- =====================================================
