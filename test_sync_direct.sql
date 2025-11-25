-- Script directo y simple que crea todo lo necesario en orden correcto
-- Evita problemas de foreign keys creando IDs consistentes

DO $$
DECLARE
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
    test_property_id UUID;
    test_application_id UUID := '22222222-2222-2222-2222-222222222222';
    test_contract_id UUID;
    test_conditions_id UUID;
    sync_result UUID;
BEGIN
    RAISE NOTICE '🚀 Iniciando prueba directa...';

    -- PASO 1: Crear o usar usuario existente
    BEGIN
        -- Intentar crear usuario con ID fijo
        INSERT INTO profiles (id, first_name, paternal_last_name, email, rut)
        VALUES (test_user_id, 'Test', 'User', 'test@example.com', '11111111-1');
        RAISE NOTICE '✅ Usuario creado';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE '⚠️ Usuario ya existe, continuando...';
        WHEN OTHERS THEN
            -- Si no se puede crear, buscar uno existente
            SELECT id INTO test_user_id FROM profiles LIMIT 1;
            IF test_user_id IS NULL THEN
                RAISE EXCEPTION '❌ No hay usuarios disponibles';
            END IF;
            RAISE NOTICE '✅ Usando usuario existente: %', test_user_id;
    END;

    -- PASO 2: Crear propiedad
    INSERT INTO properties (
        owner_id, address_street, address_commune, price_clp,
        bedrooms, bathrooms, tipo_propiedad
    ) VALUES (
        test_user_id, 'Test Street 123', 'Test City', 100000,
        2, 1, 'Departamento'::tipo_propiedad_enum
    ) RETURNING id INTO test_property_id;
    RAISE NOTICE '✅ Propiedad creada: %', test_property_id;

    -- PASO 3: Crear aplicación
    INSERT INTO applications (
        id, property_id, applicant_id, status
    ) VALUES (
        test_application_id, test_property_id, test_user_id,
        'aprobada'::application_status_enum
    );
    RAISE NOTICE '✅ Aplicación creada: %', test_application_id;

    -- PASO 4: Crear aplicante
    INSERT INTO application_applicants (
        application_id, first_name, paternal_last_name, email
    ) VALUES (
        test_application_id, 'Test', 'Applicant', 'applicant@test.com'
    );
    RAISE NOTICE '✅ Aplicante creado';

    -- PASO 5: Crear contrato básico
    INSERT INTO rental_contracts (
        application_id, status
    ) VALUES (
        test_application_id, 'draft'::contract_status_enum
    ) RETURNING id INTO test_contract_id;
    RAISE NOTICE '✅ Contrato creado: %', test_contract_id;

    -- PASO 6: Crear condiciones
    INSERT INTO rental_contract_conditions (
        application_id, final_rent_price, guarantee_amount,
        contract_start_date, notification_email
    ) VALUES (
        test_application_id, 100000, 100000,
        CURRENT_DATE + INTERVAL '30 days', 'test@example.com'
    ) RETURNING id INTO test_conditions_id;
    RAISE NOTICE '✅ Condiciones creadas: %', test_conditions_id;

    -- PASO 7: Sincronizar
    RAISE NOTICE '🔄 Sincronizando...';
    SELECT sync_contract_conditions_to_rental_contract(test_application_id) INTO sync_result;

    -- PASO 8: Verificar resultados
    RAISE NOTICE '📋 Resultado final:';
    SELECT
        final_amount, guarantee_amount, start_date,
        tenant_email, landlord_email
    FROM rental_contracts
    WHERE id = test_contract_id;

    RAISE NOTICE '🎉 ¡Prueba directa completada exitosamente!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en prueba directa: % (Código: %)', SQLERRM, SQLSTATE;
END $$;










