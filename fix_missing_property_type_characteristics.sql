-- =====================================================
-- FIX MISSING property_type_characteristics_id FOR SPECIFIC APPLICATION
-- Application ID causing error: 9b4b4270-f7c1-40ab-9d9d-851a4b7ac07b
-- =====================================================

DO $$
DECLARE
    application_id UUID := '9b4b4270-f7c1-40ab-9d9d-851a4b7ac07b';
    property_record RECORD;
    characteristics_id UUID;
BEGIN
    RAISE NOTICE '🔍 IDENTIFICANDO PROPIEDAD PARA APPLICATION ID: %', application_id;

    -- Get the property for this application
    SELECT
        p.id,
        p.tipo_propiedad,
        p.address_street,
        p.address_number,
        p.property_type_characteristics_id
    INTO property_record
    FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '❌ No se encontró la aplicación con ID: %', application_id;
    END IF;

    RAISE NOTICE '📊 Información de la propiedad:';
    RAISE NOTICE '  - Property ID: %', property_record.id;
    RAISE NOTICE '  - Tipo propiedad: %', property_record.tipo_propiedad;
    RAISE NOTICE '  - Dirección: % %', property_record.address_street, property_record.address_number;
    RAISE NOTICE '  - Property type characteristics ID actual: %', property_record.property_type_characteristics_id;

    -- Check if property_type_characteristics_id is already set
    IF property_record.property_type_characteristics_id IS NOT NULL THEN
        RAISE NOTICE '✅ La propiedad ya tiene property_type_characteristics_id asignado';
        RETURN;
    END IF;

    -- Check if tipo_propiedad is set
    IF property_record.tipo_propiedad IS NULL THEN
        RAISE EXCEPTION '❌ La propiedad no tiene tipo_propiedad definido. No se puede determinar el UUID correspondiente.';
    END IF;

    -- Get the UUID for this property type
    SELECT id INTO characteristics_id
    FROM property_type_characteristics
    WHERE name = property_record.tipo_propiedad::text
    LIMIT 1;

    IF characteristics_id IS NULL THEN
        RAISE EXCEPTION '❌ No se encontró un UUID para el tipo de propiedad: %. Verifique que existe en property_type_characteristics.', property_record.tipo_propiedad;
    END IF;

    RAISE NOTICE '🔄 Actualizando propiedad con UUID: %', characteristics_id;

    -- Update the property with the UUID
    UPDATE properties
    SET property_type_characteristics_id = characteristics_id
    WHERE id = property_record.id;

    RAISE NOTICE '✅ Propiedad actualizada exitosamente';
    RAISE NOTICE '  - Property ID: %', property_record.id;
    RAISE NOTICE '  - Nuevo property_type_characteristics_id: %', characteristics_id;

END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    application_id UUID := '9b4b4270-f7c1-40ab-9d9d-851a4b7ac07b';
    property_data RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL';

    SELECT
        p.id,
        p.property_type_characteristics_id,
        p.tipo_propiedad,
        ptc.name as characteristics_name
    INTO property_data
    FROM applications a
    JOIN properties p ON a.property_id = p.id
    LEFT JOIN property_type_characteristics ptc ON p.property_type_characteristics_id = ptc.id
    WHERE a.id = application_id;

    IF FOUND THEN
        RAISE NOTICE '📊 Estado final de la propiedad:';
        RAISE NOTICE '  - Property ID: %', property_data.id;
        RAISE NOTICE '  - property_type_characteristics_id: %', property_data.property_type_characteristics_id;
        RAISE NOTICE '  - tipo_propiedad: %', property_data.tipo_propiedad;
        RAISE NOTICE '  - Characteristics name: %', property_data.characteristics_name;

        IF property_data.property_type_characteristics_id IS NOT NULL THEN
            RAISE NOTICE '✅ ÉXITO: La propiedad ahora tiene property_type_characteristics_id válido';
        ELSE
            RAISE NOTICE '❌ ERROR: La propiedad aún no tiene property_type_characteristics_id';
        END IF;
    ELSE
        RAISE NOTICE '❌ ERROR: No se pudo verificar la propiedad';
    END IF;
END $$;
