-- =====================================================
-- CHECK: Verificar esquema actual de la base de datos
-- =====================================================
-- Ejecuta esta consulta para ver qué tablas realmente existen

-- Ver todas las tablas en el esquema público
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Ver las columnas de las tablas principales
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN ('profiles', 'applications', 'guarantors', 'properties')
ORDER BY t.table_name, c.ordinal_position;

-- Verificar si existen las tablas problemáticas
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'addresses')
    THEN '✅ Tabla addresses EXISTE'
    ELSE '❌ Tabla addresses NO EXISTE'
  END as addresses_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'applicants')
    THEN '✅ Tabla applicants EXISTE'
    ELSE '❌ Tabla applicants NO EXISTE'
  END as applicants_status;
