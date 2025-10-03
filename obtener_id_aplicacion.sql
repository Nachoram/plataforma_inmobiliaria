-- Obtén IDs de aplicaciones recientes para testing
SELECT
  id,
  status,
  created_at,
  property_id
FROM applications
ORDER BY created_at DESC
LIMIT 5;
