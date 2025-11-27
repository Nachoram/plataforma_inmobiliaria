-- SOLUCIÓN SENCILLA: Hacer todas las propiedades disponibles para visitas

-- 1. Ver status actual de las propiedades
SELECT status, COUNT(*) as cantidad
FROM properties
GROUP BY status
ORDER BY cantidad DESC;

-- 2. Actualizar TODAS las propiedades a 'disponible' (excepto vendidas/arrendadas)
UPDATE properties
SET status = 'disponible'
WHERE status NOT IN ('vendida', 'arrendada');

-- 3. Ver resultado final
SELECT
    COUNT(*) as total_propiedades,
    COUNT(*) FILTER (WHERE status = 'disponible') as disponibles_para_visitas,
    COUNT(*) FILTER (WHERE status = 'activa') as activas,
    COUNT(*) FILTER (WHERE status = 'vendida') as vendidas,
    COUNT(*) FILTER (WHERE status = 'arrendada') as arrendadas
FROM properties;

-- 4. Lista de propiedades disponibles
SELECT id, address_street, address_number, status
FROM properties
WHERE status IN ('disponible', 'activa')
ORDER BY address_street
LIMIT 5;
