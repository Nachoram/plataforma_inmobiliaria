-- Script para corregir las propiedades que no tienen rental_owner_characteristic_id
-- Basado en los resultados de la verificación

-- 1. Verificar el estado actual
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
ORDER BY p.created_at DESC;

-- 2. Crear registros faltantes en rental_owners para propiedades de arriendo
-- que no tienen registro en rental_owners
INSERT INTO rental_owners (
  property_id,
  first_name,
  paternal_last_name,
  maternal_last_name,
  rut,
  phone,
  email,
  marital_status,
  property_regime,
  address_street,
  address_number,
  address_department,
  address_commune,
  address_region
)
SELECT 
  p.id as property_id,
  prof.first_name,
  prof.paternal_last_name,
  prof.maternal_last_name,
  prof.rut,
  prof.phone,
  prof.email,
  prof.marital_status,
  prof.property_regime,
  prof.address_street,
  prof.address_number,
  prof.address_department,
  prof.address_commune,
  prof.address_region
FROM properties p
INNER JOIN profiles prof ON p.owner_id = prof.id
LEFT JOIN rental_owners ro ON p.id = ro.property_id
WHERE p.listing_type = 'arriendo'
  AND ro.id IS NULL; -- Solo propiedades que no tienen rental_owner

-- 3. Generar rental_owner_characteristic_id para registros que no lo tienen
UPDATE rental_owners 
SET rental_owner_characteristic_id = 'RENTAL_OWNER_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE rental_owner_characteristic_id IS NULL;

-- 4. Verificar el resultado final
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
ORDER BY p.created_at DESC;

-- 5. Contar cuántos registros se crearon/actualizaron
SELECT 
  COUNT(*) as total_rental_owners,
  COUNT(rental_owner_characteristic_id) as with_characteristic_id,
  COUNT(*) - COUNT(rental_owner_characteristic_id) as missing_characteristic_id
FROM rental_owners;
