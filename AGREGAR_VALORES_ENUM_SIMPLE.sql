-- =====================================================
-- AGREGAR VALORES AL ENUM PROPERTY_REGIME_ENUM
-- =====================================================
-- 
-- Este script agrega los valores faltantes al enum
-- sin intentar usarlos en la misma transacción.
--
-- IMPORTANTE: Ejecuta este script y luego espera unos segundos
-- antes de ejecutar el siguiente script.
-- =====================================================

-- 1. VERIFICAR VALORES ACTUALES DEL ENUM
-- =====================================================

SELECT 
  'VALORES ACTUALES DEL ENUM' as "Verificación",
  unnest(enum_range(NULL::property_regime_enum)) as "Valores Válidos";

-- 2. AGREGAR VALOR 'separacion_bienes'
-- =====================================================

ALTER TYPE property_regime_enum ADD VALUE IF NOT EXISTS 'separacion_bienes';

-- 3. AGREGAR VALOR 'sociedad_conyugal'
-- =====================================================

ALTER TYPE property_regime_enum ADD VALUE IF NOT EXISTS 'sociedad_conyugal';

-- 4. AGREGAR VALOR 'participacion_gananciales'
-- =====================================================

ALTER TYPE property_regime_enum ADD VALUE IF NOT EXISTS 'participacion_gananciales';

-- 5. VERIFICAR VALORES FINALES DEL ENUM
-- =====================================================

SELECT 
  'VALORES FINALES DEL ENUM' as "Verificación",
  unnest(enum_range(NULL::property_regime_enum)) as "Valores Válidos";

-- 6. RESUMEN
-- =====================================================

SELECT 
  '✅ VALORES AGREGADOS AL ENUM' as "Estado",
  'separacion_bienes, sociedad_conyugal, participacion_gananciales' as "Valores Agregados",
  'Espera unos segundos y ejecuta el siguiente script' as "Siguiente Paso";

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
--
-- 1. Ejecuta este script
-- 2. Espera 10-15 segundos
-- 3. Luego ejecuta CORREGIR_POLITICAS_RLS_IMAGENES.sql
--
-- =====================================================
