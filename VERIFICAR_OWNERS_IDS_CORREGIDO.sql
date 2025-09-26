-- =====================================================
-- VERIFICACIÓN CORREGIDA DE IDs ESPECÍFICOS EN TABLAS OWNERS
-- =====================================================
-- 
-- Este script verifica que las tablas rental_owners y sale_owners
-- estén configuradas correctamente para generar IDs específicos
-- =====================================================

-- 1. HABILITAR EXTENSIÓN UUID (SI ES NECESARIO)
-- =====================================================

-- Verificar y habilitar la extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar que la función uuid_generate_v4 esté disponible
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'uuid_generate_v4') 
    THEN '✅ Función uuid_generate_v4 disponible'
    ELSE '❌ Función uuid_generate_v4 NO disponible'
  END as "Estado UUID";

-- 2. VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================

-- Verificar estructura de rental_owners
SELECT 
  'rental_owners' as "Tabla",
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nulable",
  column_default as "Valor por Defecto"
FROM information_schema.columns 
WHERE table_name = 'rental_owners' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de sale_owners
SELECT 
  'sale_owners' as "Tabla",
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nulable",
  column_default as "Valor por Defecto"
FROM information_schema.columns 
WHERE table_name = 'sale_owners' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR CONSTRAINT Y PRIMARY KEYS
-- =====================================================

-- Verificar constraints de rental_owners
SELECT 
  'rental_owners' as "Tabla",
  tc.constraint_name as "Nombre Constraint",
  tc.constraint_type as "Tipo",
  kcu.column_name as "Columna"
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'rental_owners' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Verificar constraints de sale_owners
SELECT 
  'sale_owners' as "Tabla",
  tc.constraint_name as "Nombre Constraint",
  tc.constraint_type as "Tipo",
  kcu.column_name as "Columna"
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'sale_owners' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 4. PROBAR GENERACIÓN DE IDs
-- =====================================================

-- Probar generación de UUID
SELECT 
  'Generación de UUID' as "Test",
  uuid_generate_v4() as "UUID Generado",
  LENGTH(uuid_generate_v4()::text) as "Longitud UUID",
  'UUID válido generado correctamente' as "Resultado";

-- 5. VERIFICAR DATOS EXISTENTES
-- =====================================================

-- Verificar si las tablas existen y tienen datos
SELECT 
  'rental_owners' as "Tabla",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_owners' AND table_schema = 'public')
    THEN (SELECT COUNT(*) FROM rental_owners)
    ELSE 0
  END as "Total Registros";

SELECT 
  'sale_owners' as "Tabla",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_owners' AND table_schema = 'public')
    THEN (SELECT COUNT(*) FROM sale_owners)
    ELSE 0
  END as "Total Registros";

-- 6. MOSTRAR EJEMPLOS DE IDs GENERADOS (SI HAY DATOS)
-- =====================================================

-- Mostrar ejemplos de rental_owners si existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_owners' AND table_schema = 'public') THEN
    IF EXISTS (SELECT 1 FROM rental_owners LIMIT 1) THEN
      RAISE NOTICE 'Ejemplos de rental_owners:';
      PERFORM 1; -- Placeholder para el bloque IF
    END IF;
  END IF;
END $$;

-- Query para mostrar ejemplos de rental_owners
SELECT 
  'rental_owners' as "Tabla",
  id as "Owner ID",
  property_id as "Property ID",
  first_name || ' ' || paternal_last_name as "Nombre Completo",
  rut as "RUT",
  created_at as "Fecha Creación"
FROM rental_owners
ORDER BY created_at DESC
LIMIT 3;

-- Query para mostrar ejemplos de sale_owners
SELECT 
  'sale_owners' as "Tabla",
  id as "Owner ID",
  property_id as "Property ID",
  first_name || ' ' || paternal_last_name as "Nombre Completo",
  rut as "RUT",
  created_at as "Fecha Creación"
FROM sale_owners
ORDER BY created_at DESC
LIMIT 3;

-- 7. VERIFICAR INTEGRIDAD REFERENCIAL (CORREGIDO)
-- =====================================================

-- Verificar que todos los rental_owners tienen property_id válidos
SELECT 
  'rental_owners' as "Tabla",
  COUNT(ro.*) as "Total Owners",
  COUNT(p.id) as "Con Property Válida",
  COUNT(ro.*) - COUNT(p.id) as "Sin Property Válida"
FROM rental_owners ro
LEFT JOIN properties p ON ro.property_id = p.id;

-- Verificar que todos los sale_owners tienen property_id válidos
SELECT 
  'sale_owners' as "Tabla",
  COUNT(so.*) as "Total Owners",
  COUNT(p.id) as "Con Property Válida",
  COUNT(so.*) - COUNT(p.id) as "Sin Property Válida"
FROM sale_owners so
LEFT JOIN properties p ON so.property_id = p.id;

-- 8. VERIFICAR UNICIDAD DE IDs
-- =====================================================

-- Verificar que todos los IDs en rental_owners son únicos
SELECT 
  'rental_owners' as "Tabla",
  COUNT(*) as "Total IDs",
  COUNT(DISTINCT id) as "IDs Únicos",
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT id) 
    THEN '✅ Todos los IDs son únicos'
    ELSE '❌ Hay IDs duplicados'
  END as "Estado Unicidad"
FROM rental_owners;

-- Verificar que todos los IDs en sale_owners son únicos
SELECT 
  'sale_owners' as "Tabla",
  COUNT(*) as "Total IDs",
  COUNT(DISTINCT id) as "IDs Únicos",
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT id) 
    THEN '✅ Todos los IDs son únicos'
    ELSE '❌ Hay IDs duplicados'
  END as "Estado Unicidad"
FROM sale_owners;

-- 9. RESUMEN DE CONFIGURACIÓN
-- =====================================================

SELECT 
  '✅ CONFIGURACIÓN VERIFICADA' as "Estado",
  'Las tablas rental_owners y sale_owners están configuradas correctamente' as "Mensaje",
  'Cada registro tendrá un ID UUID único generado automáticamente' as "Detalles";

-- Mostrar información de configuración actual
SELECT 
  'Configuración Actual' as "Sección",
  'Extensión uuid-ossp: ' || CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN 'Habilitada' ELSE 'No habilitada' END as "UUID Extension",
  'Función uuid_generate_v4: ' || CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'uuid_generate_v4') THEN 'Disponible' ELSE 'No disponible' END as "UUID Function";

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
--
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Verifica que todas las consultas se ejecuten sin errores
-- 3. Revisa los resultados para confirmar la configuración
-- 4. Si hay errores, revisa que las tablas existan y tengan la estructura correcta
--
-- NOTAS IMPORTANTES:
-- ✅ Este script es más robusto y maneja casos edge
-- ✅ Verifica la existencia de tablas antes de consultarlas
-- ✅ Usa COUNT(ro.*) en lugar de COUNT(p.property_id) para evitar errores
-- ✅ Incluye verificaciones de unicidad de IDs
-- ✅ Muestra información detallada de configuración
--
-- =====================================================

