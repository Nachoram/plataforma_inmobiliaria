-- =====================================================
-- FIX RENTAL OWNER CHARACTERISTIC ID TO 6 DIGITS
-- Apply migration to change format to RENTAL_OWNER_xxxxxx
-- =====================================================
-- This script changes the rental_owner_characteristic_id format from
-- 7 digits to 6 digits as requested for better identification
-- and contract generation purposes.
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

        -- Get the highest existing number and add buffer
        SELECT COALESCE(MAX(CAST(SUBSTRING(rental_owner_characteristic_id FROM 'RENTAL_OWNER_([0-9]+)') AS INTEGER)), 0) + 1000
        INTO next_id
        FROM public.rental_owners
        WHERE rental_owner_characteristic_id ~ '^RENTAL_OWNER_[0-9]+$';

        -- Reset sequence to avoid conflicts
        PERFORM setval('rental_owner_characteristic_id_seq', next_id, false);
        RAISE NOTICE '🔢 Secuencia rental_owner_characteristic_id_seq reiniciada a: %', next_id;

        -- Update all existing IDs to 6-digit format
        FOR rental_owner_record IN
            SELECT
                id,
                rental_owner_characteristic_id,
                first_name,
                paternal_last_name
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

            RAISE NOTICE '  ✅ Actualizado: % → % (Nombre: % %)',
                rental_owner_record.rental_owner_characteristic_id,
                new_characteristic_id,
                COALESCE(rental_owner_record.first_name, 'Sin nombre'),
                COALESCE(rental_owner_record.paternal_last_name, 'Sin apellido');
        END LOOP;

    ELSE
        RAISE NOTICE 'ℹ️  No se encontraron IDs con formato de 7 dígitos para actualizar';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ ACTUALIZACIÓN COMPLETADA';
    RAISE NOTICE '📊 Total rental_owners: %, Actualizados: %', total_owners, updated_owners;
END $$;

-- =====================================================
-- STEP 4: RECREATE TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS trigger_generate_rental_owner_characteristic_id ON rental_owners;

CREATE TRIGGER trigger_generate_rental_owner_characteristic_id
  BEFORE INSERT ON rental_owners
  FOR EACH ROW
  EXECUTE FUNCTION generate_rental_owner_characteristic_id();

DO $$
BEGIN
    RAISE NOTICE '✅ Trigger recreado para formato de 6 dígitos';
END $$;

-- =====================================================
-- STEP 5: FINAL VERIFICATION
-- =====================================================

DO $$
DECLARE
    total_owners INTEGER;
    owners_with_correct_format INTEGER;
    owners_with_incorrect_format INTEGER;
BEGIN
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

    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL:';
    RAISE NOTICE '  Total rental_owners: %', total_owners;
    RAISE NOTICE '  Formato correcto (RENTAL_OWNER_xxxxxx): %', owners_with_correct_format;
    RAISE NOTICE '  Formato incorrecto: %', owners_with_incorrect_format;

    IF owners_with_incorrect_format = 0 THEN
        RAISE NOTICE '✅ ÉXITO: Todos los IDs tienen formato RENTAL_OWNER_xxxxxx';
    ELSE
        RAISE WARNING '⚠️  % IDs tienen formato incorrecto', owners_with_incorrect_format;
    END IF;
END $$;
