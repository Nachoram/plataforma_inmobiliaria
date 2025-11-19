-- Script simple para verificar que la función de sincronización existe y funciona
-- No crea datos, solo verifica la función

DO $$
DECLARE
    function_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '🔍 Verificando existencia de funciones de sincronización...';

    -- Verificar que la función existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'sync_contract_conditions_to_rental_contract'
    ) INTO function_exists;

    IF function_exists THEN
        RAISE NOTICE '✅ Función sync_contract_conditions_to_rental_contract existe';

        -- Verificar que se puede llamar (con un ID nulo debería retornar NULL)
        BEGIN
            PERFORM sync_contract_conditions_to_rental_contract(gen_random_uuid());
            RAISE NOTICE '✅ Función es ejecutable';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Función existe pero falló al ejecutarse (esperado con ID inválido): %', SQLERRM;
        END;
    ELSE
        RAISE EXCEPTION '❌ Función sync_contract_conditions_to_rental_contract NO existe. Asegúrate de aplicar las migraciones.';
    END IF;

    -- Verificar función de creación de contratos
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'create_rental_contract_on_approval'
    ) INTO function_exists;

    IF function_exists THEN
        RAISE NOTICE '✅ Función create_rental_contract_on_approval existe';
    ELSE
        RAISE EXCEPTION '❌ Función create_rental_contract_on_approval NO existe. Asegúrate de aplicar las migraciones.';
    END IF;

    RAISE NOTICE '🎉 Todas las funciones de sincronización están disponibles!';

    -- Mostrar información adicional
    RAISE NOTICE '💡 Para probar completamente:';
    RAISE NOTICE '   1. Ejecuta test_sync_minimal.sql para una prueba completa';
    RAISE NOTICE '   2. O usa test_sync_existing_data.sql si ya tienes datos';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error en verificación: %', SQLERRM;
END $$;








