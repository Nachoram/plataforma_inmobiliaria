-- Script minimalista para probar sincronización de contratos
-- Crea solo los datos mínimos necesarios sin dependencias complejas

DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_application_id UUID := gen_random_uuid();
    test_contract_id UUID;
    test_conditions_id UUID;
    sync_result UUID;
BEGIN
    RAISE NOTICE '🚀 Iniciando prueba minimalista de sincronización...';

    -- PASO 1: Crear usuario básico (sin foreign key constraints)
    BEGIN
        -- Solo intentar crear en profiles, ignorar auth.users por ahora
        INSERT INTO profiles (
            id, first_name, paternal_last_name, email
        ) VALUES (
            test_user_id,
            'Test', 'User',
            'test@example.com'
        );
        RAISE NOTICE '✅ Usuario creado: %', test_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Si falla, buscar un usuario existente
            SELECT id INTO test_user_id FROM profiles LIMIT 1;
            IF test_user_id IS NULL THEN
                RAISE EXCEPTION '❌ No se puede crear ni encontrar usuario para pruebas';
            END IF;
            RAISE NOTICE '✅ Usando usuario existente: %', test_user_id;
    END;

    -- PASO 2: Crear propiedad básica
    INSERT INTO properties (
        owner_id, status, listing_type, address_street, address_number,
        address_commune, address_region, price_clp, bedrooms, bathrooms,
        tipo_propiedad
    ) VALUES (
        test_user_id,
        'disponible'::property_status_enum,
        'arriendo'::listing_type_enum,
        'Test Street', '123',
        'Test City', 'Test Region',
        100000, 1, 1,
        'Casa'::tipo_propiedad_enum
    );
    RAISE NOTICE '✅ Propiedad creada';

    -- PASO 3: Crear aplicación
    INSERT INTO applications (
        id, property_id, applicant_id, status
    ) VALUES (
        test_application_id,
        (SELECT id FROM properties WHERE owner_id = test_user_id LIMIT 1),
        test_user_id,
        'aprobada'::application_status_enum
    );
    RAISE NOTICE '✅ Aplicación creada: %', test_application_id;

    -- PASO 4: Crear aplicante
    INSERT INTO application_applicants (
        application_id, first_name, email
    ) VALUES (
        test_application_id,
        'Test Applicant', 'applicant@test.com'
    );
    RAISE NOTICE '✅ Aplicante creado';

    -- PASO 5: Crear contrato básico
    INSERT INTO rental_contracts (
        application_id, status, created_by
    ) VALUES (
        test_application_id,
        'draft'::contract_status_enum,
        test_user_id
    ) RETURNING id INTO test_contract_id;
    RAISE NOTICE '✅ Contrato básico creado: %', test_contract_id;

    -- PASO 6: Crear condiciones contractuales mínimas
    INSERT INTO rental_contract_conditions (
        application_id, final_rent_price, contract_start_date,
        notification_email, account_holder_name
    ) VALUES (
        test_application_id,
        100000, '2025-01-01',
        'test@example.com', 'Test Holder'
    ) RETURNING id INTO test_conditions_id;
    RAISE NOTICE '✅ Condiciones creadas: %', test_conditions_id;

    -- PASO 7: Probar sincronización
    RAISE NOTICE '🔄 Ejecutando sincronización...';
    SELECT sync_contract_conditions_to_rental_contract(test_application_id) INTO sync_result;

    IF sync_result IS NOT NULL THEN
        RAISE NOTICE '✅ Sincronización exitosa!';

        -- Mostrar resultado
        RAISE NOTICE '📋 Datos sincronizados:';
        SELECT
            final_amount, guarantee_amount, start_date,
            account_holder_name, tenant_email, landlord_email
        FROM rental_contracts
        WHERE id = test_contract_id;
    ELSE
        RAISE NOTICE '⚠️ Sincronización completada (sin cambios detectados)';
    END IF;

    RAISE NOTICE '🎉 Prueba minimalista completada!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en prueba minimalista: %', SQLERRM;
END $$;




