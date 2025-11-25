-- ENCONTRAR CUALQUIER USUARIO VÁLIDO PARA HACER LA PRUEBA
-- Si el usuario específico no existe en auth.users, usa este query

SELECT
    'USUARIO_ENCONTRADO_PARA_PRUEBA' as resultado,
    p.id as user_id_para_usar,
    p.first_name || ' ' || p.paternal_last_name as nombre,
    p.email,
    'COPIA_ESTE_ID_Y_USALO_EN_LA_FUNCIÓN' as instruccion
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Elige cualquier ID de la lista y úsalo en la función:
-- SELECT create_rental_contract_on_approval(
--     'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
--     'PEGA_EL_ID_AQUI'::uuid
-- );











