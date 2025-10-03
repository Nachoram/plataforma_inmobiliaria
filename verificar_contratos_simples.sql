-- Verificación simple: ¿Cuántos contratos hay?
SELECT
  COUNT(*) as total_contratos,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as contratos_ultima_hora,
  COUNT(*) FILTER (WHERE status = 'draft') as contratos_borrador,
  COUNT(*) FILTER (WHERE status = 'fully_signed') as contratos_firmados
FROM rental_contracts;

-- Ver los 5 contratos más recientes
SELECT
  id,
  application_id,
  status,
  created_at
FROM rental_contracts
ORDER BY created_at DESC
LIMIT 5;
