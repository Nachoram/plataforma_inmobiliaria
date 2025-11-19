-- Script que SOLO usa datos existentes - no crea nada nuevo
-- Ideal para probar en entornos de producción

DO $$
DECLARE
    existing_contract RECORD;
    sync_count INTEGER := 0;
    total_found INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 Buscando contratos existentes para sincronizar...';

    -- Contar contratos que tienen condiciones pero pueden necesitar sincronización
    SELECT COUNT(*) INTO total_found
    FROM rental_contracts rc
    JOIN rental_contract_conditions rcc ON rc.application_id = rcc.application_id
    WHERE rc.final_amount IS NULL OR rc.final_amount = 0; -- Contratos que pueden no estar sincronizados

    RAISE NOTICE '📊 Encontrados % contratos que pueden necesitar sincronización', total_found;

    IF total_found = 0 THEN
        RAISE NOTICE '⚠️ No hay contratos con condiciones que necesiten sincronización';
        RAISE NOTICE '💡 Esto significa que todos los contratos ya están sincronizados correctamente';
        RETURN;
    END IF;

    -- Sincronizar contratos existentes (máximo 5 para no sobrecargar)
    FOR existing_contract IN
        SELECT DISTINCT rc.id, rc.application_id, rcc.id as conditions_id
        FROM rental_contracts rc
        JOIN rental_contract_conditions rcc ON rc.application_id = rcc.application_id
        WHERE rc.final_amount IS NULL OR rc.final_amount = 0
        LIMIT 5
    LOOP
        RAISE NOTICE '🔄 Sincronizando contrato ID: %', existing_contract.id;

        -- Ejecutar sincronización
        PERFORM sync_contract_conditions_to_rental_contract(existing_contract.application_id);

        sync_count := sync_count + 1;

        RAISE NOTICE '✅ Contrato sincronizado: %', existing_contract.id;
    END LOOP;

    RAISE NOTICE '🎉 Sincronización completada para % contratos existentes', sync_count;

    -- Mostrar ejemplo de un contrato sincronizado
    IF sync_count > 0 THEN
        RAISE NOTICE '📋 Ejemplo de contrato sincronizado:';
        SELECT
            rc.id,
            rc.final_amount,
            rc.guarantee_amount,
            rc.start_date,
            rc.account_holder_name,
            rc.tenant_email,
            rc.landlord_email,
            rc.updated_at
        FROM rental_contracts rc
        JOIN rental_contract_conditions rcc ON rc.application_id = rcc.application_id
        WHERE rc.final_amount IS NOT NULL AND rc.final_amount > 0
        LIMIT 1;
    END IF;

    RAISE NOTICE '✅ ¡Prueba con datos existentes completada exitosamente!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en sincronización existente: %', SQLERRM;
END $$;






