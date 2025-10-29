-- =====================================================
-- DIAGNÓSTICO COMPLETO DE LA TABLA GUARANTORS
-- Fecha: 29 de octubre, 2025
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA ACTUAL DE LA TABLA
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'guarantors'
ORDER BY ordinal_position;

-- 2. VERIFICAR CONSTRAINTS Y ÍNDICES
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
  AND ccu.table_schema = tc.constraint_schema
WHERE tc.table_name = 'guarantors';

-- 3. VERIFICAR TRIGGERS EXISTENTES
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'guarantors';

-- 4. VERIFICAR FUNCIONES UTILIZADAS POR TRIGGERS
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name IN ('update_guarantors_updated_at', 'generate_characteristic_id');

-- 5. VERIFICAR DATOS PROBLEMÁTICOS
SELECT
    COUNT(*) as total_records,
    COUNT(CASE WHEN full_name IS NULL THEN 1 END) as null_full_name,
    COUNT(CASE WHEN contact_email IS NULL THEN 1 END) as null_contact_email,
    COUNT(CASE WHEN contact_email = 'email@no-especificado.com' THEN 1 END) as default_emails,
    COUNT(CASE WHEN guarantor_characteristic_id IS NULL THEN 1 END) as null_characteristic_id,
    COUNT(CASE WHEN monthly_income_clp IS NOT NULL AND monthly_income IS NOT NULL THEN 1 END) as duplicate_income_fields
FROM guarantors;

-- 6. VERIFICAR RELACIONES CON OTRAS TABLAS
SELECT
    'applications' as related_table,
    COUNT(*) as references_found
FROM applications
WHERE guarantor_id IS NOT NULL;

-- 7. VERIFICAR POLÍTICAS RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'guarantors';

-- 8. VERIFICAR REGISTROS RECIENTES CON POSIBLES PROBLEMAS
SELECT
    id,
    rut,
    full_name,
    contact_email,
    guarantor_characteristic_id,
    created_at,
    CASE
        WHEN full_name IS NULL THEN 'NULL_FULL_NAME'
        WHEN contact_email IS NULL THEN 'NULL_EMAIL'
        WHEN contact_email = 'email@no-especificado.com' THEN 'DEFAULT_EMAIL'
        WHEN guarantor_characteristic_id IS NULL THEN 'NULL_CHARACTERISTIC_ID'
        ELSE 'OK'
    END as status
FROM guarantors
ORDER BY created_at DESC
LIMIT 10;
