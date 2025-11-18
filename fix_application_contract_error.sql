-- =====================================================
-- FIX: Property Type Characteristics ID for Application Contract Error
-- Application ID: 07bb963d-a4bf-4dd9-a1b6-fa92b755a62e
-- Date: 2025-11-03
-- =====================================================
-- This script fixes the missing property_type_characteristics_id for the property
-- associated with the failing application, which is causing contract generation errors.

DO $$
DECLARE
    application_id UUID := '07bb963d-a4bf-4dd9-a1b6-fa92b755a62e';
    property_id UUID;
    current_uuid UUID;
    property_type_name TEXT;
    new_uuid UUID;
BEGIN
    RAISE NOTICE '🔍 FIXING APPLICATION: %', application_id;
    RAISE NOTICE '========================================================';

    -- Get the property ID for this application
    SELECT property_id INTO property_id
    FROM public.applications
    WHERE id = application_id;

    IF property_id IS NULL THEN
        RAISE EXCEPTION '❌ No se encontró la aplicación con ID: %', application_id;
    END IF;

    RAISE NOTICE '📋 Propiedad encontrada: %', property_id;

    -- Check current state
    SELECT p.property_type_characteristics_id, p.tipo_propiedad
    INTO current_uuid, property_type_name
    FROM public.properties p
    WHERE p.id = property_id;

    RAISE NOTICE '📊 Estado actual:';
    RAISE NOTICE '  - property_type_characteristics_id: %', current_uuid;
    RAISE NOTICE '  - tipo_propiedad: %', property_type_name;

    -- If it already has a valid UUID, verify it exists
    IF current_uuid IS NOT NULL THEN
        SELECT id INTO new_uuid
        FROM public.property_type_characteristics
        WHERE id = current_uuid;

        IF FOUND THEN
            RAISE NOTICE '✅ La propiedad ya tiene un UUID válido';
            RAISE NOTICE '========================================================';
            RETURN;
        ELSE
            RAISE WARNING '⚠️  El UUID actual no existe en property_type_characteristics. Se corregirá.';
        END IF;
    END IF;

    -- Determine the property type name
    IF property_type_name IS NULL THEN
        RAISE EXCEPTION '❌ La propiedad no tiene tipo_propiedad definido. No se puede determinar el tipo.';
    END IF;

    RAISE NOTICE '🔍 Buscando UUID para tipo: "%"', property_type_name;

    -- Find the correct UUID for this property type
    SELECT id INTO new_uuid
    FROM public.property_type_characteristics
    WHERE name = property_type_name;

    IF new_uuid IS NULL THEN
        RAISE EXCEPTION '❌ No se encontró UUID para el tipo de propiedad "%" en property_type_characteristics. Verificar que existe.', property_type_name;
    END IF;

    RAISE NOTICE '✅ UUID encontrado: %', new_uuid;

    -- Update the property
    UPDATE public.properties
    SET property_type_characteristics_id = new_uuid
    WHERE id = property_id;

    RAISE NOTICE '✅ Propiedad actualizada exitosamente';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '🎯 FIX COMPLETADO';
    RAISE NOTICE '  - Aplicación: %', application_id;
    RAISE NOTICE '  - Propiedad: %', property_id;
    RAISE NOTICE '  - Tipo: %', property_type_name;
    RAISE NOTICE '  - UUID asignado: %', new_uuid;
    RAISE NOTICE '========================================================';

END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

DO $$
DECLARE
    application_id UUID := '07bb963d-a4bf-4dd9-a1b6-fa92b755a62e';
    property_data RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN DEL FIX...';
    RAISE NOTICE '========================================================';

    SELECT
        a.id as application_id,
        p.id as property_id,
        p.property_type_characteristics_id,
        ptc.name as property_type_name,
        p.address_street,
        p.address_number
    INTO property_data
    FROM public.applications a
    JOIN public.properties p ON a.property_id = p.id
    LEFT JOIN public.property_type_characteristics ptc ON p.property_type_characteristics_id = ptc.id
    WHERE a.id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '❌ No se pudo verificar la aplicación';
    END IF;

    RAISE NOTICE '📊 Estado final:';
    RAISE NOTICE '  - Aplicación ID: %', property_data.application_id;
    RAISE NOTICE '  - Propiedad ID: %', property_data.property_id;
    RAISE NOTICE '  - Dirección: % %', property_data.address_street, property_data.address_number;
    RAISE NOTICE '  - UUID: %', property_data.property_type_characteristics_id;
    RAISE NOTICE '  - Tipo propiedad: %', COALESCE(property_data.property_type_name, 'DESCONOCIDO');

    IF property_data.property_type_characteristics_id IS NOT NULL AND property_data.property_type_name IS NOT NULL THEN
        RAISE NOTICE '✅ ÉXITO: La propiedad ahora tiene configuración correcta para generar contratos';
    ELSE
        RAISE WARNING '⚠️  ERROR: La propiedad aún tiene problemas de configuración';
    END IF;

    RAISE NOTICE '========================================================';
END $$;














