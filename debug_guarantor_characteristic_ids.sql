-- Script para diagnosticar el problema del guarantor_characteristic_id repetido

-- 1. Verificar si hay guarantors con characteristic_id nulo
SELECT
    COUNT(*) as total_guarantors,
    COUNT(CASE WHEN guarantor_characteristic_id IS NULL THEN 1 END) as null_characteristic_ids,
    COUNT(CASE WHEN guarantor_characteristic_id IS NOT NULL THEN 1 END) as populated_characteristic_ids
FROM guarantors;

-- 2. Verificar si hay characteristic_ids duplicados
SELECT
    guarantor_characteristic_id,
    COUNT(*) as count
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL
GROUP BY guarantor_characteristic_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. Verificar el formato de los characteristic_ids generados
SELECT
    id,
    rut,
    first_name,
    paternal_last_name,
    guarantor_characteristic_id,
    created_at,
    -- Extraer componentes del characteristic_id
    CASE
        WHEN guarantor_characteristic_id LIKE 'GUAR_%' THEN
            SPLIT_PART(guarantor_characteristic_id, '_', 2)
        ELSE NULL
    END as timestamp_part,
    CASE
        WHEN guarantor_characteristic_id LIKE 'GUAR_%' THEN
            SPLIT_PART(guarantor_characteristic_id, '_', 3)
        ELSE NULL
    END as id_part
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 4. Verificar si el trigger existe y está activo
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname LIKE '%guarantor%'
ORDER BY tgname;

-- 5. Verificar la función generate_characteristic_id
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'generate_characteristic_id';

-- 6. Verificar aplicaciones y sus guarantors asociados
SELECT
    a.id as application_id,
    a.status,
    a.created_at as application_created_at,
    g.id as guarantor_id,
    g.rut,
    g.guarantor_characteristic_id,
    g.created_at as guarantor_created_at
FROM applications a
LEFT JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.guarantor_id IS NOT NULL
ORDER BY a.created_at DESC
LIMIT 20;
