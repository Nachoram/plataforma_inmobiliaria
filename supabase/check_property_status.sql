-- Verificar el status de las propiedades
SELECT
  id,
  address_street,
  address_number,
  status,
  listing_type,
  created_at
FROM properties
ORDER BY created_at DESC
LIMIT 10;
