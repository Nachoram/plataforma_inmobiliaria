-- =====================================================
-- MIGRATION: Fix property_type_characteristics_id for failing application
-- Date: 2025-11-03
-- Application ID: 07bb963d-a4bf-4dd9-a1b6-fa92b755a62e
-- =====================================================
-- This migration specifically targets the property causing contract generation failure
-- by ensuring it has a valid property_type_characteristics_id

DO $$
DECLARE
    application_id UUID := '07bb963d-a4bf-4dd9-a1b6-fa92b755a62e';
    property_record RECORD;
    characteristics_id UUID;
    property_type_name TEXT;
BEGIN
    RAISE NOTICE '🔍 BUSCANDO PROPIEDAD PARA APLICACIÓN: %', application_id;
    RAISE NOTICE '========================================================';

    -- Find the property associated with this application
    SELECT p.id, p.tipo_propiedad, p.property_type_characteristics_id,
           p.address_street, p.address_number
    INTO property_record
    FROM public.applications a
    JOIN public.properties p ON a.property_id = p.id
    WHERE a.id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '❌ No se encontró la propiedad para la aplicación ID: %', application_id;
    END IF;

    RAISE NOTICE '📋 Información de la propiedad:';
    RAISE NOTICE '  - ID: %', property_record.id;
    RAISE NOTICE '  - Dirección: % %', property_record.address_street, property_record.address_number;
    RAISE NOTICE '  - Tipo propiedad (legacy): %', property_record.tipo_propiedad;
    RAISE NOTICE '  - UUID actual: %', property_record.property_type_characteristics_id;
    RAISE NOTICE '';

    -- Check if it already has a UUID
    IF property_record.property_type_characteristics_id IS NOT NULL THEN
        RAISE NOTICE '✅ La propiedad ya tiene UUID asignado: %', property_record.property_type_characteristics_id;

        -- Verify the UUID exists in property_type_characteristics
        SELECT id INTO characteristics_id
        FROM public.property_type_characteristics
        WHERE id = property_record.property_type_characteristics_id;

        IF FOUND THEN
            RAISE NOTICE '✅ El UUID existe en property_type_characteristics';
            RAISE NOTICE '========================================================';
            RETURN;
        ELSE
            RAISE WARNING '⚠️  El UUID asignado no existe en property_type_characteristics. Se intentará corregir.';
        END IF;
    END IF;

    -- Try to get the property type name
    IF property_record.tipo_propiedad IS NOT NULL THEN
        property_type_name := property_record.tipo_propiedad::text;
    ELSE
        -- Try to infer from other fields or get from related tables
        RAISE WARNING '⚠️  La propiedad no tiene tipo_propiedad definido. Intentando otros métodos...';

        -- Check if there's a relationship in rental_owners or other tables
        SELECT ptc.name INTO property_type_name
        FROM public.rental_owners ro
        JOIN public.property_type_characteristics ptc ON ro.rental_owner_characteristic_id = ptc.id
        WHERE ro.property_id = property_record.id
        LIMIT 1;

        IF NOT FOUND THEN
            RAISE EXCEPTION '❌ No se pudo determinar el tipo de propiedad para la propiedad ID: %', property_record.id;
        END IF;
    END IF;

    RAISE NOTICE '🔍 Buscando UUID para tipo de propiedad: "%"', property_type_name;

    -- Find the corresponding UUID in property_type_characteristics
    SELECT id INTO characteristics_id
    FROM public.property_type_characteristics
    WHERE name = property_type_name
    LIMIT 1;

    IF characteristics_id IS NULL THEN
        RAISE EXCEPTION '❌ No se encontró UUID para el tipo de propiedad "%" en property_type_characteristics', property_type_name;
    END IF;

    RAISE NOTICE '✅ UUID encontrado: %', characteristics_id;

    -- Update the property
    UPDATE public.properties
    SET property_type_characteristics_id = characteristics_id
    WHERE id = property_record.id;

    RAISE NOTICE '✅ Propiedad actualizada exitosamente';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '🎯 FIX COMPLETADO PARA APLICACIÓN: %', application_id;
    RAISE NOTICE '  - Propiedad ID: %', property_record.id;
    RAISE NOTICE '  - Tipo propiedad: %', property_type_name;
    RAISE NOTICE '  - UUID asignado: %', characteristics_id;
    RAISE NOTICE '========================================================';

END $$;

-- =====================================================
-- VERIFICATION: Check that the fix worked
-- =====================================================

DO $$
DECLARE
    application_id UUID := '07bb963d-a4bf-4dd9-a1b6-fa92b755a62e';
    property_data RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN DEL FIX...';
    RAISE NOTICE '========================================================';

    -- Check the property data
    SELECT p.id, p.property_type_characteristics_id, ptc.name as property_type_name
    INTO property_data
    FROM public.applications a
    JOIN public.properties p ON a.property_id = p.id
    LEFT JOIN public.property_type_characteristics ptc ON p.property_type_characteristics_id = ptc.id
    WHERE a.id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '❌ No se pudo verificar la propiedad';
    END IF;

    RAISE NOTICE '📊 Estado después del fix:';
    RAISE NOTICE '  - Propiedad ID: %', property_data.id;
    RAISE NOTICE '  - UUID: %', property_data.property_type_characteristics_id;
    RAISE NOTICE '  - Tipo propiedad: %', COALESCE(property_data.property_type_name, 'DESCONOCIDO');

    IF property_data.property_type_characteristics_id IS NOT NULL AND property_data.property_type_name IS NOT NULL THEN
        RAISE NOTICE '✅ ÉXITO: La propiedad ahora tiene UUID válido y tipo reconocido';
    ELSE
        RAISE WARNING '⚠️  ERROR: La propiedad aún tiene problemas con el UUID o tipo';
    END IF;

    RAISE NOTICE '========================================================';
END $$;











