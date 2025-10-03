-- Verifica contratos creados recientemente
SELECT
  rc.id as contract_id,
  rc.application_id,
  rc.status as contract_status,
  rc.created_at as contract_created,
  a.status as application_status,
  CONCAT(p.address_street, ' ', p.address_number, ', ', p.address_commune) as property_address
FROM rental_contracts rc
JOIN applications a ON rc.application_id = a.id
JOIN properties p ON a.property_id = p.id
ORDER BY rc.created_at DESC
LIMIT 10;
