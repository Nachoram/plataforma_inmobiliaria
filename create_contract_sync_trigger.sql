-- =====================================================
-- TRIGGER: Crear contrato automáticamente al crear condiciones
-- =====================================================

-- Función que crea contrato automáticamente cuando se crean condiciones
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
        NULL,  -- contract_content
        NULL   -- contract_html
    )
    RETURNING id INTO contract_id;

    -- Log del contrato creado
    RAISE NOTICE 'Contrato creado automáticamente: % para aplicación: %', contract_id, NEW.application_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger que se ejecuta DESPUÉS de INSERTAR en rental_contract_conditions
DROP TRIGGER IF EXISTS trigger_create_contract_from_conditions ON rental_contract_conditions;
CREATE TRIGGER trigger_create_contract_from_conditions
    AFTER INSERT ON rental_contract_conditions
    FOR EACH ROW
    EXECUTE FUNCTION create_contract_from_conditions();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el trigger se creó correctamente
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_contract_from_conditions';

-- Verificar que la función existe
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'create_contract_from_conditions';

-- =====================================================
-- PRUEBA DEL SISTEMA
-- =====================================================

-- Script de prueba (descomenta para probar):
/*
-- Insertar condiciones de prueba (ajusta los IDs según tus datos)
INSERT INTO rental_contract_conditions (
    application_id,
    contract_start_date,
    contract_duration_months,
    final_rent_price,
    guarantee_amount,
    monthly_payment_day,
    broker_name,
    broker_rut,
    brokerage_commission,
    accepts_pets,
    dicom_clause,
    notification_email,
    bank_name,
    account_type,
    account_number,
    account_holder_name,
    account_holder_rut,
    created_by
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid, -- Ajusta este ID
    '2025-01-01',
    12,
    500000.00,
    500000.00,
    5,
    'Corredor Test',
    '12.345.678-9',
    25000.00,
    true,
    false,
    'test@example.com',
    'Banco Estado',
    'Cuenta Corriente',
    '123456789',
    'Test Owner',
    '11.111.111-1',
    '550e8400-e29b-41d4-a716-446655440001'::uuid -- Ajusta este ID de usuario
);

-- Verificar que se creó el contrato
SELECT
    id,
    application_id,
    status,
    final_amount,
    start_date,
    tenant_email,
    landlord_email,
    created_at
FROM rental_contracts
WHERE application_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
*/









