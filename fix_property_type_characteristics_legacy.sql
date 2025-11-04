-- =====================================================
-- FIX: Actualizar propiedades legacy sin property_type_characteristics_id
-- Fecha: 2025-11-03
-- Descripción: Script para poblar property_type_characteristics_id en propiedades existentes
-- =====================================================

DO $$
DECLARE
    property_record RECORD;
    characteristics_id UUID;
    total_properties INTEGER := 0;
    updated_properties INTEGER := 0;
    missing_properties INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 INICIANDO ACTUALIZACIÓN DE PROPIEDADES LEGACY...';
    RAISE NOTICE '========================================================';

    -- Count total properties
    SELECT COUNT(*) INTO total_properties FROM public.properties;
    RAISE NOTICE '📊 Total de propiedades en la base de datos: %', total_properties;

    -- Count properties without UUID
    SELECT COUNT(*) INTO missing_properties
    FROM public.properties
    WHERE property_type_characteristics_id IS NULL
    AND tipo_propiedad IS NOT NULL;

    RAISE NOTICE '⚠️  Propiedades sin UUID pero con tipo_propiedad: %', missing_properties;
    RAISE NOTICE '';

    -- If there are no properties to update, exit early
    IF missing_properties = 0 THEN
        RAISE NOTICE '✅ No hay propiedades que requieran actualización';
        RAISE NOTICE '========================================================';
        RETURN;
    END IF;

    RAISE NOTICE '🔍 Actualizando propiedades...';
    RAISE NOTICE '';

    -- Iterate through all properties without UUID
    FOR property_record IN
        SELECT id, tipo_propiedad, address_street, address_number
        FROM public.properties
        WHERE property_type_characteristics_id IS NULL
        AND tipo_propiedad IS NOT NULL
    LOOP
        -- Get the UUID for this property type
        SELECT id INTO characteristics_id
        FROM public.property_type_characteristics
        WHERE name = property_record.tipo_propiedad::text
        LIMIT 1;

        IF characteristics_id IS NOT NULL THEN
            -- Update the property with the UUID
            UPDATE public.properties
            SET property_type_characteristics_id = characteristics_id
            WHERE id = property_record.id;

            updated_properties := updated_properties + 1;

            RAISE NOTICE '  ✅ Propiedad actualizada: % % (%, tipo: %, UUID: %)',
                property_record.address_street,
                property_record.address_number,
                property_record.id,
                property_record.tipo_propiedad,
                characteristics_id;
        ELSE
            RAISE NOTICE '  ❌ ERROR: No se encontró UUID para tipo "%". Propiedad ID: %',
                property_record.tipo_propiedad,
                property_record.id;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ ACTUALIZACIÓN COMPLETADA';
    RAISE NOTICE '📊 Estadísticas finales:';
    RAISE NOTICE '  - Total de propiedades: %', total_properties;
    RAISE NOTICE '  - Propiedades actualizadas: %', updated_properties;
    RAISE NOTICE '  - Propiedades que requerían actualización: %', missing_properties;

    IF updated_properties = missing_properties THEN
        RAISE NOTICE '  ✅ Todas las propiedades fueron actualizadas exitosamente';
    ELSE
        RAISE WARNING '  ⚠️  Algunas propiedades no pudieron ser actualizadas. Revise los logs anteriores.';
    END IF;

    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Check if all properties now have the UUID populated

DO $$
DECLARE
    properties_with_uuid INTEGER;
    properties_without_uuid INTEGER;
    total_properties INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL...';
    RAISE NOTICE '========================================================';

    SELECT COUNT(*) INTO total_properties FROM public.properties;
    SELECT COUNT(*) INTO properties_with_uuid
    FROM public.properties
    WHERE property_type_characteristics_id IS NOT NULL;

    SELECT COUNT(*) INTO properties_without_uuid
    FROM public.properties
    WHERE property_type_characteristics_id IS NULL;

    RAISE NOTICE '📊 Resultado de la verificación:';
    RAISE NOTICE '  - Total de propiedades: %', total_properties;
    RAISE NOTICE '  - Propiedades con UUID: % (%.%% )',
        properties_with_uuid,
        ROUND((properties_with_uuid::NUMERIC / NULLIF(total_properties, 0)) * 100, 1);
    RAISE NOTICE '  - Propiedades sin UUID: % (%.%% )',
        properties_without_uuid,
        ROUND((properties_without_uuid::NUMERIC / NULLIF(total_properties, 0)) * 100, 1);

    IF properties_without_uuid = 0 THEN
        RAISE NOTICE '  ✅ ÉXITO: Todas las propiedades tienen UUID asignado';
    ELSE
        RAISE WARNING '  ⚠️  ATENCIÓN: Hay % propiedades sin UUID. Revise manualmente.', properties_without_uuid;
    END IF;

    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- OPTIONAL: Display properties that still don't have UUID
-- =====================================================

DO $$
DECLARE
    r RECORD;
    count INTEGER := 0;
BEGIN
    FOR r IN
        SELECT id, address_street, address_number, tipo_propiedad
        FROM public.properties
        WHERE property_type_characteristics_id IS NULL
        LIMIT 10
    LOOP
        IF count = 0 THEN
            RAISE NOTICE '';
            RAISE NOTICE '⚠️  PROPIEDADES SIN UUID (primeras 10):';
            RAISE NOTICE '========================================================';
        END IF;

        count := count + 1;
        RAISE NOTICE '  % - ID: %, Dirección: % %, Tipo: %',
            count,
            r.id,
            COALESCE(r.address_street, 'Sin calle'),
            COALESCE(r.address_number, 'S/N'),
            COALESCE(r.tipo_propiedad::text, 'Sin tipo');
    END LOOP;

    IF count > 0 THEN
        RAISE NOTICE '========================================================';
        RAISE NOTICE '💡 Para actualizar manualmente estas propiedades:';
        RAISE NOTICE '   UPDATE public.properties SET property_type_characteristics_id = ';
        RAISE NOTICE '   (SELECT id FROM public.property_type_characteristics WHERE name = ''[TIPO]'')';
        RAISE NOTICE '   WHERE id = ''[PROPERTY_ID]'';';
    END IF;
END $$;
