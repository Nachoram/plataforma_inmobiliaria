-- Verificar que las funciones existen - MÉTODO 1: Usando pg_proc
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as parameters,
    obj_description(oid, 'pg_proc') as description
FROM pg_proc
WHERE proname IN ('create_rental_contract_on_approval', 'revert_application_approval');

-- Verificar que las funciones existen - MÉTODO 2: Usando information_schema
SELECT
    routine_name,
    routine_type,
    data_type as return_type,
    external_language
FROM information_schema.routines
WHERE routine_name IN ('create_rental_contract_on_approval', 'revert_application_approval')
AND routine_schema = 'public';

-- Verificar permisos de las funciones
SELECT
    grantee,
    privilege_type,
    table_name as function_name
FROM information_schema.role_routine_grants
WHERE routine_name IN ('create_rental_contract_on_approval', 'revert_application_approval');

-- PRUEBA SIMPLE: Intentar llamar a las funciones (esto fallará si no existen)
-- SELECT 'create_rental_contract_on_approval exists' as status
-- UNION ALL
-- SELECT 'revert_application_approval exists' as status;






