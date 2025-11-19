-- =====================================================
-- DEBUG: Verificar qué está haciendo la función trigger
-- =====================================================

-- Verificar el código actual de la función
SELECT
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'create_contract_from_conditions';

-- Verificar si la función contiene '{}' o NULL para contract_content
SELECT
    proname as function_name,
    CASE
        WHEN pg_get_functiondef(oid) LIKE '%''{}''::jsonb%' THEN '✅ Usa {} correctamente'
        WHEN pg_get_functiondef(oid) LIKE '%NULL%' AND pg_get_functiondef(oid) LIKE '%contract_content%' THEN '❌ Aún usa NULL para contract_content'
        ELSE '⚠️ No se puede determinar'
    END as contract_content_status
FROM pg_proc
WHERE proname = 'create_contract_from_conditions';

-- Verificar que el trigger existe y está activo
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled_status,
    CASE
        WHEN tgenabled = 'O' THEN '✅ ACTIVO'
        WHEN tgenabled = 'D' THEN '❌ DESACTIVADO'
        ELSE '⚠️ ESTADO DESCONOCIDO'
    END as status
FROM pg_trigger
WHERE tgname = 'trigger_create_contract_from_conditions';

-- Probar manualmente la función trigger (simular INSERT)
DO $$
DECLARE
    mock_new RECORD;
    test_contract_id UUID;
BEGIN
    RAISE NOTICE '🧪 Probando función trigger manualmente...';

    -- Simular el registro NEW que recibiría el trigger
    mock_new := ROW(
        gen_random_uuid()::uuid,  -- application_id
        '2025-01-01'::date,       -- contract_start_date
        12,                       -- contract_duration_months
        500000.00,                -- final_rent_price
        500000.00,                -- guarantee_amount
        5,                        -- monthly_payment_day
        'Corredor Test',          -- broker_name
        '12.345.678-9',          -- broker_rut
        25000.00,                 -- brokerage_commission
        true,                     -- accepts_pets
        false,                    -- dicom_clause
        'test@example.com',       -- notification_email
        'Banco Estado',           -- bank_name
        'Cuenta Corriente',       -- account_type
        '123456789',              -- account_number
        'Test Owner',             -- account_holder_name
        '11.111.111-1',          -- account_holder_rut
        'Condiciones test',       -- additional_conditions
        'transferencia_bancaria', -- payment_method
        'landlord@test.com',      -- landlord_email
        false,                    -- is_furnished
        gen_random_uuid()::uuid   -- created_by
    );

    -- Intentar ejecutar la lógica del trigger manualmente
    -- (Esto debería funcionar si la función está corregida)
    BEGIN
        -- Simular la lógica del trigger
        INSERT INTO rental_contracts (
            application_id,
            status,
            start_date,
            validity_period_months,
            final_amount,
            guarantee_amount,
            final_amount_currency,
            guarantee_amount_currency,
            payment_day,
            account_holder_name,
            account_number,
            account_bank,
            account_type,
            has_brokerage_commission,
            broker_name,
            broker_amount,
            broker_rut,
            allows_pets,
            is_furnished,
            has_dicom_clause,
            tenant_email,
            landlord_email,
            created_by,
            notes,
            contract_content,
            contract_html
        ) VALUES (
            mock_new.application_id,
            'draft',
            mock_new.contract_start_date,
            mock_new.contract_duration_months,
            mock_new.final_rent_price,
            COALESCE(mock_new.guarantee_amount, mock_new.final_rent_price),
            'clp',
            'clp',
            mock_new.monthly_payment_day,
            mock_new.account_holder_name,
            mock_new.account_number,
            mock_new.bank_name,
            CASE
                WHEN mock_new.account_type = 'Cuenta Corriente' THEN 'corriente'
                WHEN mock_new.account_type = 'Cuenta Vista' THEN 'vista'
                WHEN mock_new.account_type = 'Cuenta de Ahorro' THEN 'ahorro'
                ELSE 'corriente'
            END,
            CASE WHEN mock_new.brokerage_commission > 0 THEN true ELSE false END,
            NULLIF(TRIM(mock_new.broker_name), ''),
            mock_new.brokerage_commission,
            NULLIF(TRIM(mock_new.broker_rut), ''),
            COALESCE(mock_new.accepts_pets, false),
            COALESCE(mock_new.is_furnished, false),
            COALESCE(mock_new.dicom_clause, false),
            'tenant@test.com',  -- Simulado
            mock_new.landlord_email,
            mock_new.created_by,
            'Test manual del trigger - ' || NOW()::TEXT,
            '{}'::jsonb,  -- Debería funcionar
            NULL
        )
        RETURNING id INTO test_contract_id;

        RAISE NOTICE '✅ Test manual exitoso - Contrato creado: %', test_contract_id;

        -- Limpiar el contrato de prueba
        DELETE FROM rental_contracts WHERE id = test_contract_id;
        RAISE NOTICE '✅ Contrato de prueba eliminado';

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error en test manual: %', SQLERRM;
            RAISE NOTICE '   Código de error: %', SQLSTATE;
    END;

END $$;

-- Verificar si hay algún problema con la constraint
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'check_contract_has_content'
  AND conrelid = 'rental_contracts'::regclass;

-- Ver resumen final
SELECT
    'Resumen de diagnóstico:' as status,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_contract_from_conditions') THEN '✅ Función existe'
        ELSE '❌ Función no existe'
    END as function_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_contract_from_conditions' AND tgenabled = 'O') THEN '✅ Trigger activo'
        ELSE '❌ Trigger inactivo'
    END as trigger_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_contract_has_content' AND conrelid = 'rental_contracts'::regclass) THEN '✅ Constraint existe'
        ELSE '❌ Constraint no existe'
    END as constraint_status;








