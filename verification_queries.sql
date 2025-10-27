-- =====================================================
-- VERIFICACIÓN DE MIGRACIÓN COMPLETA
-- Ejecuta estas consultas en Supabase Dashboard
-- =====================================================

-- 1. Verificar rental_owners poblada
SELECT COUNT(*) as rental_owners_count FROM rental_owners;

-- 2. Verificar propiedad específica del error
SELECT ro.rental_owner_characteristic_id, ro.first_name, ro.paternal_last_name
FROM rental_owners ro
WHERE ro.property_id = 'c5401929-ca4e-486a-bed7-b883e76f7f6e';

-- 3. Verificar todas las columnas characteristic_id
SELECT
  COUNT(application_characteristic_id) as app_ids,
  COUNT(guarantor_characteristic_id) as guarantor_ids
FROM applications;

SELECT COUNT(property_characteristic_id) as property_ids FROM properties;

SELECT COUNT(rental_owner_characteristic_id) as owner_ids FROM rental_owners;

SELECT COUNT(contract_conditions_characteristic_id) as contract_ids FROM rental_contract_conditions;

-- 4. Verificar aplicación específica
SELECT
  a.id,
  a.application_characteristic_id,
  a.guarantor_characteristic_id,
  p.property_characteristic_id,
  ro.rental_owner_characteristic_id
FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
LEFT JOIN rental_owners ro ON p.id = ro.property_id
WHERE a.id = '1327791a-e975-4391-840c-aa763e8206e0';

-- 5. Verificar estructura de tablas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('applications', 'properties', 'rental_owners', 'rental_contract_conditions')
  AND column_name LIKE '%characteristic%'
ORDER BY table_name, column_name;
