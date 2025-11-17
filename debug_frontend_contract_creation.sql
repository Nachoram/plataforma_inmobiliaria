-- DEBUG: Verificar estado de la función en la base de datos

-- 1. Verificar que la función existe
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as parameters
FROM pg_proc
WHERE proname = 'create_rental_contract_on_approval';

-- 2. Verificar permisos
SELECT
    grantee,
    privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'create_rental_contract_on_approval';

-- 3. Verificar que las aplicaciones siguen sin contrato
SELECT
    a.id,
    a.status,
    a.created_at,
    rc.id IS NULL as sin_contrato
FROM applications a
LEFT JOIN rental_contracts rc ON a.id = rc.application_id
WHERE a.status = 'aprobada'
ORDER BY a.created_at DESC
LIMIT 5;

-- 4. Ver contratos creados recientemente (última hora)
SELECT
    rc.id,
    rc.application_id,
    rc.status,
    rc.created_at,
    rc.created_by,
    rc.approved_by,
    rc.contract_content,
    rc.contract_html IS NULL as html_null
FROM rental_contracts rc
WHERE rc.created_at > NOW() - INTERVAL '1 hour'
ORDER BY rc.created_at DESC;

-- 5. Test directo de la función con la aplicación más reciente
-- (Ejecuta esto para probar si la función funciona)
DO $$
DECLARE
    test_user_id UUID;
    test_contract_id UUID;
BEGIN
    -- Obtener un usuario válido
    SELECT p.id INTO test_user_id
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    ORDER BY p.created_at DESC
    LIMIT 1;

    RAISE NOTICE 'Usuario de prueba: %', test_user_id;

    -- Intentar crear contrato
    SELECT create_rental_contract_on_approval(
        'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
        test_user_id
    ) INTO test_contract_id;

    RAISE NOTICE 'Contrato creado: %', test_contract_id;

END $$;



