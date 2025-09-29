-- Análisis del uso de guarantors para entender por qué se repite el guarantor_characteristic_id

-- 1. Ver cuántos guarantors únicos hay
SELECT COUNT(*) as total_guarantors FROM guarantors;

-- 2. Ver cuántas aplicaciones usan guarantors
SELECT
    COUNT(*) as total_applications,
    COUNT(CASE WHEN guarantor_id IS NOT NULL THEN 1 END) as applications_with_guarantor,
    COUNT(CASE WHEN guarantor_id IS NULL THEN 1 END) as applications_without_guarantor
FROM applications;

-- 3. Ver qué guarantors están siendo usados y cuántas aplicaciones los usan
SELECT
    g.id,
    g.rut,
    g.first_name,
    g.paternal_last_name,
    g.guarantor_characteristic_id,
    g.created_at as guarantor_created_at,
    COUNT(a.id) as applications_using_this_guarantor,
    ARRAY_AGG(DISTINCT a.status) as application_statuses,
    ARRAY_AGG(DISTINCT a.created_at ORDER BY a.created_at DESC) as application_dates
FROM guarantors g
LEFT JOIN applications a ON g.id = a.guarantor_id
GROUP BY g.id, g.rut, g.first_name, g.paternal_last_name, g.guarantor_characteristic_id, g.created_at
ORDER BY applications_using_this_guarantor DESC;

-- 4. Ver si hay aplicaciones aprobadas que usan el mismo guarantor
SELECT
    g.guarantor_characteristic_id,
    COUNT(a.id) as approved_applications_with_same_guarantor,
    ARRAY_AGG(a.id) as application_ids,
    ARRAY_AGG(a.created_at) as approval_dates
FROM applications a
JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.status = 'aprobada'
GROUP BY g.guarantor_characteristic_id
HAVING COUNT(a.id) > 1;

-- 5. Ver las últimas aplicaciones aprobadas y sus guarantors
SELECT
    a.id as application_id,
    a.status,
    a.created_at as application_created_at,
    g.id as guarantor_id,
    g.rut,
    g.first_name,
    g.paternal_last_name,
    g.guarantor_characteristic_id,
    g.created_at as guarantor_created_at
FROM applications a
LEFT JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.status = 'aprobada'
ORDER BY a.created_at DESC
LIMIT 10;

-- 6. Verificar si el problema es que un mismo guarantor se está usando en múltiples aplicaciones
SELECT
    guarantor_id,
    COUNT(*) as applications_count,
    ARRAY_AGG(id) as application_ids,
    ARRAY_AGG(created_at) as application_dates
FROM applications
WHERE guarantor_id IS NOT NULL
GROUP BY guarantor_id
HAVING COUNT(*) > 1
ORDER BY applications_count DESC;
