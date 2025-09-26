-- =====================================================
-- VERIFICACIÓN DE LA VISTA CONTRACT_DATA_VIEW
-- =====================================================

-- 1. Verificar que la vista existe
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'contract_data_view';

-- 2. Verificar todas las columnas disponibles en la vista
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contract_data_view'
ORDER BY ordinal_position;

-- 3. Verificar específicamente las columnas de propietarios
SELECT
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contract_data_view'
AND column_name LIKE '%owner%'
ORDER BY column_name;

-- 4. Verificar columnas de garante
SELECT
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contract_data_view'
AND column_name LIKE '%guarantor%'
ORDER BY column_name;

-- 5. Contar filas en la vista
SELECT
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN rental_owner_id IS NOT NULL THEN 1 END) as with_rental_owner,
    COUNT(CASE WHEN sale_owner_id IS NOT NULL THEN 1 END) as with_sale_owner,
    COUNT(CASE WHEN guarantor_id IS NOT NULL THEN 1 END) as with_guarantor
FROM contract_data_view;

-- 6. Probar query simple con las columnas que existen
DO $$
DECLARE
    query_result RECORD;
BEGIN
    -- Verificar si podemos hacer una consulta básica
    FOR query_result IN
        SELECT
            application_id,
            property_listing_type,
            CASE
                WHEN property_listing_type = 'arriendo' AND rental_owner_id IS NOT NULL THEN 'HAS_RENTAL_OWNER'
                WHEN property_listing_type = 'venta' AND sale_owner_id IS NOT NULL THEN 'HAS_SALE_OWNER'
                ELSE 'NO_SPECIFIC_OWNER'
            END as owner_status,
            CASE WHEN guarantor_id IS NOT NULL THEN 'HAS_GUARANTOR' ELSE 'NO_GUARANTOR' END as guarantor_status
        FROM contract_data_view
        LIMIT 5
    LOOP
        RAISE NOTICE 'App: %, Type: %, Owner: %, Guarantor: %',
            query_result.application_id,
            query_result.property_listing_type,
            query_result.owner_status,
            query_result.guarantor_status;
    END LOOP;

    RAISE NOTICE '✅ Vista contract_data_view verificada correctamente';
END $$;

-- 7. Mostrar las primeras filas de la vista (limitado para no sobrecargar)
SELECT
    application_characteristic_id,
    property_listing_type,
    -- Mostrar propietario según tipo
    CASE
        WHEN property_listing_type = 'arriendo' THEN rental_owner_id::text
        WHEN property_listing_type = 'venta' THEN sale_owner_id::text
        ELSE owner_id::text
    END as relevant_owner_id,
    applicant_id,
    guarantor_id
FROM contract_data_view
LIMIT 3;
