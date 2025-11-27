-- CORRECCIÓN: Actualizar propiedades usando valores válidos del enum

-- 1. Ver valores permitidos en el enum
SELECT
    n.nspname AS schema_name,
    t.typname AS type_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'property_status_enum'
GROUP BY n.nspname, t.typname;

-- 2. Ver status actual de las propiedades
SELECT DISTINCT status, COUNT(*) as count
FROM properties
GROUP BY status
ORDER BY count DESC;

-- 3. Actualizar propiedades a status válido para visitas ('disponible')
UPDATE properties
SET status = 'disponible'
WHERE status IS NULL;

-- 4. Verificar que no hay propiedades con status inválido
SELECT status, COUNT(*) as count
FROM properties
WHERE status NOT IN ('disponible', 'activa', 'arrendada', 'vendida', 'pausada')
GROUP BY status;

-- 5. Verificación final
SELECT
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE status = 'disponible') as disponibles,
    COUNT(*) FILTER (WHERE status = 'activa') as activas,
    COUNT(*) FILTER (WHERE status = 'arrendada') as arrendadas,
    COUNT(*) FILTER (WHERE status = 'vendida') as vendidas,
    COUNT(*) FILTER (WHERE status = 'pausada') as pausadas,
    COUNT(*) FILTER (WHERE status IS NULL) as sin_status
FROM properties;

-- 6. Lista de propiedades disponibles para visitas (no vendidas/arrendadas)
SELECT id, address_street, address_number, status
FROM properties
WHERE status IN ('disponible', 'activa', 'pausada')
ORDER BY address_street;
