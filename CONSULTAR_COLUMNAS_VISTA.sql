-- Ver todas las columnas disponibles en contract_data_view
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contract_data_view'
ORDER BY ordinal_position;

-- Ver solo las columnas relacionadas con propietarios
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contract_data_view'
AND column_name LIKE '%owner%'
ORDER BY column_name;

-- Ver solo las columnas relacionadas con garante
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contract_data_view'
AND column_name LIKE '%guarantor%'
ORDER BY column_name;

-- Probar una consulta simple con las columnas que deberían existir
SELECT
    application_characteristic_id,
    property_listing_type,
    -- Verificar si estas columnas existen
    rental_owner_id,
    sale_owner_id,
    guarantor_id
FROM contract_data_view
LIMIT 1;

-- Si las columnas concatenadas no existen, intentar con las individuales
DO $$
BEGIN
    -- Verificar si podemos acceder a las columnas individuales
    BEGIN
        PERFORM rental_owner_first_name FROM contract_data_view LIMIT 1;
        RAISE NOTICE '✅ rental_owner_first_name existe';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE '❌ rental_owner_first_name NO existe';
    END;

    BEGIN
        PERFORM sale_owner_first_name FROM contract_data_view LIMIT 1;
        RAISE NOTICE '✅ sale_owner_first_name existe';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE '❌ sale_owner_first_name NO existe';
    END;

    BEGIN
        PERFORM guarantor_first_name FROM contract_data_view LIMIT 1;
        RAISE NOTICE '✅ guarantor_first_name existe';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE '❌ guarantor_first_name NO existe';
    END;
END $$;
