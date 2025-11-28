-- Actualizar el status de las propiedades para que estén disponibles para visitas

-- Primero ver qué propiedades existen
SELECT id, address_street, status FROM properties;

-- Actualizar todas las propiedades para que estén disponibles
UPDATE properties
SET status = 'available'
WHERE status IS NULL OR status != 'available';

-- Verificar que se actualizaron correctamente
SELECT id, address_street, status FROM properties WHERE status = 'available';


