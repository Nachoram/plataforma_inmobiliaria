-- Script para probar la creación automática de contratos con datos reales
-- Usar una de las aplicaciones aprobadas que no tienen contrato

-- Paso 1: Obtener el ID del usuario administrador
-- Buscamos específicamente el usuario con email ignacioram.mol@gmail.com (que aparece en los resultados)
SELECT
    p.id,
    p.first_name || ' ' || p.paternal_last_name as full_name,
    p.email,
    p.created_at
FROM profiles p
WHERE p.email = 'ignacioram.mol@gmail.com';

-- Si no encuentras al usuario esperado, ejecuta este query para ver todos los usuarios:
-- SELECT p.id, p.first_name || ' ' || p.paternal_last_name as full_name, p.email, p.created_at FROM profiles p ORDER BY p.created_at DESC LIMIT 10;

-- Paso 2: Una vez que tengas el USER_ID, ejecuta esta consulta:
-- (Reemplaza 'TU_USER_ID_AQUI' con el ID real del administrador)

-- EJEMPLO DE EJECUCIÓN (descomenta y reemplaza el USER_ID):
-- SELECT create_rental_contract_on_approval(
--     'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,  -- ID de la aplicación más reciente
--     'TU_USER_ID_AQUI'::uuid                        -- Reemplaza con el ID real
-- );

-- Paso 3: Verificar que se creó el contrato
SELECT
    rc.id as contract_id,
    rc.application_id,
    rc.status,
    rc.tenant_email,
    rc.landlord_email,
    rc.final_amount,
    rc.created_at,
    rc.approved_at,
    rc.contract_content IS NULL as content_null,
    rc.contract_html IS NULL as html_null,
    rc.notes
FROM rental_contracts rc
WHERE rc.application_id = 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid;

-- Paso 4: Verificar que la aplicación sigue aprobada
SELECT
    a.id,
    a.status,
    a.approved_at,
    a.approved_by
FROM applications a
WHERE a.id = 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid;

-- Paso 5: Probar crear contrato duplicado (debería fallar)
-- SELECT create_rental_contract_on_approval(
--     'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,  -- Misma aplicación
--     'USER_ID_AQUI'::uuid
-- );
