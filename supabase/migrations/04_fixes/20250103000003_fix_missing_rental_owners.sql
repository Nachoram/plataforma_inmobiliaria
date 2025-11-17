/*
  # Fix Missing Rental Owners

  Este script corrige las propiedades de arriendo que no tienen registros en rental_owners
  o que no tienen rental_owner_characteristic_id poblado.

  Basado en los resultados de verificación que muestran:
  - Algunas propiedades tienen rental_owner_characteristic_id
  - Algunas propiedades tienen null en rental_owner_characteristic_id
  - Necesitamos crear registros faltantes y poblar los characteristic_ids
*/

-- =====================================================
-- STEP 1: CREAR REGISTROS FALTANTES EN RENTAL_OWNERS
-- =====================================================

-- Crear registros faltantes en rental_owners para propiedades de arriendo
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

-- =====================================================
-- STEP 2: GENERAR RENTAL_OWNER_CHARACTERISTIC_ID FALTANTES
-- =====================================================

-- Generar rental_owner_characteristic_id para registros que no lo tienen
UPDATE rental_owners 
SET rental_owner_characteristic_id = 'RENTAL_OWNER_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE rental_owner_characteristic_id IS NULL;

-- =====================================================
-- STEP 3: VERIFICAR RESULTADO
-- =====================================================

-- Verificar que todas las propiedades de arriendo tengan rental_owner_characteristic_id
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM properties p
  LEFT JOIN rental_owners ro ON p.id = ro.property_id
  WHERE p.listing_type = 'arriendo' 
    AND (ro.id IS NULL OR ro.rental_owner_characteristic_id IS NULL);
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'WARNING: % propiedades de arriendo aún no tienen rental_owner_characteristic_id', missing_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Todas las propiedades de arriendo tienen rental_owner_characteristic_id';
  END IF;
END $$;

-- =====================================================
-- STEP 4: CREAR ÍNDICE PARA OPTIMIZAR CONSULTAS
-- =====================================================

-- Asegurar que el índice existe para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_rental_owners_property_id_characteristic 
ON rental_owners(property_id, rental_owner_characteristic_id);

-- =====================================================
-- STEP 5: COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON COLUMN rental_owners.rental_owner_characteristic_id IS 
'Unique characteristic ID for rental owner data in webhooks. Format: RENTAL_OWNER_{timestamp}_{uuid_prefix}';

-- Log final
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Fixed missing rental_owners and characteristic_ids';
  RAISE NOTICE 'All rental properties should now have rental_owner_characteristic_id';
END $$;
