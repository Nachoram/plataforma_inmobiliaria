-- Verificar si hay guarantor_characteristic_id duplicados
SELECT
    guarantor_characteristic_id,
    COUNT(*) as cantidad,
    ARRAY_AGG(id) as guarantor_ids,
    ARRAY_AGG(rut) as ruts
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL
GROUP BY guarantor_characteristic_id
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Ver todos los guarantors y sus characteristic_ids
SELECT
    id,
    rut,
    first_name,
    paternal_last_name,
    guarantor_characteristic_id,
    created_at
FROM guarantors
ORDER BY created_at DESC;

-- Verificar si el trigger está funcionando correctamente
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    obj_description(oid, 'pg_proc') as description
FROM pg_proc
WHERE proname = 'generate_characteristic_id';
