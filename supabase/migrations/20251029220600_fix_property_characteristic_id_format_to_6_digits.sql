-- =====================================================
-- MIGRATION: Fix property_characteristic_id format to 6 digits
-- Change format from PROP_timestamp_id to PROP_xxxxxx
-- Date: 2025-10-29
-- =====================================================
-- This migration changes the property_characteristic_id format from
-- PROP_timestamp_id to PROP_xxxxxx (6 digits) as requested.
-- The ID will be TEXT and used for searching properties to generate contracts.
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 INICIANDO CAMBIO DE FORMATO DE PROPERTY_CHARACTERISTIC_ID...';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Cambio: PROP_timestamp_id → PROP_xxxxxx (6 dígitos)';
    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- STEP 1: VERIFY COLUMN TYPE IS TEXT
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'property_characteristic_id'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE '✅ Columna property_characteristic_id ya es de tipo TEXT';
    ELSE
        RAISE NOTICE '⚠️  Cambiando columna property_characteristic_id a tipo TEXT';
        ALTER TABLE properties ALTER COLUMN property_characteristic_id TYPE TEXT;
        RAISE NOTICE '✅ Columna property_characteristic_id cambiada a TEXT';
    END IF;
END $$;

-- =====================================================
-- STEP 2: UPDATE THE GENERATOR FUNCTION TO USE PROP_xxxxxx FORMAT
-- =====================================================

-- First, let's see what the current function looks like
DO $$
DECLARE
    func_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'generate_property_characteristic_id'
    ) INTO func_exists;

    IF func_exists THEN
        RAISE NOTICE '📝 Función generate_property_characteristic_id existe. Actualizándola...';
    ELSE
        RAISE NOTICE '📝 Función generate_property_characteristic_id no existe. Creándola...';
    END IF;
END $$;

-- Create or replace the property characteristic ID generator function
CREATE OR REPLACE FUNCTION generate_property_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
  new_characteristic_id TEXT;
BEGIN
  -- Solo generar si el campo está vacío o es null
  IF NEW.property_characteristic_id IS NULL OR NEW.property_characteristic_id = '' THEN

    -- Obtener el siguiente número de la secuencia
    next_id := nextval('property_characteristic_id_seq');

    -- Generar el ID con formato PROP_xxxxxx (6 dígitos con padding de ceros)
    new_characteristic_id := 'PROP_' || LPAD(next_id::TEXT, 6, '0');

    -- Asignar el nuevo ID al registro
    NEW.property_characteristic_id := new_characteristic_id;

    -- Log para debugging (visible en logs de Supabase)
    RAISE NOTICE 'Generated property_characteristic_id: %', new_characteristic_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function comment
COMMENT ON FUNCTION generate_property_characteristic_id() IS
  'Genera automáticamente un property_characteristic_id único con formato PROP_xxxxxx (6 dígitos)';

DO $$
BEGIN
    RAISE NOTICE '✅ Función generate_property_characteristic_id() actualizada para usar formato PROP_xxxxxx';
END $$;

-- =====================================================
-- STEP 3: CREATE SEQUENCE IF NOT EXISTS
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS property_characteristic_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE property_characteristic_id_seq IS
  'Secuencia para generar IDs únicos de property_characteristic_id';

DO $$
BEGIN
    RAISE NOTICE '✅ Secuencia property_characteristic_id_seq creada o ya existe';
END $$;

-- =====================================================
-- STEP 4: UPDATE EXISTING IDs TO NEW FORMAT
-- =====================================================

DO $$
DECLARE
    property_record RECORD;
    next_id INTEGER;
    new_characteristic_id TEXT;
    total_properties INTEGER := 0;
    updated_properties INTEGER := 0;
    sequence_reset_needed BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 ACTUALIZANDO IDs EXISTENTES AL FORMATO PROP_xxxxxx...';
    RAISE NOTICE '========================================================';

    -- Count total properties
    SELECT COUNT(*) INTO total_properties FROM public.properties;
    RAISE NOTICE '📊 Total de properties en la base de datos: %', total_properties;

    -- Check if any IDs are in the old timestamp format
    IF EXISTS (
        SELECT 1 FROM public.properties
        WHERE property_characteristic_id LIKE 'PROP_%'
    ) THEN
        RAISE NOTICE '🔍 Encontrados IDs con formato antiguo. Actualizando...';

        -- Get the highest existing number and add buffer
        SELECT COALESCE(MAX(CAST(SUBSTRING(property_characteristic_id FROM 'PROP_([0-9]+)') AS INTEGER)), 0) + 1000
        INTO next_id
        FROM public.properties
        WHERE property_characteristic_id ~ '^PROP_[0-9]+$';

        -- Reset sequence to avoid conflicts
        PERFORM setval('property_characteristic_id_seq', next_id, false);
        RAISE NOTICE '🔢 Secuencia property_characteristic_id_seq reiniciada a: %', next_id;

        -- Update all existing IDs to PROP_xxxxxx format
        FOR property_record IN
            SELECT
                id,
                property_characteristic_id,
                address_street,
                address_number
            FROM public.properties
            WHERE property_characteristic_id LIKE 'PROP_%'
            ORDER BY created_at ASC
        LOOP
            -- Extract the number part and reformat to 6 digits
            next_id := nextval('property_characteristic_id_seq');
            new_characteristic_id := 'PROP_' || LPAD(next_id::TEXT, 6, '0');

            -- Update the property with the new characteristic_id
            UPDATE public.properties
            SET property_characteristic_id = new_characteristic_id
            WHERE id = property_record.id;

            updated_properties := updated_properties + 1;

            IF updated_properties <= 10 THEN  -- Show first 10 updates
                RAISE NOTICE '  ✅ ID actualizado: % → % (Dirección: % %)',
                    property_record.property_characteristic_id,
                    new_characteristic_id,
                    COALESCE(property_record.address_street, 'Sin calle'),
                    COALESCE(property_record.address_number, 'Sin número');
            END IF;
        END LOOP;

        IF updated_properties > 10 THEN
            RAISE NOTICE '  ... y % IDs más actualizados', (updated_properties - 10);
        END IF;

    ELSE
        RAISE NOTICE 'ℹ️  No se encontraron IDs con formato PROP_ para actualizar';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ ACTUALIZACIÓN DE IDs COMPLETADA';
    RAISE NOTICE '📊 Estadísticas:';
    RAISE NOTICE '  - Total de properties: %', total_properties;
    RAISE NOTICE '  - IDs actualizados al formato PROP_xxxxxx: %', updated_properties;

    IF updated_properties > 0 THEN
        RAISE NOTICE '  ✅ Todos los IDs han sido actualizados exitosamente al formato PROP_xxxxxx';
    ELSE
        RAISE NOTICE '  ℹ️  No se requirieron actualizaciones - los IDs ya están en el formato correcto';
    END IF;

    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- STEP 5: RECREATE TRIGGER TO ENSURE IT WORKS
