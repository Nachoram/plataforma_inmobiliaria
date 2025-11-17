-- Script simple para probar la función de sincronización de contratos
-- Este script asume que ya existe algún contrato y condiciones en la base de datos

DO $$
DECLARE
    contract_count INTEGER;
    conditions_count INTEGER;
    test_contract_id UUID;
    test_conditions_id UUID;
    sync_result UUID;
BEGIN
    RAISE NOTICE '🧪 Probando sincronización de contratos...';

    -- Contar contratos y condiciones existentes
    SELECT COUNT(*) INTO contract_count FROM rental_contracts;
    SELECT COUNT(*) INTO conditions_count FROM rental_contract_conditions;

    RAISE NOTICE '📊 Estado inicial: % contratos, % condiciones', contract_count, conditions_count;

    -- Si no hay contratos de prueba, buscar uno existente
    SELECT id INTO test_contract_id
    FROM rental_contracts
    LIMIT 1;

    IF test_contract_id IS NULL THEN
        RAISE NOTICE '❌ No hay contratos existentes para probar';
        RETURN;
    END IF;

    RAISE NOTICE '🎯 Probando sincronización con contrato ID: %', test_contract_id;

    -- Obtener el application_id del contrato
    DECLARE
        app_id UUID;
    BEGIN
        SELECT application_id INTO app_id
        FROM rental_contracts
        WHERE id = test_contract_id;

        IF app_id IS NULL THEN
            RAISE NOTICE '❌ El contrato no tiene application_id';
            RETURN;
        END IF;

        RAISE NOTICE '📄 Application ID: %', app_id;

        -- Intentar sincronizar
        SELECT sync_contract_conditions_to_rental_contract(app_id) INTO sync_result;

        IF sync_result IS NOT NULL THEN
            RAISE NOTICE '✅ Sincronización exitosa: %', sync_result;

            -- Mostrar resultado
            RAISE NOTICE '📋 Estado del contrato después de sincronización:';
            SELECT
                final_amount, guarantee_amount, start_date,
                account_holder_name, account_bank, has_dicom_clause,
                allows_pets, broker_name, tenant_email, landlord_email
            FROM rental_contracts
            WHERE id = test_contract_id;

        ELSE
            RAISE NOTICE '⚠️ No se pudo sincronizar (posiblemente no hay condiciones para esta aplicación)';
        END IF;
    END;

    RAISE NOTICE '🎉 Prueba completada';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en prueba: %', SQLERRM;
END $$;


