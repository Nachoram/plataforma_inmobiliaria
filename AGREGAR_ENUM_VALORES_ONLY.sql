-- =====================================================
-- AGREGAR VALORES AL ENUM PROPERTY_REGIME_ENUM (SOLO AGREGAR)
-- =====================================================
-- 
-- Este script SOLO agrega los valores faltantes al enum
-- sin intentar verificarlos en la misma transacción.
--
-- IMPORTANTE: Ejecuta este script y luego espera unos segundos
-- antes de ejecutar cualquier otro script.
-- =====================================================

-- 1. AGREGAR VALOR 'separacion_bienes'
-- =====================================================

ALTER TYPE property_regime_enum ADD VALUE IF NOT EXISTS 'separacion_bienes';

-- 2. AGREGAR VALOR 'sociedad_conyugal'
-- =====================================================

ALTER TYPE property_regime_enum ADD VALUE IF NOT EXISTS 'sociedad_conyugal';

-- 3. AGREGAR VALOR 'participacion_gananciales'
-- =====================================================

ALTER TYPE property_regime_enum ADD VALUE IF NOT EXISTS 'participacion_gananciales';

-- 4. RESUMEN
-- =====================================================

SELECT 
  '✅ VALORES AGREGADOS AL ENUM' as "Estado",
  'separacion_bienes, sociedad_conyugal, participacion_gananciales' as "Valores Agregados",
  'Espera 30 segundos y ejecuta el siguiente script' as "Siguiente Paso";

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
--
-- 1. Ejecuta este script
-- 2. Espera 30 segundos
-- 3. Luego ejecuta CORREGIR_POLITICAS_RLS_IMAGENES.sql
--
-- =====================================================
