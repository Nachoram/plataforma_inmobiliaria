-- FORZAR DISPONIBILIDAD: Todas las propiedades disponibles para visitas

-- 1. Ver status actual
SELECT id, address_street, status, listing_type FROM properties;

-- 2. FORZAR todas las propiedades a 'available' (excepto las vendidas/alquiladas)
UPDATE properties
SET status = 'available'
WHERE status NOT IN ('sold', 'rented') OR status IS NULL;

-- 3. Verificación final
SELECT
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE status = 'available') as available_for_visits,
  COUNT(*) FILTER (WHERE status = 'sold') as sold_properties,
  COUNT(*) FILTER (WHERE status = 'rented') as rented_properties
FROM properties;

-- 4. Lista de propiedades disponibles para visitas
SELECT id, address_street, address_number, status
FROM properties
WHERE status = 'available'
ORDER BY address_street;



