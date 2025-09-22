-- =====================================================
-- AUDITORÍA COMPLETA DE POLÍTICAS RLS
-- Identificar qué tablas tienen políticas y cuáles faltan
-- =====================================================

-- AUDITORÍA PRINCIPAL: Estado de RLS por tabla
SELECT '=== AUDITORÍA COMPLETA DE RLS ===' as audit_step;

SELECT
  t.table_name,
  CASE 
    WHEN pt.rowsecurity = true THEN '✅ HABILITADO'
    WHEN pt.rowsecurity = false THEN '❌ DESHABILITADO'
    ELSE '⚠️  NO ENCONTRADO'
  END as rls_status,
  COALESCE(
    string_agg(
      DISTINCT pol.cmd || ': ' || pol.policyname, 
      ', ' 
      ORDER BY pol.cmd || ': ' || pol.policyname
    ), 
    '❌ SIN POLÍTICAS'
  ) as policies,
  COUNT(DISTINCT pol.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON t.table_name = pt.tablename 
  AND pt.schemaname = 'public'
LEFT JOIN pg_policies pol ON t.table_name = pol.tablename
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'sql_%'
  AND t.table_name IN (
    'profiles', 
    'properties', 
    'property_images',
    'documents',
    'offers',
    'applications',
    'messages'
  )
GROUP BY t.table_name, pt.rowsecurity
ORDER BY t.table_name;

-- DETALLE DE POLÍTICAS EXISTENTES POR TABLA CRÍTICA
SELECT '=== DETALLE DE POLÍTICAS EXISTENTES ===' as detail_step;

SELECT 
  tablename as tabla,
  policyname as politica,
  cmd as operacion,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 Lectura'
    WHEN cmd = 'INSERT' THEN '➕ Creación'
    WHEN cmd = 'UPDATE' THEN '✏️  Actualización'
    WHEN cmd = 'DELETE' THEN '🗑️  Eliminación'
    WHEN cmd = 'ALL' THEN '🔧 Todas las operaciones'
    ELSE cmd
  END as descripcion_operacion
FROM pg_policies 
WHERE tablename IN (
  'profiles', 
  'properties', 
  'property_images',
  'documents',
  'offers',
  'applications',
  'messages'
)
ORDER BY tablename, cmd, policyname;

-- IDENTIFICAR TABLAS CRÍTICAS SIN RLS
SELECT '=== TABLAS CRÍTICAS SIN RLS (VULNERABLES) ===' as vulnerable_tables;

SELECT 
  t.table_name as tabla_vulnerable,
  '❌ CRÍTICO: Sin políticas RLS' as estado,
  CASE t.table_name
    WHEN 'offers' THEN 'Necesita: policies para offerer_id y property owner'
    WHEN 'applications' THEN 'Necesita: policies para applicant_id y property owner'
    WHEN 'documents' THEN 'Necesita: policies para uploader_id'
    WHEN 'messages' THEN 'Necesita: policies para sender_id/receiver_id'
    ELSE 'Necesita: auditoría de columnas de propiedad'
  END as recomendacion
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON t.table_name = pt.tablename AND pt.schemaname = 'public'
LEFT JOIN (
  SELECT DISTINCT tablename 
  FROM pg_policies 
  WHERE tablename IN ('profiles', 'properties', 'property_images', 'documents', 'offers', 'applications', 'messages')
) pol ON t.table_name = pol.tablename
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN ('offers', 'applications', 'documents', 'messages')
  AND (pt.rowsecurity IS NULL OR pt.rowsecurity = false OR pol.tablename IS NULL)
ORDER BY t.table_name;

-- RESUMEN EJECUTIVO
DO $$
DECLARE
    total_tables INTEGER;
    protected_tables INTEGER;
    vulnerable_tables INTEGER;
BEGIN
    -- Contar tablas críticas
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name IN ('profiles', 'properties', 'property_images', 'documents', 'offers', 'applications', 'messages');

    -- Contar tablas protegidas (con RLS y políticas)
    SELECT COUNT(DISTINCT pol.tablename) INTO protected_tables
    FROM pg_policies pol
    INNER JOIN pg_tables pt ON pol.tablename = pt.tablename AND pt.schemaname = 'public'
    WHERE pol.tablename IN ('profiles', 'properties', 'property_images', 'documents', 'offers', 'applications', 'messages')
      AND pt.rowsecurity = true;

    -- Calcular vulnerables
    vulnerable_tables := total_tables - protected_tables;

    RAISE NOTICE '';
    RAISE NOTICE '🛡️  RESUMEN EJECUTIVO DE SEGURIDAD RLS';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tablas críticas auditadas: %', total_tables;
    RAISE NOTICE '✅ Tablas protegidas (RLS + Políticas): %', protected_tables;
    RAISE NOTICE '❌ Tablas vulnerables (Sin RLS o sin políticas): %', vulnerable_tables;
    RAISE NOTICE '';
    
    IF vulnerable_tables > 0 THEN
        RAISE NOTICE '🚨 ACCIÓN REQUERIDA: % tablas necesitan políticas RLS', vulnerable_tables;
        RAISE NOTICE '📋 Revisar la lista "TABLAS CRÍTICAS SIN RLS" arriba';
    ELSE
        RAISE NOTICE '🎉 EXCELENTE: Todas las tablas críticas están protegidas';
    END IF;
    
    RAISE NOTICE '';
END $$;
