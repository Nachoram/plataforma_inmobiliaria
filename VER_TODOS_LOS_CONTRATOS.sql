-- ============================================================================
-- DIAGNÓSTICO: ¿Por qué no veo mi contrato?
-- ============================================================================

-- ============================================================================
-- 1. TU USUARIO ACTUAL
-- ============================================================================
SELECT '=== TU USUARIO ===' as info;

SELECT 
    auth.uid() as tu_user_id,
    auth.role() as tu_rol;

-- ============================================================================
-- 2. TODOS LOS CONTRATOS (SIN FILTRO)
-- ============================================================================
SELECT '=== TODOS LOS CONTRATOS ===' as info;

SELECT 
    rc.id as contract_id,
    rc.status as contract_status,
    rc.application_id,
    a.applicant_id,
    p.owner_id,
    CONCAT(p.address_street, ' ', p.address_number) as direccion,
    rc.created_at
FROM rental_contracts rc
LEFT JOIN applications a ON a.id = rc.application_id
LEFT JOIN properties p ON p.id = a.property_id
ORDER BY rc.created_at DESC;

-- ============================================================================
-- 3. VERIFICAR RELACIÓN CON TU USUARIO
-- ============================================================================
SELECT '=== RELACIÓN CON TU USUARIO ===' as info;

SELECT 
    rc.id as contract_id,
    auth.uid() as tu_id,
    p.owner_id as propietario_id,
    a.applicant_id as aplicante_id,
    CASE 
        WHEN p.owner_id = auth.uid() THEN '✅ Eres el PROPIETARIO'
        WHEN a.applicant_id = auth.uid() THEN '✅ Eres el APLICANTE'
        ELSE '❌ NO tienes relación con este contrato'
    END as tu_relacion,
    CASE 
        WHEN p.owner_id = auth.uid() OR a.applicant_id = auth.uid() 
        THEN '✅ DEBERÍAS poder editar'
        ELSE '❌ NO puedes editar (no eres ni propietario ni aplicante)'
    END as permiso_esperado
FROM rental_contracts rc
LEFT JOIN applications a ON a.id = rc.application_id
LEFT JOIN properties p ON p.id = a.property_id
ORDER BY rc.created_at DESC;

-- ============================================================================
-- 4. VERIFICAR POLÍTICAS RLS ACTIVAS
-- ============================================================================
SELECT '=== POLÍTICAS RLS ===' as info;

SELECT 
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies
WHERE tablename = 'rental_contracts'
ORDER BY cmd;

-- ============================================================================
-- 5. VERIFICAR SI LOS JOINS FUNCIONAN
-- ============================================================================
SELECT '=== VERIFICAR JOINS ===' as info;

SELECT 
    'Contratos sin application' as problema,
    COUNT(*) as cantidad
FROM rental_contracts rc
WHERE rc.application_id IS NULL

UNION ALL

SELECT 
    'Applications sin property' as problema,
    COUNT(*) as cantidad
FROM rental_contracts rc
LEFT JOIN applications a ON a.id = rc.application_id
WHERE a.property_id IS NULL;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- Copia TODOS los resultados y envíalos.
-- 
-- Especialmente importante:
-- - Tu user_id (sección 1)
-- - El owner_id y applicant_id del contrato (sección 2)
-- - La relación con tu usuario (sección 3)
-- 
-- Con eso podré decirte exactamente por qué no puedes editarlo.
-- ============================================================================

