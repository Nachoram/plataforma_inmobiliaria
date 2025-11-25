-- ===========================================
-- PRUEBA PASO A PASO: Crear contrato automático
-- ===========================================

-- PASO 0: PRIMERO ejecuta esta consulta para obtener el ID del admin
-- COPIA el ID que aparezca en la columna 'id'

SELECT
    'COPIA_ESTE_ID_PARA_USARLO_DESPUES' as instruccion,
    p.id,
    p.first_name || ' ' || p.paternal_last_name as nombre_completo,
    p.email
FROM profiles p
WHERE p.email = 'ignacioram.mol@gmail.com';

-- ===========================================
-- PASO 1: Una vez que tengas el ID, reemplázalo abajo
-- ===========================================

-- EJEMPLO DE EJECUCIÓN (modifica el ID antes de ejecutar):
-- SELECT create_rental_contract_on_approval(
--     'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
--     '12345678-1234-1234-1234-123456789abc'::uuid  -- ← REEMPLAZA con tu ID real
-- );

-- ===========================================
-- PASO 2: Verifica que se creó el contrato
-- ===========================================

SELECT
    'CONTRATO_CREADO_EXITOSAMENTE' as resultado,
    rc.id as contract_id,
    rc.status,
    rc.final_amount,
    rc.guarantee_amount,
    rc.contract_content,
    rc.contract_html IS NULL as html_es_null,
    rc.created_at
FROM rental_contracts rc
WHERE rc.application_id = 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid;

-- ===========================================
-- RESULTADO ESPERADO:
-- ===========================================
-- ✅ contract_id: (algún UUID)
-- ✅ status: 'approved'
-- ✅ contract_content: '{}'
-- ✅ html_es_null: true











