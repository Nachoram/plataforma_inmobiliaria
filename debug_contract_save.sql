-- DEBUG: Obtener el application_id real de una aplicación reciente
-- Ejecuta esto para encontrar IDs válidos para testing
SELECT
    id as application_id,
    applicant_id,
    property_id,
    status,
    created_at
FROM applications
ORDER BY created_at DESC
LIMIT 5;

-- Verificar condiciones existentes para aplicaciones aprobadas
SELECT * FROM rental_contract_conditions WHERE application_id IN (
    '619b2cf9-639c-416c-974a-04663b529d5e', -- aprobada, más reciente
    'd7c5dde9-cf2d-432d-8c8c-7dd15603d868', -- aprobada
    '0d6dd793-5ec9-4aac-aba7-920fdd196782', -- aprobada
    '7ca93172-d342-4fb7-a9b4-6d4ff1927337'  -- aprobada
);

-- Verificar qué políticas RLS están activas actualmente
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'rental_contract_conditions'
ORDER BY cmd, policyname;

-- Verificar qué columnas existen en properties
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'properties' AND table_schema = 'public'
ORDER BY column_name;

-- Verificar propietarios de las propiedades (consulta simplificada)
SELECT
    a.id as application_id,
    a.status as application_status,
    p.owner_id as property_owner_id,
    p.id as property_id
FROM applications a
JOIN properties p ON a.property_id = p.id
WHERE a.id IN (
    '619b2cf9-639c-416c-974a-04663b529d5e',
    'd7c5dde9-cf2d-432d-8c8c-7dd15603d868',
    '0d6dd793-5ec9-4aac-aba7-920fdd196782',
    '7ca93172-d342-4fb7-a9b4-6d4ff1927337'
);

-- Para verificar si puedes editar: compara el property_owner_id con tu user ID
-- Si coinciden, puedes editar. Si no, necesitas permisos de admin o la política no está funcionando.
