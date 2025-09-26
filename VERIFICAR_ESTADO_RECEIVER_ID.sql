-- =====================================================
-- VERIFICACIÓN DEL ESTADO DE RECEIVER_ID
-- =====================================================

-- Verificar si la columna receiver_id existe en las tablas
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'receiver_id'
ORDER BY table_name;

-- Verificar si hay triggers que aún referencian receiver_id
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND action_statement LIKE '%receiver_id%';

-- Verificar si hay funciones que aún referencian receiver_id
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_definition LIKE '%receiver_id%';

-- Verificar políticas RLS que aún referencian receiver_id
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%receiver_id%' OR qual LIKE '%receiver%');

-- Verificar índices que aún referencian receiver_id
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%receiver_id%';

-- Verificar si hay datos en receiver_id (si la columna existe)
DO $$
DECLARE
    table_record RECORD;
    query_text TEXT;
BEGIN
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN ('properties', 'applications', 'offers', 'guarantors', 'documents', 'property_images', 'user_favorites')
    LOOP
        -- Verificar si la columna existe
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_record.table_name
            AND column_name = 'receiver_id'
        ) THEN
            query_text := 'SELECT COUNT(*) as count_with_receiver_id FROM ' || table_record.table_name || ' WHERE receiver_id IS NOT NULL';
            RAISE NOTICE 'Tabla % tiene columna receiver_id. Ejecutando: %', table_record.table_name, query_text;

            EXECUTE query_text;
        ELSE
            RAISE NOTICE 'Tabla % NO tiene columna receiver_id', table_record.table_name;
        END IF;
    END LOOP;
END $$;
