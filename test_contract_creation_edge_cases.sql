-- Script para probar casos edge de creación automática de contratos
-- Ejecutar después de aplicar la migración actualizada
--
-- NOTA: Se corrigió el error de columna 'title' inexistente en la tabla properties.
-- Ahora se usa una concatenación de campos de dirección como identificador de propiedad.

-- Caso 0: Verificar que las tablas necesarias existen
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('rental_contracts', 'applications', 'properties', 'profiles', 'application_applicants')
AND schemaname = 'public'
ORDER BY tablename;

-- Caso 1: Verificar que la función existe y tiene los parámetros correctos
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as parameters,
    obj_description(oid, 'pg_proc') as description
FROM pg_proc
WHERE proname = 'create_rental_contract_on_approval';

-- Caso 2: Verificar permisos de la función
SELECT
    grantee,
    privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'create_rental_contract_on_approval';

-- Caso 3: Verificar que la constraint de unicidad existe
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'unique_contract_per_application';

-- Caso 4: Verificar que el enum contract_status_enum incluye 'approved'
SELECT
    enumtypid::regclass as enum_type,
    enumlabel as value
FROM pg_enum
WHERE enumtypid = 'contract_status_enum'::regtype
ORDER BY enumsortorder;

-- Caso 5: Probar función con aplicación inexistente (debería fallar)
-- SELECT create_rental_contract_on_approval('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid);

-- Caso 6: Verificar contratos existentes y sus estados
SELECT
    rc.id,
    rc.application_id,
    rc.status,
    rc.created_at,
    rc.approved_by,
    a.status as application_status
FROM rental_contracts rc
JOIN applications a ON rc.application_id = a.id
ORDER BY rc.created_at DESC
LIMIT 10;

-- Caso 7: Buscar aplicaciones sin contrato que podrían ser candidatas para prueba
SELECT
    a.id,
    a.status,
    a.created_at,
    (p.address_street || ' ' || p.address_number || COALESCE(', dpto ' || p.address_department, '') || ', ' || p.address_commune) as property_address,
    pr.email as owner_email
FROM applications a
JOIN properties p ON a.property_id = p.id
JOIN profiles pr ON p.owner_id = pr.id
LEFT JOIN rental_contracts rc ON a.id = rc.application_id
WHERE rc.id IS NULL  -- No tienen contrato
AND a.status = 'aprobada'  -- Están aprobadas
ORDER BY a.created_at DESC
LIMIT 5;

-- Caso 8: Probar la función con una aplicación específica (usar el ID de la aplicación más reciente)
-- Reemplazar 'APPLICATION_ID' con uno de los IDs de arriba y 'USER_ID' con el ID del usuario administrador
-- SELECT create_rental_contract_on_approval('d7c5dde9-cf2d-432d-8c8c-7dd15603d868'::uuid, 'USER_ID'::uuid);

-- Caso 9: Verificar que contract_content tiene JSON vacío y contract_html es NULL en contratos creados automáticamente
SELECT
    id,
    application_id,
    status,
    contract_content,
    contract_html IS NULL as contract_html_null,
    created_at
FROM rental_contracts
WHERE notes = 'Contrato creado automáticamente al aprobar postulación'
ORDER BY created_at DESC
LIMIT 5;

-- Caso 10: Verificar que ya no hay aplicaciones aprobadas sin contrato (después de las pruebas)
SELECT
    COUNT(*) as applications_without_contract
FROM applications a
LEFT JOIN rental_contracts rc ON a.id = rc.application_id
WHERE rc.id IS NULL
AND a.status = 'aprobada';
