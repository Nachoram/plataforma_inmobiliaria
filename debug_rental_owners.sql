-- Script para debuggear la tabla rental_owners
-- Verificar si existen datos en rental_owners

-- 1. Verificar si la tabla existe
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'rental_owners' 
ORDER BY ordinal_position;

-- 2. Contar registros en rental_owners
SELECT COUNT(*) as total_rental_owners FROM rental_owners;

-- 3. Ver algunos registros de ejemplo
SELECT 
  ro.property_id,
  ro.rental_owner_characteristic_id,
  ro.first_name,
  ro.paternal_last_name,
  p.address_street,
  p.address_commune,
  p.listing_type
FROM rental_owners ro
LEFT JOIN properties p ON ro.property_id = p.id
LIMIT 5;

-- 4. Verificar si hay propiedades de arriendo sin rental_owners
SELECT 
  p.id as property_id,
  p.address_street,
  p.address_commune,
  p.listing_type,
  p.owner_id,
  ro.id as rental_owner_id,
  ro.rental_owner_characteristic_id
FROM properties p
LEFT JOIN rental_owners ro ON p.id = ro.property_id
WHERE p.listing_type = 'arriendo'
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Verificar si hay rental_owners sin characteristic_id
SELECT 
  ro.id,
  ro.property_id,
  ro.rental_owner_characteristic_id,
  ro.first_name,
  ro.paternal_last_name
FROM rental_owners ro
WHERE ro.rental_owner_characteristic_id IS NULL
LIMIT 5;
