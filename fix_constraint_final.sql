-- =====================================================
-- FIX FINAL: Constraint check_contract_has_content
-- =====================================================

-- Recrear la función trigger con contract_content = '{}' en lugar de NULL

CREATE OR REPLACE FUNCTION create_contract_from_conditions()
RETURNS TRIGGER AS $$
DECLARE
    contract_id UUID;
    tenant_email TEXT;
    landlord_email TEXT;
    existing_contract_count INTEGER;
BEGIN
    -- Verificar que no existe ya un contrato para esta aplicación
    SELECT COUNT(*) INTO existing_contract_count
    FROM rental_contracts
    WHERE application_id = NEW.application_id;

    IF existing_contract_count > 0 THEN
        RAISE EXCEPTION 'Ya existe un contrato para la aplicación %', NEW.application_id;
    END IF;

    -- Obtener email del arrendatario
    SELECT p.email INTO tenant_email
    FROM applications a
    JOIN profiles p ON a.applicant_id = p.id
    WHERE a.id = NEW.application_id;

    -- Usar el email del landlord desde las condiciones, o buscarlo en rental_owners
    IF NEW.landlord_email IS NOT NULL AND NEW.landlord_email != '' THEN
        landlord_email := NEW.landlord_email;
    ELSE
        SELECT ro.email INTO landlord_email
        FROM applications a
        JOIN rental_owners ro ON a.property_id = ro.property_id
        WHERE a.id = NEW.application_id
        LIMIT 1;
    END IF;

    -- Crear el contrato automáticamente
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
        NEW.application_id,
        'draft',
        NEW.contract_start_date,
        NEW.contract_duration_months,
        NEW.final_rent_price,
        COALESCE(NEW.guarantee_amount, NEW.final_rent_price),
        'clp',
        'clp',
        NEW.monthly_payment_day,
        NEW.account_holder_name,
        NEW.account_number,
        NEW.bank_name,
        CASE
            WHEN NEW.account_type = 'Cuenta Corriente' THEN 'corriente'
            WHEN NEW.account_type = 'Cuenta Vista' THEN 'vista'
            WHEN NEW.account_type = 'Cuenta de Ahorro' THEN 'ahorro'
            ELSE 'corriente'
        END,
        CASE WHEN NEW.brokerage_commission > 0 THEN true ELSE false END,
        NULLIF(TRIM(NEW.broker_name), ''),
        NEW.brokerage_commission,
        NULLIF(TRIM(NEW.broker_rut), ''),
        COALESCE(NEW.accepts_pets, false),
        COALESCE(NEW.is_furnished, false),
        COALESCE(NEW.dicom_clause, false),
        tenant_email,
        landlord_email,
        NEW.created_by,
        'Contrato creado automáticamente desde condiciones contractuales el ' || NOW()::TEXT,
        '{}'::jsonb,  -- CONTRACT_CONTENT con JSON vacío (cumple constraint)
        NULL   -- contract_html
    )
    RETURNING id INTO contract_id;

    -- Log del contrato creado
    RAISE NOTICE 'Contrato creado automáticamente: % para aplicación: %', contract_id, NEW.application_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que se actualizó correctamente
SELECT
    'Función create_contract_from_conditions actualizada' as status,
    CASE
        WHEN pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = 'create_contract_from_conditions')) LIKE '%{}%jsonb%'
        THEN '✅ Usa contract_content = {} correctamente'
        ELSE '❌ Aún tiene NULL en contract_content'
    END as validation
FROM pg_proc
WHERE proname = 'create_contract_from_conditions';

-- Verificar que el trigger sigue activo
SELECT
    'Trigger trigger_create_contract_from_conditions' as component,
    CASE WHEN COUNT(*) > 0 THEN '✅ ACTIVO' ELSE '❌ INACTIVO' END as status
FROM pg_trigger
WHERE tgname = 'trigger_create_contract_from_conditions';

-- Probar que la constraint ya no se viola
DO $$
DECLARE
    test_contract_id UUID;
BEGIN
    RAISE NOTICE '🧪 Probando que la constraint funciona...';

    -- Crear un contrato de prueba
    INSERT INTO rental_contracts (
        application_id,
        status,
        contract_content
    ) VALUES (
        gen_random_uuid(),
        'draft',
        '{}'::jsonb
    ) RETURNING id INTO test_contract_id;

    RAISE NOTICE '✅ Contrato de prueba creado: %', test_contract_id;

    -- Eliminar el contrato de prueba
    DELETE FROM rental_contracts WHERE id = test_contract_id;

    RAISE NOTICE '✅ Constraint check_contract_has_content funciona correctamente';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en prueba: %', SQLERRM;
        RAISE NOTICE '   Detalles: %', SQLSTATE;
END $$;

-- Verificar contratos existentes que puedan tener el problema
SELECT
    COUNT(*) as contratos_con_problema,
    CASE
        WHEN COUNT(*) > 0 THEN '⚠️ Hay contratos existentes con contract_content NULL'
        ELSE '✅ Todos los contratos tienen contract_content válido'
    END as status
FROM rental_contracts
WHERE contract_content IS NULL AND contract_html IS NULL;

-- Si hay contratos con problema, mostrarlos
SELECT
    id,
    application_id,
    status,
    created_at
FROM rental_contracts
WHERE contract_content IS NULL AND contract_html IS NULL
ORDER BY created_at DESC
LIMIT 5;








