-- Script simple para probar sincronización con datos existentes
-- No crea datos de prueba, usa aplicaciones existentes que ya tengan contratos y condiciones

DO $$
DECLARE
    existing_app RECORD;
    sync_count INTEGER := 0;
    total_apps INTEGER := 0;
BEGIN
    RAISE NOTICE '🧪 Probando sincronización con datos existentes...';

    -- Contar aplicaciones que tienen tanto contrato como condiciones
    SELECT COUNT(*) INTO total_apps
    FROM applications a
    WHERE EXISTS (SELECT 1 FROM rental_contracts rc WHERE rc.application_id = a.id)
    AND EXISTS (SELECT 1 FROM rental_contract_conditions rcc WHERE rcc.application_id = a.id);

    RAISE NOTICE '📊 Encontradas % aplicaciones con contratos y condiciones', total_apps;

    IF total_apps = 0 THEN
        RAISE NOTICE '❌ No hay aplicaciones con contratos y condiciones existentes';
        RAISE NOTICE '💡 Ejecuta test_contract_sync_simple.sql para crear datos de prueba';
        RETURN;
    END IF;

    -- Iterar sobre aplicaciones existentes
    FOR existing_app IN
        SELECT a.id, a.property_id, rc.id as contract_id, rcc.id as conditions_id
        FROM applications a
        JOIN rental_contracts rc ON rc.application_id = a.id
        JOIN rental_contract_conditions rcc ON rcc.application_id = a.id
        LIMIT 3 -- Solo probar con las primeras 3 para no sobrecargar
    LOOP
        RAISE NOTICE '🔄 Probando sincronización para aplicación: %', existing_app.id;

        -- Ejecutar sincronización
        PERFORM sync_contract_conditions_to_rental_contract(existing_app.id);

        sync_count := sync_count + 1;

        RAISE NOTICE '✅ Sincronización completada para aplicación %', existing_app.id;
    END LOOP;

    RAISE NOTICE '🎉 Sincronización completada para % aplicaciones', sync_count;

    -- Mostrar resultados de una aplicación como ejemplo
    IF sync_count > 0 THEN
        RAISE NOTICE '📋 Ejemplo de contrato sincronizado:';

        SELECT
            rc.id,
            rc.final_amount,
            rc.guarantee_amount,
            rc.start_date,
            rc.account_holder_name,
            rc.account_bank,
            rc.has_dicom_clause,
            rc.allows_pets,
            rc.broker_name,
            rc.tenant_email,
            rc.landlord_email,
            rc.notes
        FROM rental_contracts rc
        WHERE rc.application_id = existing_app.id
        LIMIT 1;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en sincronización: %', SQLERRM;
END $$;






