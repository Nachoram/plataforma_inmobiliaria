-- WORKFLOW COMPLETO: Crear contrato automático
-- Ejecuta todo este script paso a paso

-- ===========================================
-- PASO 1: ENCONTRAR UN USUARIO VÁLIDO
-- ===========================================

SELECT
    'USUARIO_ENCONTRADO' as status,
    p.id as user_id,
    p.first_name || ' ' || p.paternal_last_name as nombre,
    p.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 1;

-- ===========================================
-- PASO 2: COPIA EL ID DEL RESULTADO ARRIBA
-- ===========================================
-- Ejemplo del resultado esperado:
-- user_id: abc123de-456f-7890-abcd-ef1234567890

-- ===========================================
-- PASO 3: EJECUTA LA FUNCIÓN (reemplaza el ID)
-- ===========================================

-- UNA VEZ QUE TENGAS EL ID, EJECUTA ESTO:
-- SELECT create_rental_contract_on_approval(
--     'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid,
--     'abc123de-456f-7890-abcd-ef1234567890'::uuid  -- ← PEGA TU ID REAL AQUI
-- );

-- ===========================================
-- PASO 4: VERIFICA EL RESULTADO
-- ===========================================

-- DESPUÉS DE EJECUTAR LA FUNCIÓN, VERIFICA:
SELECT
    'CONTRATO_CREADO' as verificacion,
    rc.id as contract_id,
    rc.status,
    rc.final_amount,
    rc.guarantee_amount,
    rc.contract_content,
    rc.contract_html IS NULL as html_null,
    rc.created_at
FROM rental_contracts rc
WHERE rc.application_id = 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid;

-- ===========================================
-- RESULTADO ESPERADO:
-- ===========================================
-- ✅ contract_id: (UUID generado)
-- ✅ status: 'approved'
-- ✅ contract_content: '{}'
-- ✅ html_null: true








