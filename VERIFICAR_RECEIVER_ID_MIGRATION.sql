-- =====================================================
-- VERIFICACIÓN DE MIGRACIÓN RECEIVER_ID
-- =====================================================

-- Este archivo contiene comandos para verificar que la migración
-- de receiver_id se ejecutó correctamente.

-- 1. Verificar que las columnas receiver_id existen en todas las tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'receiver_id'
ORDER BY table_name;

-- 2. Verificar que los índices se crearon correctamente
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%receiver_id%'
ORDER BY tablename;

-- 3. Verificar que los triggers se crearon correctamente
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%receiver_id%'
ORDER BY event_object_table;

-- 4. Verificar que las políticas RLS incluyen receiver_id
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%receiver_id%' OR with_check LIKE '%receiver_id%')
ORDER BY tablename, policyname;

-- 5. Verificar que los datos se poblaron correctamente
-- (Esto debería mostrar que receiver_id = owner_id en properties)
-- Solo verificar tablas que existen
SELECT 
    'properties' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN receiver_id = owner_id THEN 1 END) as receiver_id_correcto,
    COUNT(CASE WHEN receiver_id IS NULL THEN 1 END) as receiver_id_nulo
FROM properties
UNION ALL
SELECT 
    'applications' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN receiver_id = applicant_id THEN 1 END) as receiver_id_correcto,
    COUNT(CASE WHEN receiver_id IS NULL THEN 1 END) as receiver_id_nulo
FROM applications
UNION ALL
SELECT 
    'offers' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN receiver_id = offerer_id THEN 1 END) as receiver_id_correcto,
    COUNT(CASE WHEN receiver_id IS NULL THEN 1 END) as receiver_id_nulo
FROM offers
UNION ALL
SELECT 
    'guarantors' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN receiver_id = id THEN 1 END) as receiver_id_correcto,
    COUNT(CASE WHEN receiver_id IS NULL THEN 1 END) as receiver_id_nulo
FROM guarantors
UNION ALL
SELECT 
    'documents' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN receiver_id = uploader_id THEN 1 END) as receiver_id_correcto,
    COUNT(CASE WHEN receiver_id IS NULL THEN 1 END) as receiver_id_nulo
FROM documents
UNION ALL
SELECT 
    'user_favorites' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN receiver_id = user_id THEN 1 END) as receiver_id_correcto,
    COUNT(CASE WHEN receiver_id IS NULL THEN 1 END) as receiver_id_nulo
FROM user_favorites;

-- 5.1 Verificar tablas opcionales (solo si existen)
DO $$
BEGIN
  -- Verificar property_owners si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_owners' AND table_schema = 'public') THEN
    RAISE NOTICE 'Verificando property_owners...';
    PERFORM 1 FROM property_owners LIMIT 1;
  ELSE
    RAISE NOTICE 'Tabla property_owners no existe - omitiendo verificación';
  END IF;
  
  -- Verificar visit_requests si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visit_requests' AND table_schema = 'public') THEN
    RAISE NOTICE 'Verificando visit_requests...';
    PERFORM 1 FROM visit_requests LIMIT 1;
  ELSE
    RAISE NOTICE 'Tabla visit_requests no existe - omitiendo verificación';
  END IF;
END $$;

-- 6. Verificar que la función de consistencia existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'maintain_receiver_id_consistency';

-- 7. Verificar comentarios en las columnas
SELECT 
    c.table_name,
    c.column_name,
    col_description(pgc.oid, pga.attnum) as comment
FROM information_schema.columns c
JOIN pg_class pgc ON pgc.relname = c.table_name
JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace
JOIN pg_attribute pga ON pga.attrelid = pgc.oid AND pga.attname = c.column_name
WHERE c.table_schema = 'public' 
AND c.column_name = 'receiver_id'
AND pgn.nspname = 'public'
ORDER BY c.table_name;
