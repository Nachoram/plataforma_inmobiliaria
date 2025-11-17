-- Script robusto para probar sincronización de contratos
-- Este script intenta usar datos existentes y solo crea lo mínimo necesario

DO $$
DECLARE
    existing_user_id UUID;
    existing_property_id UUID;
    existing_application_id UUID;
    test_contract_id UUID;
    test_conditions_id UUID;
    sync_result UUID;
BEGIN
    RAISE NOTICE '🚀 Iniciando pruebas robustas de sincronización...';

    -- Paso 1: Encontrar un usuario existente
    SELECT id INTO existing_user_id
    FROM profiles
    LIMIT 1;

    IF existing_user_id IS NULL THEN
        RAISE EXCEPTION '❌ No hay usuarios en la tabla profiles. Crea al menos un usuario antes de ejecutar esta prueba.';
    END IF;

    RAISE NOTICE '✅ Usuario encontrado: %', existing_user_id;

    -- Paso 2: Buscar una propiedad existente de este usuario
    SELECT id INTO existing_property_id
    FROM properties
    WHERE owner_id = existing_user_id
    LIMIT 1;

    IF existing_property_id IS NULL THEN
        RAISE NOTICE '⚠️ No hay propiedades para este usuario, creando una propiedad de prueba...';

        INSERT INTO properties (
            owner_id, status, listing_type, address_street, address_number,
            address_commune, address_region, price_clp, bedrooms, bathrooms,
            description, tipo_propiedad
        ) VALUES (
            existing_user_id,
            'disponible'::property_status_enum,
            'arriendo'::listing_type_enum,
            'Calle Test',
            '123',
            'Santiago',
            'Metropolitana',
            500000,
            2,
            1,
            'Propiedad para testing de sincronización',
            'Departamento'::tipo_propiedad_enum
        ) RETURNING id INTO existing_property_id;

        RAISE NOTICE '✅ Propiedad creada: %', existing_property_id;
    ELSE
        RAISE NOTICE '✅ Propiedad existente encontrada: %', existing_property_id;
    END IF;

    -- Paso 3: Buscar una aplicación existente para esta propiedad
    SELECT id INTO existing_application_id
    FROM applications
    WHERE property_id = existing_property_id
    LIMIT 1;

    IF existing_application_id IS NULL THEN
        RAISE NOTICE '⚠️ No hay aplicaciones para esta propiedad, creando una aplicación de prueba...';

        INSERT INTO applications (
            property_id, applicant_id, status
        ) VALUES (
            existing_property_id,
            existing_user_id,
            'aprobada'::application_status_enum
        ) RETURNING id INTO existing_application_id;

        -- Crear aplicante
        INSERT INTO application_applicants (
            application_id, first_name, paternal_last_name,
            maternal_last_name, email, phone, rut
        ) VALUES (
            existing_application_id,
            'María', 'González', 'Rodríguez',
            'maria.test@example.com',
            '+56987654321',
            '12.345.678-9'
        );

        RAISE NOTICE '✅ Aplicación creada: %', existing_application_id;
    ELSE
        RAISE NOTICE '✅ Aplicación existente encontrada: %', existing_application_id;
    END IF;

    -- Paso 4: Verificar si ya existe un contrato
    SELECT id INTO test_contract_id
    FROM rental_contracts
    WHERE application_id = existing_application_id;

    IF test_contract_id IS NULL THEN
        RAISE NOTICE '⚠️ No hay contrato para esta aplicación, creando uno básico...';

        INSERT INTO rental_contracts (
            application_id, status, created_by
        ) VALUES (
            existing_application_id,
            'draft'::contract_status_enum,
            existing_user_id
        ) RETURNING id INTO test_contract_id;

        RAISE NOTICE '✅ Contrato básico creado: %', test_contract_id;
    ELSE
        RAISE NOTICE '✅ Contrato existente encontrado: %', test_contract_id;
    END IF;

    -- Paso 5: Verificar si ya existen condiciones
    SELECT id INTO test_conditions_id
    FROM rental_contract_conditions
    WHERE application_id = existing_application_id;

    IF test_conditions_id IS NULL THEN
        RAISE NOTICE '⚠️ No hay condiciones para esta aplicación, creando condiciones de prueba...';

        INSERT INTO rental_contract_conditions (
            application_id, final_rent_price, broker_name, broker_rut,
            contract_duration_months, monthly_payment_day, guarantee_amount,
            contract_start_date, accepts_pets, dicom_clause,
            notification_email, bank_name, account_type, account_number,
            account_holder_name, account_holder_rut, brokerage_commission,
            additional_conditions
        ) VALUES (
            existing_application_id,
            550000,
            'Corredor Test Ltda.',
            '76.123.456-7',
            12,
            5,
            550000,
            '2025-12-01',
            true,
            true,
            'contratos.test@example.com',
            'Banco de Chile',
            'Cuenta Corriente',
            '123456789',
            'Carlos Sánchez',
            '15.678.901-2',
            27500,
            'Contrato con cláusula especial para mascotas'
        ) RETURNING id INTO test_conditions_id;

        RAISE NOTICE '✅ Condiciones creadas: %', test_conditions_id;
    ELSE
        RAISE NOTICE '✅ Condiciones existentes encontradas: %', test_conditions_id;
    END IF;

    -- Paso 6: Ejecutar sincronización
    RAISE NOTICE '🔄 Ejecutando sincronización...';
    SELECT sync_contract_conditions_to_rental_contract(existing_application_id) INTO sync_result;

    IF sync_result IS NOT NULL THEN
        RAISE NOTICE '✅ Sincronización exitosa: %', sync_result;

        -- Mostrar resultados
        RAISE NOTICE '📋 Estado del contrato después de sincronización:';
        SELECT
            final_amount, guarantee_amount, start_date,
            account_holder_name, account_bank, has_dicom_clause,
            allows_pets, broker_name, tenant_email, landlord_email
        FROM rental_contracts
        WHERE id = test_contract_id;
    ELSE
        RAISE NOTICE '⚠️ La sincronización no retornó resultado (posiblemente no había cambios)';
    END IF;

    RAISE NOTICE '🎉 Prueba completada exitosamente!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en pruebas: % (Detalle: %)', SQLERRM, SQLSTATE;
END $$;


