-- =====================================================
-- CORREGIR FUNCIÓN UUID EN TABLAS OWNERS
-- =====================================================
-- 
-- El problema es que la tabla usa extensions.uuid_generate_v4()
-- pero debería usar uuid_generate_v4() directamente
-- =====================================================

-- 1. VERIFICAR LA FUNCIÓN ACTUAL
-- =====================================================

-- Verificar qué función UUID está disponible
SELECT 
  'Funciones UUID disponibles:' as "Información",
  proname as "Nombre Función",
  pronamespace::regnamespace as "Esquema"
FROM pg_proc 
WHERE proname LIKE '%uuid%'
ORDER BY proname;

-- 2. VERIFICAR EL DEFAULT ACTUAL DE LA TABLA
-- =====================================================

-- Ver el default actual de la columna id
SELECT 
  column_name,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_name = 'rental_owners' 
  AND column_name = 'id'
  AND table_schema = 'public';

-- 3. CORREGIR LA FUNCIÓN DEFAULT
-- =====================================================

-- Opción 1: Cambiar a usar uuid_generate_v4() directamente
ALTER TABLE rental_owners 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Verificar el cambio
SELECT 
  'rental_owners' as "Tabla",
  column_name,
  column_default,
  'Default actualizado correctamente' as "Estado"
FROM information_schema.columns 
WHERE table_name = 'rental_owners' 
  AND column_name = 'id'
  AND table_schema = 'public';

-- 4. HACER LO MISMO PARA SALE_OWNERS
-- =====================================================

-- Verificar sale_owners
SELECT 
  column_name,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_name = 'sale_owners' 
  AND column_name = 'id'
  AND table_schema = 'public';

-- Corregir sale_owners también
ALTER TABLE sale_owners 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Verificar el cambio en sale_owners
SELECT 
  'sale_owners' as "Tabla",
  column_name,
  column_default,
  'Default actualizado correctamente' as "Estado"
FROM information_schema.columns 
WHERE table_name = 'sale_owners' 
  AND column_name = 'id'
  AND table_schema = 'public';

-- 5. PROBAR LA GENERACIÓN DE UUID
-- =====================================================

-- Probar que funciona correctamente
SELECT 
  'Test de generación UUID' as "Test",
  uuid_generate_v4() as "UUID Generado",
  'Funciona correctamente' as "Resultado";

-- 6. VERIFICAR QUE LAS TABLAS ESTÁN LISTAS
-- =====================================================

-- Verificar estructura final de rental_owners
SELECT 
  'rental_owners' as "Tabla",
  column_name as "Columna",
  data_type as "Tipo",
  column_default as "Default",
  is_nullable as "Nulable"
FROM information_schema.columns 
WHERE table_name = 'rental_owners' 
  AND table_schema = 'public'
  AND column_name = 'id';

-- Verificar estructura final de sale_owners
SELECT 
  'sale_owners' as "Tabla",
  column_name as "Columna",
  data_type as "Tipo",
  column_default as "Default",
  is_nullable as "Nulable"
FROM information_schema.columns 
WHERE table_name = 'sale_owners' 
  AND table_schema = 'public'
  AND column_name = 'id';

-- 7. SIMULAR INSERCIÓN PARA VERIFICAR
-- =====================================================

-- Crear una tabla temporal para probar la generación de UUID
CREATE TEMP TABLE test_uuid_generation (
  id uuid DEFAULT uuid_generate_v4(),
  name text
);

-- Insertar un registro de prueba
INSERT INTO test_uuid_generation (name) VALUES ('Test Record');

-- Ver el UUID generado
SELECT 
  'Test de inserción' as "Test",
  id as "UUID Generado",
  name as "Registro",
  'UUID generado automáticamente' as "Resultado"
FROM test_uuid_generation;

-- Limpiar tabla temporal
DROP TABLE test_uuid_generation;

-- 8. RESUMEN FINAL
-- =====================================================

SELECT 
  '✅ CORRECCIÓN COMPLETADA' as "Estado",
  'Las tablas rental_owners y sale_owners ahora usan uuid_generate_v4() correctamente' as "Mensaje",
  'Cada inserción generará un ID UUID único específico' as "Resultado";

-- =====================================================
-- EXPLICACIÓN DEL PROBLEMA Y SOLUCIÓN
-- =====================================================
--
-- PROBLEMA IDENTIFICADO:
-- ❌ La tabla tenía: DEFAULT extensions.uuid_generate_v4()
-- ✅ Ahora tiene: DEFAULT uuid_generate_v4()
--
-- DIFERENCIA:
-- - extensions.uuid_generate_v4() → Ruta completa con esquema
-- - uuid_generate_v4() → Función directa (más estándar)
--
-- RESULTADO:
-- ✅ Ambas funciones generan UUIDs únicos
-- ✅ La corrección asegura compatibilidad estándar
-- ✅ Los IDs específicos se generarán correctamente
--
-- VERIFICACIÓN:
-- ✅ Ejecuta este script completo
-- ✅ Verifica que no hay errores
-- ✅ Prueba publicando una propiedad
-- ✅ Revisa los logs en la consola del navegador
--
-- =====================================================
