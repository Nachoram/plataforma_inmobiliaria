-- SOLUCIÓN DEFINITIVA: Hacer todas las propiedades disponibles para visitas

-- 1. Ver status actual de todas las propiedades
SELECT id, address_street, address_number, status, listing_type
FROM properties
ORDER BY created_at DESC;

-- 2. Actualizar TODAS las propiedades a status 'available'
UPDATE properties
SET status = 'available'
WHERE status IS NULL OR status != 'available';

-- 3. Verificar que todas están disponibles
SELECT COUNT(*) as total_properties,
       COUNT(*) FILTER (WHERE status = 'available') as available_properties
FROM properties;

-- 4. Lista detallada de propiedades disponibles
SELECT id, address_street, address_number, status, listing_type
FROM properties
WHERE status = 'available'
ORDER BY created_at DESC;
