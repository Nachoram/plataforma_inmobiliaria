-- =====================================================
-- MIGRATION: Ensure all rental_owners have rental_owner_characteristic_id
-- Date: 2025-10-29
-- =====================================================
-- This migration ensures that ALL rental_owners records have
-- rental_owner_characteristic_id populated. This field is CRITICAL 
-- for contract generation.
--
-- WHY THIS IS NECESSARY:
-- - rental_owner_characteristic_id is REQUIRED for generating contracts
-- - Some rental_owners may have been created before the trigger was added
-- - Some may have NULL values due to insertion errors
-- - Without this ID, the contract generation system (n8n) will fail
-- =====================================================

DO $$ 
DECLARE
    rental_owner_record RECORD;
    next_id INTEGER;
    new_characteristic_id TEXT;
    total_owners INTEGER := 0;
    missing_owners INTEGER := 0;
    updated_owners INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 INICIANDO ACTUALIZACIÓN DE RENTAL_OWNERS...';
    RAISE NOTICE '========================================================';
    
    -- Count total rental_owners
    SELECT COUNT(*) INTO total_owners FROM public.rental_owners;
    RAISE NOTICE '📊 Total de rental_owners en la base de datos: %', total_owners;
    
    -- Count rental_owners without characteristic_id
    SELECT COUNT(*) INTO missing_owners 
    FROM public.rental_owners 
    WHERE rental_owner_characteristic_id IS NULL 
       OR rental_owner_characteristic_id = '';
    
    RAISE NOTICE '⚠️  Rental_owners sin characteristic_id: %', missing_owners;
    RAISE NOTICE '';
    
    -- If there are no owners to update, exit early
    IF missing_owners = 0 THEN
        RAISE NOTICE '✅ Todos los rental_owners ya tienen characteristic_id';
        RAISE NOTICE '========================================================';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Actualizando rental_owners...';
    RAISE NOTICE '';
    
    -- Iterate through all rental_owners without characteristic_id
    FOR rental_owner_record IN
        SELECT 
            id, 
            first_name, 
            paternal_last_name,
            property_id,
            created_at
        FROM public.rental_owners
        WHERE rental_owner_characteristic_id IS NULL
           OR rental_owner_characteristic_id = ''
        ORDER BY created_at ASC
    LOOP
        -- Get next sequence number
        next_id := nextval('rental_owner_characteristic_id_seq');
        
        -- Generate the characteristic ID with format RENTAL_OWNER_XXXXXXX
        new_characteristic_id := 'RENTAL_OWNER_' || LPAD(next_id::TEXT, 7, '0');
        
        -- Update the rental_owner with the new characteristic_id
        UPDATE public.rental_owners
        SET rental_owner_characteristic_id = new_characteristic_id
        WHERE id = rental_owner_record.id;
        
        updated_owners := updated_owners + 1;
        
        RAISE NOTICE '  ✅ Rental_owner actualizado: % % (ID: %, Property: %, Characteristic ID: %)', 
            rental_owner_record.first_name, 
            rental_owner_record.paternal_last_name,
            rental_owner_record.id,
            rental_owner_record.property_id,
            new_characteristic_id;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ ACTUALIZACIÓN COMPLETADA';
    RAISE NOTICE '📊 Estadísticas finales:';
    RAISE NOTICE '  - Total de rental_owners: %', total_owners;
    RAISE NOTICE '  - Rental_owners actualizados: %', updated_owners;
    RAISE NOTICE '  - Rental_owners que requerían actualización: %', missing_owners;
    
    IF updated_owners = missing_owners THEN
        RAISE NOTICE '  ✅ Todos los rental_owners fueron actualizados exitosamente';
    ELSE
        RAISE WARNING '  ⚠️  Algunos rental_owners no pudieron ser actualizados. Revise los logs anteriores.';
    END IF;
    
    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

DO $$
DECLARE
    owners_with_id INTEGER;
    owners_without_id INTEGER;
    total_owners INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL...';
    RAISE NOTICE '========================================================';
    
    SELECT COUNT(*) INTO total_owners FROM public.rental_owners;
    SELECT COUNT(*) INTO owners_with_id 
    FROM public.rental_owners 
    WHERE rental_owner_characteristic_id IS NOT NULL 
      AND rental_owner_characteristic_id != '';
    
    SELECT COUNT(*) INTO owners_without_id 
    FROM public.rental_owners 
    WHERE rental_owner_characteristic_id IS NULL 
       OR rental_owner_characteristic_id = '';
    
    RAISE NOTICE '📊 Resultado de la verificación:';
    RAISE NOTICE '  - Total de rental_owners: %', total_owners;
    RAISE NOTICE '  - Rental_owners con characteristic_id: % (%.%% )', 
        owners_with_id,
        ROUND((owners_with_id::NUMERIC / NULLIF(total_owners, 0)) * 100, 1);
    RAISE NOTICE '  - Rental_owners sin characteristic_id: % (%.%% )', 
        owners_without_id,
        ROUND((owners_without_id::NUMERIC / NULLIF(total_owners, 0)) * 100, 1);
    
    IF owners_without_id = 0 THEN
        RAISE NOTICE '  ✅ ÉXITO: Todos los rental_owners tienen characteristic_id asignado';
    ELSE
        RAISE WARNING '  ⚠️  ATENCIÓN: Hay % rental_owners sin characteristic_id. Revise manualmente.', owners_without_id;
    END IF;
    
    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- OPTIONAL: Display rental_owners that still don't have ID
-- =====================================================

DO $$
DECLARE
    r RECORD;
    count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT 
            id, 
            first_name, 
            paternal_last_name,
            property_id
        FROM public.rental_owners
        WHERE rental_owner_characteristic_id IS NULL
           OR rental_owner_characteristic_id = ''
        LIMIT 10
    LOOP
        IF count = 0 THEN
            RAISE NOTICE '';
            RAISE NOTICE '⚠️  RENTAL_OWNERS SIN CHARACTERISTIC_ID (primeras 10):';
            RAISE NOTICE '========================================================';
        END IF;
        
        count := count + 1;
        RAISE NOTICE '  % - ID: %, Nombre: % %, Property ID: %',
            count,
            r.id,
            COALESCE(r.first_name, 'Sin nombre'),
            COALESCE(r.paternal_last_name, 'Sin apellido'),
            COALESCE(r.property_id::text, 'Sin propiedad');
    END LOOP;
    
    IF count > 0 THEN
        RAISE NOTICE '========================================================';
    END IF;
END $$;

-- =====================================================
-- ENSURE TRIGGER IS WORKING FOR FUTURE INSERTS
-- =====================================================

-- Recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS trigger_generate_rental_owner_characteristic_id ON rental_owners;

CREATE TRIGGER trigger_generate_rental_owner_characteristic_id
  BEFORE INSERT ON rental_owners
  FOR EACH ROW
  EXECUTE FUNCTION generate_rental_owner_characteristic_id();

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger para auto-generación de IDs verificado/recreado';
    RAISE NOTICE '   Los nuevos rental_owners se crearán automáticamente con characteristic_id';
END $$;







