-- Script para debuggear el application_characteristic_id
-- Verificar si existe y está poblado en la tabla applications

-- 1. Verificar estructura de la tabla applications
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications' 
  AND column_name LIKE '%characteristic%'
ORDER BY ordinal_position;

-- 2. Ver algunos registros de applications con sus characteristic_ids
SELECT 
  a.id as application_id,
  a.application_characteristic_id,
  a.property_id,
  a.applicant_id,
  a.status,
  a.created_at,
  p.property_characteristic_id,
  p.address_street,
  p.address_commune
FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
ORDER BY a.created_at DESC
LIMIT 5;

-- 3. Verificar si hay applications sin application_characteristic_id
SELECT 
  COUNT(*) as total_applications,
  COUNT(application_characteristic_id) as with_characteristic_id,
  COUNT(*) - COUNT(application_characteristic_id) as missing_characteristic_id
FROM applications;

-- 4. Verificar si el application_characteristic_id está siendo confundido con property_characteristic_id
SELECT 
  a.id as application_id,
  a.application_characteristic_id,
  p.property_characteristic_id,
  CASE 
    WHEN a.application_characteristic_id = p.property_characteristic_id THEN 'SAME_ID'
    WHEN a.application_characteristic_id IS NULL THEN 'NULL_APP_ID'
    ELSE 'DIFFERENT_IDS'
  END as id_comparison
FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
LIMIT 10;
