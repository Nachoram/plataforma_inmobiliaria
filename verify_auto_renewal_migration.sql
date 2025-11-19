-- Script de verificación para la migración de cláusula de renovación automática
-- Ejecutar en SQL Editor de Supabase Dashboard

-- 1. Verificar que la columna existe
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    col_description(table_name::regclass, ordinal_position) as description
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
AND column_name = 'has_auto_renewal_clause'
ORDER BY ordinal_position;

-- 2. Verificar que no hay contratos existentes con valores NULL (deberían ser false por defecto)
SELECT
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN has_auto_renewal_clause IS NULL THEN 1 END) as null_values,
    COUNT(CASE WHEN has_auto_renewal_clause = true THEN 1 END) as true_values,
    COUNT(CASE WHEN has_auto_renewal_clause = false THEN 1 END) as false_values
FROM rental_contracts;

-- 3. Mostrar algunos contratos de ejemplo
SELECT
    id,
    application_id,
    has_auto_renewal_clause,
    created_at
FROM rental_contracts
ORDER BY created_at DESC
LIMIT 5;








