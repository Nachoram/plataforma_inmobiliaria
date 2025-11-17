-- Script ultra simple que evita TODAS las foreign key constraints
-- Crea datos básicos sin depender de auth.users

DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_application_id UUID := gen_random_uuid();
    test_contract_id UUID;
    test_conditions_id UUID;
    sync_result UUID;
BEGIN
    RAISE NOTICE '🚀 Iniciando prueba sin constraints...';

    -- Crear perfil básico (sin foreign key a auth.users)
    -- Nota: Esto puede fallar si la tabla profiles tiene RLS o constraints estrictas
    BEGIN
        INSERT INTO profiles (
            id, first_name, paternal_last_name, email, rut
        ) VALUES (
            test_user_id,
            'Test', 'User',
            'test@example.com',
            '12345678-9'
        );
        RAISE NOTICE '✅ Usuario creado: %', test_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Si falla, usar un usuario existente
            SELECT id INTO test_user_id FROM profiles LIMIT 1;
            IF test_user_id IS NULL THEN
                RAISE EXCEPTION '❌ No se puede crear ni encontrar usuario';
            END IF;
            RAISE NOTICE '✅ Usando usuario existente: %', test_user_id;
    END;

    -- Crear propiedad (sin verificar foreign keys)
    INSERT INTO properties (
        owner_id, address_street, address_commune, price_clp,
        bedrooms, bathrooms, tipo_propiedad
    ) VALUES (
        test_user_id,
        'Test Street', 'Test City',
        100000, 1, 1,
        'Casa'::tipo_propiedad_enum
    );
    RAISE NOTICE '✅ Propiedad creada';

    -- Crear aplicación (usando el mismo usuario para evitar problemas de FK)
    INSERT INTO applications (
        id, property_id, applicant_id, status
    ) VALUES (
        test_application_id,
        (SELECT id FROM properties WHERE owner_id = test_user_id LIMIT 1),
        test_user_id,  -- Usar el mismo usuario para evitar FK issues
        'aprobada'::application_status_enum
    );
    RAISE NOTICE '✅ Aplicación creada: %', test_application_id;

    -- Crear aplicante (datos básicos)
    INSERT INTO application_applicants (
        application_id, first_name, email
    ) VALUES (
        test_application_id,
        'Test Applicant', 'applicant@test.com'
    );
    RAISE NOTICE '✅ Aplicante creado';

    -- Crear contrato básico
    INSERT INTO rental_contracts (
        application_id, status
    ) VALUES (
        test_application_id,
        'draft'::contract_status_enum
    ) RETURNING id INTO test_contract_id;
    RAISE NOTICE '✅ Contrato básico creado: %', test_contract_id;

    -- Crear condiciones contractuales mínimas
    INSERT INTO rental_contract_conditions (
        application_id, final_rent_price, notification_email
    ) VALUES (
        test_application_id,
        100000, 'test@example.com'
    ) RETURNING id INTO test_conditions_id;
    RAISE NOTICE '✅ Condiciones creadas: %', test_conditions_id;

    -- Probar sincronización
    RAISE NOTICE '🔄 Probando sincronización...';
    SELECT sync_contract_conditions_to_rental_contract(test_application_id) INTO sync_result;

    IF sync_result IS NOT NULL THEN
        RAISE NOTICE '✅ ¡SINCRONIZACIÓN EXITOSA!';

        -- Mostrar resultado
        RAISE NOTICE '📋 Datos sincronizados:';
        SELECT
            final_amount, guarantee_amount,
            tenant_email, landlord_email,
            notes
        FROM rental_contracts
        WHERE id = test_contract_id;
    ELSE
        RAISE NOTICE '⚠️ Sincronización completada (posiblemente sin cambios)';
    END IF;

    RAISE NOTICE '🎉 ¡Prueba sin constraints completada!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error: % (Estado: %)', SQLERRM, SQLSTATE;
END $$;


