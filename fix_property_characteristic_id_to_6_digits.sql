-- =====================================================
-- FIX PROPERTY CHARACTERISTIC ID TO 6 DIGITS
-- Apply migration to change format to PROP_xxxxxx
-- =====================================================
-- This script changes the property_characteristic_id format from
-- PROP_timestamp_id to PROP_xxxxxx (6 digits) as requested
-- for better identification and contract generation purposes.
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

            RAISE NOTICE '  ✅ Actualizado: % → % (Dirección: % %)',
                property_record.property_characteristic_id,
                new_characteristic_id,
                COALESCE(property_record.address_street, 'Sin calle'),
                COALESCE(property_record.address_number, 'Sin número');
        END LOOP;

    ELSE
        RAISE NOTICE 'ℹ️  No se encontraron IDs con formato PROP_ para actualizar';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ ACTUALIZACIÓN COMPLETADA';
    RAISE NOTICE '📊 Total properties: %, Actualizados: %', total_properties, updated_properties;
END $$;

-- =====================================================
-- STEP 5: RECREATE TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS trigger_generate_property_characteristic_id ON properties;

CREATE TRIGGER trigger_generate_property_characteristic_id
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION generate_property_characteristic_id();

DO $$
BEGIN
    RAISE NOTICE '✅ Trigger recreado para formato PROP_xxxxxx';
END $$;

-- =====================================================
-- STEP 6: FINAL VERIFICATION
-- =====================================================

DO $$
DECLARE
    total_properties INTEGER;
    properties_with_correct_format INTEGER;
    properties_with_incorrect_format INTEGER;
BEGIN
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

    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL:';
    RAISE NOTICE '  Total properties: %', total_properties;
    RAISE NOTICE '  Formato correcto (PROP_xxxxxx): %', properties_with_correct_format;
    RAISE NOTICE '  Formato incorrecto: %', properties_with_incorrect_format;

    IF properties_with_incorrect_format = 0 THEN
        RAISE NOTICE '✅ ÉXITO: Todos los IDs tienen formato PROP_xxxxxx';
    ELSE
        RAISE WARNING '⚠️  % properties tienen formato incorrecto', properties_with_incorrect_format;
    END IF;
END $$;
