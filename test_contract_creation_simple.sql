-- PRUEBA SIMPLE: Crear contrato automáticamente para aplicación aprobada
-- Ejecutar paso a paso

-- PASO 1: Obtener ID del administrador
SELECT
    p.id,
    p.first_name || ' ' || p.paternal_last_name as full_name,
    p.email
FROM profiles p
WHERE p.email = 'ignacioram.mol@gmail.com';

-- El resultado te dará algo como: 550e8400-e29b-41d4-a716-446655440000
-- COPIA ESE ID PARA USARLO EN EL PASO 2

-- PASO 2: Reemplaza el ID y ejecuta (descomenta las líneas):
-- SELECT create_rental_contract_on_approval(
--     'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
--     'PEGA_AQUI_EL_ID_DEL_ADMIN'::uuid  -- ← PEGA EL ID REAL AQUI
-- );

-- PASO 3: Verificar que se creó el contrato
SELECT
    rc.id as contract_id,
    rc.status,
    rc.application_id,
    rc.tenant_email,
    rc.final_amount,
    rc.contract_content,
    rc.contract_html IS NULL as html_null
FROM rental_contracts rc
WHERE rc.application_id = 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid;
