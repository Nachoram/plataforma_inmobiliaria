-- =====================================================
-- MIGRATION: Fix rental_owner_characteristic_id format to 6 digits
-- Change format from RENTAL_OWNER_XXXXXXX to RENTAL_OWNER_xxxxxx
-- Date: 2025-10-29
-- =====================================================
-- This migration changes the rental_owner_characteristic_id format from
-- 7 digits to 6 digits as requested. The ID will be TEXT and used for
-- searching rental owners to generate contracts.
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 INICIANDO CAMBIO DE FORMATO DE RENTAL_OWNER_CHARACTERISTIC_ID...';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Cambio: RENTAL_OWNER_XXXXXXX → RENTAL_OWNER_xxxxxx (6 dígitos)';
    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- STEP 1: VERIFY COLUMN TYPE IS TEXT
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rental_owners'
        AND column_name = 'rental_owner_characteristic_id'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE '✅ Columna rental_owner_characteristic_id ya es de tipo TEXT';
    ELSE
        RAISE NOTICE '⚠️  Cambiando columna rental_owner_characteristic_id a tipo TEXT';
        ALTER TABLE rental_owners ALTER COLUMN rental_owner_characteristic_id TYPE TEXT;
        RAISE NOTICE '✅ Columna rental_owner_characteristic_id cambiada a TEXT';
    END IF;
END $$;

-- =====================================================
-- STEP 2: UPDATE THE GENERATOR FUNCTION TO USE 6 DIGITS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_rental_owner_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
  new_characteristic_id TEXT;
BEGIN
  -- Solo generar si el campo está vacío o es null
  IF NEW.rental_owner_characteristic_id IS NULL OR NEW.rental_owner_characteristic_id = '' THEN

    -- Obtener el siguiente número de la secuencia
    next_id := nextval('rental_owner_characteristic_id_seq');

    -- Generar el ID con formato RENTAL_OWNER_xxxxxx (6 dígitos con padding de ceros)
    new_characteristic_id := 'RENTAL_OWNER_' || LPAD(next_id::TEXT, 6, '0');

    -- Asignar el nuevo ID al registro
    NEW.rental_owner_characteristic_id := new_characteristic_id;

    -- Log para debugging (visible en logs de Supabase)
    RAISE NOTICE 'Generated rental_owner_characteristic_id: %', new_characteristic_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function comment
COMMENT ON FUNCTION generate_rental_owner_characteristic_id() IS
  'Genera automáticamente un rental_owner_characteristic_id único con formato RENTAL_OWNER_xxxxxx (6 dígitos)';

DO $$
BEGIN
    RAISE NOTICE '✅ Función generate_rental_owner_characteristic_id() actualizada para usar 6 dígitos';
END $$;

-- =====================================================
-- STEP 3: UPDATE EXISTING IDs TO NEW FORMAT
-- =====================================================

DO $$
DECLARE
    rental_owner_record RECORD;
    next_id INTEGER;
    new_characteristic_id TEXT;
    total_owners INTEGER := 0;
    updated_owners INTEGER := 0;
    sequence_reset_needed BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 ACTUALIZANDO IDs EXISTENTES AL FORMATO DE 6 DÍGITOS...';
    RAISE NOTICE '========================================================';

    -- Count total rental_owners
    SELECT COUNT(*) INTO total_owners FROM public.rental_owners;
    RAISE NOTICE '📊 Total de rental_owners en la base de datos: %', total_owners;

    -- Check if any IDs are in the old 7-digit format
    IF EXISTS (
        SELECT 1 FROM public.rental_owners
        WHERE rental_owner_characteristic_id LIKE 'RENTAL_OWNER________'  -- 7 digits after underscore
    ) THEN
        RAISE NOTICE '🔍 Encontrados IDs con formato de 7 dígitos. Actualizando...';

        -- Reset sequence to avoid conflicts
        -- Get the highest existing number and add some buffer
        SELECT COALESCE(MAX(CAST(SUBSTRING(rental_owner_characteristic_id FROM 'RENTAL_OWNER_([0-9]+)') AS INTEGER)), 0) + 1000
        INTO next_id
        FROM public.rental_owners
        WHERE rental_owner_characteristic_id ~ '^RENTAL_OWNER_[0-9]+$';

        -- Reset sequence
        PERFORM setval('rental_owner_characteristic_id_seq', next_id, false);
        RAISE NOTICE '🔢 Secuencia rental_owner_characteristic_id_seq reiniciada a: %', next_id;

        -- Update all existing IDs to 6-digit format
        FOR rental_owner_record IN
            SELECT
                id,
                rental_owner_characteristic_id,
                first_name,
                paternal_last_name,
                property_id
            FROM public.rental_owners
            WHERE rental_owner_characteristic_id LIKE 'RENTAL_OWNER_%'
            ORDER BY created_at ASC
        LOOP
            -- Extract the number part and reformat to 6 digits
            next_id := nextval('rental_owner_characteristic_id_seq');
            new_characteristic_id := 'RENTAL_OWNER_' || LPAD(next_id::TEXT, 6, '0');

            -- Update the rental_owner with the new characteristic_id
            UPDATE public.rental_owners
            SET rental_owner_characteristic_id = new_characteristic_id
            WHERE id = rental_owner_record.id;

            updated_owners := updated_owners + 1;

            IF updated_owners <= 10 THEN  -- Show first 10 updates
                RAISE NOTICE '  ✅ ID actualizado: % → % (Nombre: % %)',
                    rental_owner_record.rental_owner_characteristic_id,
                    new_characteristic_id,
                    COALESCE(rental_owner_record.first_name, 'Sin nombre'),
                    COALESCE(rental_owner_record.paternal_last_name, 'Sin apellido');
            END IF;
        END LOOP;

        IF updated_owners > 10 THEN
            RAISE NOTICE '  ... y % IDs más actualizados', (updated_owners - 10);
        END IF;

    ELSE
        RAISE NOTICE 'ℹ️  No se encontraron IDs con formato de 7 dígitos para actualizar';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ ACTUALIZACIÓN DE IDs COMPLETADA';
    RAISE NOTICE '📊 Estadísticas:';
    RAISE NOTICE '  - Total de rental_owners: %', total_owners;
    RAISE NOTICE '  - IDs actualizados al formato de 6 dígitos: %', updated_owners;

    IF updated_owners > 0 THEN
        RAISE NOTICE '  ✅ Todos los IDs han sido actualizados exitosamente al formato RENTAL_OWNER_xxxxxx';
    ELSE
        RAISE NOTICE '  ℹ️  No se requirieron actualizaciones - los IDs ya están en el formato correcto';
    END IF;

    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- STEP 4: RECREATE TRIGGER TO ENSURE IT WORKS