-- =====================================================

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS trigger_generate_property_characteristic_id ON properties;

-- Create the new trigger
CREATE TRIGGER trigger_generate_property_characteristic_id
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION generate_property_characteristic_id();

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger para auto-generación de property_characteristic_id recreado';
    RAISE NOTICE '   Las nuevas properties se crearán automáticamente con formato PROP_xxxxxx';
END $$;

-- =====================================================
-- STEP 6: FINAL VERIFICATION
-- =====================================================

DO $$
DECLARE
    total_properties INTEGER;
    properties_with_correct_format INTEGER;
    properties_with_incorrect_format INTEGER;
    sample_ids TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL DEL FORMATO DE PROPERTY_CHARACTERISTIC_ID';
    RAISE NOTICE '========================================================';

    -- Count statistics
    SELECT COUNT(*) INTO total_properties FROM public.properties;

    SELECT COUNT(*) INTO properties_with_correct_format
    FROM public.properties
    WHERE property_characteristic_id ~ '^PROP_[0-9]{6}$'
      AND property_characteristic_id IS NOT NULL;

    SELECT COUNT(*) INTO properties_with_incorrect_format
    FROM public.properties
    WHERE property_characteristic_id IS NULL
       OR property_characteristic_id = ''
       OR (property_characteristic_id LIKE 'PROP_%' AND property_characteristic_id !~ '^PROP_[0-9]{6}$');

    -- Show results
    RAISE NOTICE '📊 Resultados de verificación:';
    RAISE NOTICE '  - Total de properties: %', total_properties;
    RAISE NOTICE '  - IDs con formato correcto (PROP_xxxxxx): % (%.1f%%)',
        properties_with_correct_format,
        CASE WHEN total_properties > 0 THEN (properties_with_correct_format::NUMERIC / total_properties) * 100 ELSE 0 END;
    RAISE NOTICE '  - IDs con formato incorrecto: % (%.1f%%)',
        properties_with_incorrect_format,
        CASE WHEN total_properties > 0 THEN (properties_with_incorrect_format::NUMERIC / total_properties) * 100 ELSE 0 END;

    -- Show sample of correct IDs
    IF properties_with_correct_format > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 EJEMPLOS DE IDs CON FORMATO CORRECTO:';
        RAISE NOTICE '========================================================';

        FOR i IN 1..LEAST(5, properties_with_correct_format) LOOP
            RAISE NOTICE '   %', (
                SELECT property_characteristic_id
                FROM public.properties
                WHERE property_characteristic_id ~ '^PROP_[0-9]{6}$'
                ORDER BY created_at DESC
                LIMIT 1 OFFSET (i-1)
            );
        END LOOP;
    END IF;

    -- Final status
    IF properties_with_incorrect_format = 0 AND properties_with_correct_format = total_properties THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ ÉXITO: Todos los property_characteristic_id tienen el formato correcto PROP_xxxxxx';
        RAISE NOTICE '🎯 Los IDs están optimizados para búsqueda de propiedades en generación de contratos';
    ELSIF properties_with_incorrect_format > 0 THEN
        RAISE WARNING '';
        RAISE WARNING '⚠️  ATENCIÓN: % properties tienen IDs con formato incorrecto', properties_with_incorrect_format;
        RAISE WARNING '   Revisar manualmente los registros que no cumplen con PROP_xxxxxx';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'ℹ️  Estado: Algunas properties no tienen characteristic_id asignado';
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
    RAISE NOTICE '📋 Nuevo formato: PROP_xxxxxx (6 dígitos)';
    RAISE NOTICE '🔢 Tipo de dato: TEXT';
    RAISE NOTICE '🎯 Función: Búsqueda de propiedades para generación de contratos';
    RAISE NOTICE '🔄 Trigger activo: Generación automática en nuevos inserts';
END $$;
