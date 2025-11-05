-- Verificar la estructura exacta de la tabla applications
-- Fecha: 9 de noviembre de 2025

-- ========================================
-- VERIFICAR ESTRUCTURA DE LA TABLA
-- ========================================

-- Ver todas las columnas de applications
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'applications'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver si hay constraints únicos o foreign keys
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'applications'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Ver índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'applications'
    AND schemaname = 'public';