-- =====================================================

-- Recreate the trigger to ensure it's working with the updated function
DROP TRIGGER IF EXISTS trigger_generate_rental_owner_characteristic_id ON rental_owners;

CREATE TRIGGER trigger_generate_rental_owner_characteristic_id
  BEFORE INSERT ON rental_owners
  FOR EACH ROW
  EXECUTE FUNCTION generate_rental_owner_characteristic_id();

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger para auto-generación de IDs recreado';
    RAISE NOTICE '   Los nuevos rental_owners se crearán automáticamente con formato RENTAL_OWNER_xxxxxx';
END $$;

-- =====================================================
-- STEP 5: FINAL VERIFICATION
-- =====================================================

DO $$
DECLARE
    total_owners INTEGER;
    owners_with_correct_format INTEGER;
    owners_with_incorrect_format INTEGER;
    sample_ids TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL DEL FORMATO DE IDs';
    RAISE NOTICE '========================================================';

    -- Count statistics
    SELECT COUNT(*) INTO total_owners FROM public.rental_owners;

    SELECT COUNT(*) INTO owners_with_correct_format
    FROM public.rental_owners
    WHERE rental_owner_characteristic_id ~ '^RENTAL_OWNER_[0-9]{6}$'
      AND rental_owner_characteristic_id IS NOT NULL;

    SELECT COUNT(*) INTO owners_with_incorrect_format
    FROM public.rental_owners
    WHERE rental_owner_characteristic_id IS NULL
       OR rental_owner_characteristic_id = ''
       OR (rental_owner_characteristic_id LIKE 'RENTAL_OWNER_%' AND rental_owner_characteristic_id !~ '^RENTAL_OWNER_[0-9]{6}$');

    -- Show results
    RAISE NOTICE '📊 Resultados de verificación:';
    RAISE NOTICE '  - Total de rental_owners: %', total_owners;
    RAISE NOTICE '  - IDs con formato correcto (RENTAL_OWNER_xxxxxx): % (%.1f%%)',
        owners_with_correct_format,
        CASE WHEN total_owners > 0 THEN (owners_with_correct_format::NUMERIC / total_owners) * 100 ELSE 0 END;
    RAISE NOTICE '  - IDs con formato incorrecto: % (%.1f%%)',
        owners_with_incorrect_format,
        CASE WHEN total_owners > 0 THEN (owners_with_incorrect_format::NUMERIC / total_owners) * 100 ELSE 0 END;

    -- Show sample of correct IDs
    IF owners_with_correct_format > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 Ejemplos de IDs con formato correcto:';

        FOR i IN 1..LEAST(5, owners_with_correct_format) LOOP
            RAISE NOTICE '   %', (
                SELECT rental_owner_characteristic_id
                FROM public.rental_owners
                WHERE rental_owner_characteristic_id ~ '^RENTAL_OWNER_[0-9]{6}$'
                ORDER BY created_at DESC
                LIMIT 1 OFFSET (i-1)
            );
        END LOOP;
    END IF;

    -- Final status
    IF owners_with_incorrect_format = 0 AND owners_with_correct_format = total_owners THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ ÉXITO: Todos los rental_owner_characteristic_id tienen el formato correcto RENTAL_OWNER_xxxxxx';
        RAISE NOTICE '🎯 El formato está optimizado para búsqueda de arrendatarios en generación de contratos';
    ELSIF owners_with_incorrect_format > 0 THEN
        RAISE WARNING '';
        RAISE WARNING '⚠️  ATENCIÓN: % rental_owners tienen IDs con formato incorrecto', owners_with_incorrect_format;
        RAISE WARNING '   Revisar manualmente los registros que no cumplen con RENTAL_OWNER_xxxxxx';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'ℹ️  Estado: Algunos rental_owners no tienen characteristic_id asignado';
    END IF;

    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '📋 Nuevo formato: RENTAL_OWNER_xxxxxx (6 dígitos)';
    RAISE NOTICE '🔢 Tipo de dato: TEXT';
    RAISE NOTICE '🎯 Función: Búsqueda de arrendatarios para generación de contratos';
    RAISE NOTICE '🔄 Trigger activo: Generación automática en nuevos inserts';
END $$;
