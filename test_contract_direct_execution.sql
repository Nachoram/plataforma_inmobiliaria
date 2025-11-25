-- EJECUCIÓN DIRECTA: Crear contrato con primer usuario válido encontrado
-- Este script encuentra automáticamente un usuario y crea el contrato

-- PRIMERO: Encuentra el primer usuario válido
WITH valid_user AS (
    SELECT p.id as user_id
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    ORDER BY p.created_at DESC
    LIMIT 1
)
SELECT
    'USUARIO_SELECCIONADO' as status,
    user_id,
    'COPIA_ESTE_ID_PARA_USARLO_MANUALMENTE' as instruccion
FROM valid_user;

-- SEGUNDO: Una vez que tengas el ID de arriba, ejecuta manualmente:
-- SELECT create_rental_contract_on_approval(
--     'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
--     'PEGA_EL_ID_AQUI'::uuid
-- );

-- Si quieres automatizar completamente, ejecuta esta consulta
-- (reemplaza el user_id con el valor de arriba):
-- DO $$
-- DECLARE
--     selected_user_id UUID;
-- BEGIN
--     -- Obtener el primer usuario válido
--     SELECT p.id INTO selected_user_id
--     FROM profiles p
--     JOIN auth.users au ON p.id = au.id
--     ORDER BY p.created_at DESC
--     LIMIT 1;
--
--     -- Crear el contrato
--     PERFORM create_rental_contract_on_approval(
--         'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
--         selected_user_id
--     );
--
--     RAISE NOTICE 'Contrato creado con usuario ID: %', selected_user_id;
-- END $$;











