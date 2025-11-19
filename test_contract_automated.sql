-- TEST AUTOMATIZADO: Crear contrato automáticamente
-- Ejecuta este script completo para crear el contrato

DO $$
DECLARE
    selected_user_id UUID;
    contract_created UUID;
BEGIN
    -- Obtener el primer usuario válido de auth.users
    SELECT p.id INTO selected_user_id
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    ORDER BY p.created_at DESC
    LIMIT 1;

    -- Verificar que encontramos un usuario
    IF selected_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún usuario válido en auth.users';
    END IF;

    RAISE NOTICE 'Usando usuario ID: %', selected_user_id;

    -- Crear el contrato
    SELECT create_rental_contract_on_approval(
        'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
        selected_user_id
    ) INTO contract_created;

    RAISE NOTICE 'Contrato creado exitosamente con ID: %', contract_created;

END $$;

-- Verificar el resultado
SELECT
    'CONTRATO_CREADO_EXITOSAMENTE' as resultado,
    rc.id as contract_id,
    rc.status,
    rc.final_amount,
    rc.guarantee_amount,
    rc.contract_content,
    rc.contract_html IS NULL as html_null,
    rc.created_at
FROM rental_contracts rc
WHERE rc.application_id = 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid;









