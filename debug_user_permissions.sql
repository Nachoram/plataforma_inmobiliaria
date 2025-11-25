-- DEBUG: Verificar permisos del usuario en el frontend

-- 1. Verificar que la función existe y es accesible
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as parameters,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'create_rental_contract_on_approval';

-- 2. Verificar permisos de ejecución para usuarios autenticados
SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_routine_grants
WHERE routine_name = 'create_rental_contract_on_approval';

-- 3. Verificar RLS policies en rental_contracts
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'rental_contracts';

-- 4. Test: Obtener un usuario que SI existe en auth.users
-- (Este es el que deberíamos usar para testear)
SELECT
    'USUARIO_VALIDO_ENCONTRADO' as status,
    p.id as user_id,
    p.first_name || ' ' || p.paternal_last_name as nombre,
    p.email,
    au.email_confirmed_at is not null as email_confirmado,
    au.created_at as auth_created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 3;

-- 5. Simular la llamada RPC exactamente como la hace el frontend
-- (Esto debería funcionar si todo está bien configurado)
DO $$
DECLARE
    test_user_id UUID := '550e8400-e29b-41d4-a716-446655440000'; -- Cambia esto por el ID real del usuario logueado
    test_app_id UUID := 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868';
    result_contract_id UUID;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        RAISE NOTICE '❌ Usuario % no existe en auth.users', test_user_id;
        RETURN;
    END IF;

    RAISE NOTICE '✅ Usuario % existe en auth.users', test_user_id;

    -- Intentar crear el contrato
    SELECT create_rental_contract_on_approval(test_app_id, test_user_id) INTO result_contract_id;

    RAISE NOTICE '✅ Contrato creado: %', result_contract_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;










