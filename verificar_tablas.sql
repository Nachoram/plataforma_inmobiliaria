-- =====================================================
-- VERIFICACIÓN DE TABLAS EXISTENTES
-- =====================================================

-- Lista todas las tablas en el esquema public
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Lista todas las vistas en el esquema public
SELECT
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Verifica si existen las tablas específicas que necesitamos
SELECT
  'profiles' as tabla_esperada,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN '✅ Existe' ELSE '❌ FALTA' END as estado
UNION ALL
SELECT 'guarantors', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guarantors') THEN '✅ Existe' ELSE '❌ FALTA' END
UNION ALL
SELECT 'properties', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN '✅ Existe' ELSE '❌ FALTA' END
UNION ALL
SELECT 'applications', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN '✅ Existe' ELSE '❌ FALTA' END
UNION ALL
SELECT 'rental_contracts', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contracts') THEN '✅ Existe' ELSE '❌ FALTA' END
UNION ALL
SELECT 'contract_clauses', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_clauses') THEN '✅ Existe' ELSE '❌ FALTA' END
UNION ALL
SELECT 'rental_contract_conditions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contract_conditions') THEN '✅ Existe' ELSE '❌ FALTA' END;
