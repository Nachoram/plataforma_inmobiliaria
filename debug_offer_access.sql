-- Debug: Verificar acceso a property_sale_offers
-- Este script verifica si el problema es con las políticas RLS

-- 1. Verificar si la tabla existe
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'property_sale_offers';

-- 2. Verificar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'property_sale_offers';

-- 3. Verificar permisos del usuario actual
SELECT
    current_user,
    session_user;

-- 4. Intentar consulta simple sin JOIN (para aislar el problema)
SELECT COUNT(*) as total_offers FROM property_sale_offers;

-- 5. Intentar consulta con el ID específico
SELECT id, buyer_id, property_id, status
FROM property_sale_offers
WHERE id = '073bb955-71dc-457b-8404-0100d370608e';

-- 6. Verificar si hay datos en la tabla properties
SELECT COUNT(*) as total_properties FROM properties;



