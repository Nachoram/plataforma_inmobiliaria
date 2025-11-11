-- Script de prueba simple para verificar la sincronización de contratos
-- Ejecutar este script después de aplicar las migraciones

DO $$
DECLARE
    test_application_id UUID := gen_random_uuid();
    test_user_id UUID;
    test_property_id UUID;
    test_contract_id UUID;
    test_conditions_id UUID;
    sync_result UUID;
BEGIN
    RAISE NOTICE '🚀 Iniciando pruebas de sincronización de contratos...';

    -- Buscar un usuario existente en auth.users
    SELECT id INTO test_user_id
    FROM auth.users
    LIMIT 1;

    -- Si no hay usuarios en auth.users, buscar en profiles
    IF test_user_id IS NULL THEN
        SELECT id INTO test_user_id
        FROM profiles
        LIMIT 1;
    END IF;

    -- Si aún no hay usuario, usar un UUID nulo y crear un perfil mínimo
    IF test_user_id IS NULL THEN
        test_user_id := gen_random_uuid();
        RAISE NOTICE '⚠️ No se encontraron usuarios existentes, creando usuario de prueba con ID: %', test_user_id;

        -- Intentar crear entrada mínima en auth.users (esto puede no funcionar en producción)
        BEGIN
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
            VALUES (
                test_user_id,
                'test.contract@example.com',
                crypt('testpassword', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW()
            );
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ No se pudo crear usuario en auth.users (normal en entornos de prueba), continuando con perfil solo...';
        END;
    END IF;

    RAISE NOTICE '✅ Usuario seleccionado para pruebas: %', test_user_id;

    -- Verificar/crear perfil de usuario
    INSERT INTO profiles (
        id, first_name, paternal_last_name, maternal_last_name,
        rut, email, phone, profession, marital_status
    ) VALUES (
        test_user_id,
        'Juan', 'Pérez', 'García',
        '11.111.111-1',
        'juan.test@example.com',
        '+56912345678',
        'Ingeniero',
        'soltero'::marital_status_enum
    ) ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '✅ Perfil de usuario creado/verificado: %', test_user_id;

    -- Crear propiedad de prueba
    INSERT INTO properties (
        owner_id, status, listing_type, address_street, address_number,
        address_commune, address_region, price_clp, bedrooms, bathrooms,
        description, tipo_propiedad, property_type_characteristics_id
    ) VALUES (
        test_user_id,
        'disponible'::property_status_enum,
        'arriendo'::listing_type_enum,
        'Calle Test',
        '123',
        'Santiago',
        'Metropolitana',
        500000,
        2,
        1,
        'Propiedad para testing de sincronización de contratos',
        'Departamento'::tipo_propiedad_enum,
        NULL
    ) RETURNING id INTO test_property_id;

    RAISE NOTICE '✅ Propiedad creada: %', test_property_id;

    -- Crear aplicación de prueba
    INSERT INTO applications (
        property_id, applicant_id, status
    ) VALUES (
        test_property_id,
        test_user_id,
        'aprobada'::application_status_enum
    ) RETURNING id INTO test_application_id;

    RAISE NOTICE '✅ Aplicación creada: %', test_application_id;

    -- Crear aplicante
    INSERT INTO application_applicants (
        application_id, first_name, paternal_last_name,
        maternal_last_name, email, phone, rut
    ) VALUES (
        test_application_id,
        'María', 'González', 'Rodríguez',
        'maria.test@example.com',
        '+56987654321',
        '12.345.678-9'
    );

    -- Crear rental_owner
    INSERT INTO rental_owners (
        property_id, first_name, paternal_last_name,
        maternal_last_name, rut, email, phone
    ) VALUES (
        test_property_id,
        'Carlos', 'Sánchez', 'López',
        '15.678.901-2',
        'carlos.test@example.com',
        '+56911223344'
    );

    -- Crear contrato básico
    INSERT INTO rental_contracts (
        application_id, status, created_by
    ) VALUES (
        test_application_id,
        'draft',
        test_user_id
    ) RETURNING id INTO test_contract_id;

    RAISE NOTICE '✅ Contrato básico creado: %', test_contract_id;

    -- Crear condiciones contractuales
    INSERT INTO rental_contract_conditions (
        application_id, final_rent_price, broker_name, broker_rut,
        contract_duration_months, monthly_payment_day, guarantee_amount,
        contract_start_date, accepts_pets, dicom_clause,
        notification_email, bank_name, account_type, account_number,
        account_holder_name, account_holder_rut, brokerage_commission,
        additional_conditions
    ) VALUES (
        test_application_id,
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
        'Carlos Sánchez López',
        '15.678.901-2',
        27500,
        'Contrato con cláusula especial para mascotas'
    ) RETURNING id INTO test_conditions_id;

    RAISE NOTICE '✅ Condiciones contractuales creadas: %', test_conditions_id;

    -- Probar sincronización
    RAISE NOTICE '🔄 Probando sincronización...';
    SELECT sync_contract_conditions_to_rental_contract(test_application_id) INTO sync_result;

    RAISE NOTICE '✅ Resultado de sincronización: %', sync_result;

    -- Verificar resultados
    RAISE NOTICE '📊 Verificando resultados...';

    -- Mostrar el contrato actualizado
    RAISE NOTICE 'Contrato actualizado:';
    SELECT
        id,
        final_amount,
        guarantee_amount,
        start_date,
        validity_period_months,
        account_holder_name,
        account_bank,
        account_type,
        has_dicom_clause,
        allows_pets,
        has_brokerage_commission,
        broker_name,
        broker_amount,
        tenant_email,
        landlord_email,
        notes
    FROM rental_contracts
    WHERE id = test_contract_id;

    RAISE NOTICE '🎉 Pruebas completadas exitosamente!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en pruebas: %', SQLERRM;
END $$;
