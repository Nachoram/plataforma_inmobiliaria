-- =====================================================
-- VERIFICACIÓN DE IDs CARACTERÍSTICOS PARA WEBHOOKS
-- =====================================================

-- Este script verifica que los IDs característicos se generaron correctamente
-- para facilitar las búsquedas automáticas en webhooks.

-- 1. Verificar que las columnas characteristic_id existen en todas las tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%characteristic_id'
ORDER BY table_name;

-- 2. Verificar que los índices se crearon correctamente
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%characteristic_id%'
ORDER BY tablename;

-- 3. Verificar que los triggers se crearon correctamente
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%characteristic_id%'
ORDER BY event_object_table;

-- 4. Verificar que los datos se poblaron correctamente
-- (Esto debería mostrar que todos los registros tienen characteristic_id)
-- Solo verificar tablas que existen
SELECT 
    'properties' as tabla,
    COUNT(*) as total_registros,
    COUNT(property_characteristic_id) as characteristic_ids_poblados,
    COUNT(CASE WHEN property_characteristic_id IS NULL THEN 1 END) as characteristic_ids_nulos
FROM properties
UNION ALL
SELECT 
    'applications' as tabla,
    COUNT(*) as total_registros,
    COUNT(application_characteristic_id) as characteristic_ids_poblados,
    COUNT(CASE WHEN application_characteristic_id IS NULL THEN 1 END) as characteristic_ids_nulos
FROM applications
UNION ALL
SELECT 
    'offers' as tabla,
    COUNT(*) as total_registros,
    COUNT(offer_characteristic_id) as characteristic_ids_poblados,
    COUNT(CASE WHEN offer_characteristic_id IS NULL THEN 1 END) as characteristic_ids_nulos
FROM offers
UNION ALL
SELECT 
    'guarantors' as tabla,
    COUNT(*) as total_registros,
    COUNT(guarantor_characteristic_id) as characteristic_ids_poblados,
    COUNT(CASE WHEN guarantor_characteristic_id IS NULL THEN 1 END) as characteristic_ids_nulos
FROM guarantors
UNION ALL
SELECT 
    'documents' as tabla,
    COUNT(*) as total_registros,
    COUNT(document_characteristic_id) as characteristic_ids_poblados,
    COUNT(CASE WHEN document_characteristic_id IS NULL THEN 1 END) as characteristic_ids_nulos
FROM documents
UNION ALL
SELECT 
    'property_images' as tabla,
    COUNT(*) as total_registros,
    COUNT(image_characteristic_id) as characteristic_ids_poblados,
    COUNT(CASE WHEN image_characteristic_id IS NULL THEN 1 END) as characteristic_ids_nulos
FROM property_images
UNION ALL
SELECT 
    'user_favorites' as tabla,
    COUNT(*) as total_registros,
    COUNT(favorite_characteristic_id) as characteristic_ids_poblados,
    COUNT(CASE WHEN favorite_characteristic_id IS NULL THEN 1 END) as characteristic_ids_nulos
FROM user_favorites;

-- 5. Mostrar ejemplos de IDs característicos generados
SELECT 
    'properties' as tabla,
    property_characteristic_id as ejemplo_id
FROM properties 
WHERE property_characteristic_id IS NOT NULL
LIMIT 3
UNION ALL
SELECT 
    'applications' as tabla,
    application_characteristic_id as ejemplo_id
FROM applications 
WHERE application_characteristic_id IS NOT NULL
LIMIT 3
UNION ALL
SELECT 
    'offers' as tabla,
    offer_characteristic_id as ejemplo_id
FROM offers 
WHERE offer_characteristic_id IS NOT NULL
LIMIT 3
UNION ALL
SELECT 
    'guarantors' as tabla,
    guarantor_characteristic_id as ejemplo_id
FROM guarantors 
WHERE guarantor_characteristic_id IS NOT NULL
LIMIT 3
UNION ALL
SELECT 
    'documents' as tabla,
    document_characteristic_id as ejemplo_id
FROM documents 
WHERE document_characteristic_id IS NOT NULL
LIMIT 3
UNION ALL
SELECT 
    'property_images' as tabla,
    image_characteristic_id as ejemplo_id
FROM property_images 
WHERE image_characteristic_id IS NOT NULL
LIMIT 3
UNION ALL
SELECT 
    'user_favorites' as tabla,
    favorite_characteristic_id as ejemplo_id
FROM user_favorites 
WHERE favorite_characteristic_id IS NOT NULL
LIMIT 3;

-- 6. Verificar que la función de generación existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_characteristic_id';

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
AND c.column_name LIKE '%characteristic_id'
AND pgn.nspname = 'public'
ORDER BY c.table_name;

-- 8. Verificar que los IDs característicos son únicos
SELECT 
    'properties' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT property_characteristic_id) as unicos
FROM properties
UNION ALL
SELECT 
    'applications' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT application_characteristic_id) as unicos
FROM applications
UNION ALL
SELECT 
    'offers' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT offer_characteristic_id) as unicos
FROM offers
UNION ALL
SELECT 
    'guarantors' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT guarantor_characteristic_id) as unicos
FROM guarantors
UNION ALL
SELECT 
    'documents' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT document_characteristic_id) as unicos
FROM documents
UNION ALL
SELECT 
    'property_images' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT image_characteristic_id) as unicos
FROM property_images
UNION ALL
SELECT 
    'user_favorites' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT favorite_characteristic_id) as unicos
FROM user_favorites;
