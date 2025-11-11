-- Función para sincronizar datos de rental_contract_conditions a rental_contracts
CREATE OR REPLACE FUNCTION sync_contract_conditions_to_rental_contract(
    p_application_id UUID
)
RETURNS UUID AS $$
DECLARE
    contract_id UUID;
    conditions_record RECORD;
    application_record RECORD;
    property_record RECORD;
    applicant_record RECORD;
    landlord_record RECORD;
    rental_owner_record RECORD;
    tenant_email TEXT;
    landlord_email TEXT;
    final_amount NUMERIC(12,2);
    guarantee_amount NUMERIC(12,2);
    start_date DATE;
    validity_period_months INTEGER := 12;
BEGIN
    -- Obtener datos de las condiciones del contrato
    SELECT * INTO conditions_record
    FROM rental_contract_conditions
    WHERE application_id = p_application_id;

    -- Si no hay condiciones, no hacer nada
    IF NOT FOUND THEN
        RAISE NOTICE 'No hay condiciones contractuales para la aplicación: %', p_application_id;
        RETURN NULL;
    END IF;

    -- Obtener datos de la aplicación
    SELECT * INTO application_record
    FROM applications
    WHERE id = p_application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found: %', p_application_id;
    END IF;

    -- Obtener datos de la propiedad
    SELECT * INTO property_record
    FROM properties
    WHERE id = application_record.property_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Property not found: %', application_record.property_id;
    END IF;

    -- Obtener datos del arrendador (owner de la propiedad)
    SELECT p.* INTO landlord_record
    FROM profiles p
    WHERE p.id = property_record.owner_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Landlord not found: %', property_record.owner_id;
    END IF;

    -- Obtener datos del inquilino (applicant)
    SELECT aa.* INTO applicant_record
    FROM application_applicants aa
    WHERE aa.application_id = p_application_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Applicant not found for application: %', p_application_id;
    END IF;

    -- Obtener datos del rental_owner para información bancaria adicional
    SELECT ro.* INTO rental_owner_record
    FROM rental_owners ro
    WHERE ro.property_id = application_record.property_id
    LIMIT 1;

    -- Establecer emails
    tenant_email := COALESCE(applicant_record.email, '');
    landlord_email := COALESCE(landlord_record.email, conditions_record.notification_email, '');

    -- Establecer fecha de inicio desde condiciones
    start_date := COALESCE(conditions_record.contract_start_date::DATE, CURRENT_DATE);

    -- Establecer montos desde condiciones
    final_amount := COALESCE(conditions_record.final_rent_price, property_record.price_clp::NUMERIC, 0);
    guarantee_amount := COALESCE(conditions_record.guarantee_amount, final_amount);

    -- Verificar si ya existe un contrato para esta aplicación
    SELECT id INTO contract_id
    FROM rental_contracts
    WHERE application_id = p_application_id;

    IF FOUND THEN
        -- Actualizar contrato existente con datos de condiciones
        UPDATE rental_contracts SET
            -- Información financiera
            final_amount = final_amount,
            guarantee_amount = guarantee_amount,
            final_amount_currency = 'clp',
            guarantee_amount_currency = 'clp',

            -- Fechas
            start_date = start_date,
            validity_period_months = COALESCE(conditions_record.contract_duration_months, 12),

            -- Información bancaria desde condiciones
            account_holder_name = COALESCE(conditions_record.account_holder_name, rental_owner_record.account_holder_name, ''),
            account_number = COALESCE(conditions_record.account_number, rental_owner_record.account_number, ''),
            account_bank = COALESCE(conditions_record.bank_name, rental_owner_record.account_bank, ''),
            account_type = COALESCE(
                CASE
                    WHEN conditions_record.account_type = 'Cuenta Corriente' THEN 'corriente'
                    WHEN conditions_record.account_type = 'Cuenta Vista' THEN 'vista'
                    WHEN conditions_record.account_type = 'Cuenta de Ahorro' THEN 'ahorro'
                    ELSE 'corriente'
                END,
                rental_owner_record.account_type,
                'corriente'
            ),

            -- Emails
            tenant_email = tenant_email,
            landlord_email = landlord_email,

            -- Condiciones especiales
            has_dicom_clause = COALESCE(conditions_record.dicom_clause, false),
            allows_pets = COALESCE(conditions_record.accepts_pets, false),
            is_furnished = false, -- Por defecto false, se puede actualizar manualmente

            -- Información del corredor
            has_brokerage_commission = CASE WHEN conditions_record.brokerage_commission > 0 THEN true ELSE false END,
            broker_name = conditions_record.broker_name,
            broker_amount = conditions_record.brokerage_commission,
            broker_rut = conditions_record.broker_rut,

            -- Notas adicionales
            notes = COALESCE(
                CASE
                    WHEN notes IS NOT NULL AND notes != '' THEN notes || ' | '
                    ELSE ''
                END || 'Actualizado desde condiciones contractuales el ' || NOW()::TEXT,
                'Actualizado desde condiciones contractuales el ' || NOW()::TEXT
            ),

            -- Actualizar timestamp
            updated_at = NOW()

        WHERE id = contract_id;

        RAISE NOTICE 'Contrato actualizado con datos de condiciones: %', contract_id;

    ELSE
        RAISE EXCEPTION 'No existe contrato para actualizar. Primero debe crearse el contrato básico.';
    END IF;

    RETURN contract_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error sincronizando condiciones a contrato para aplicación %: %', p_application_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear contrato de alquiler automáticamente al aprobar postulación
CREATE OR REPLACE FUNCTION create_rental_contract_on_approval(
    p_application_id UUID,
    p_approved_by UUID
)
RETURNS UUID AS $$
DECLARE
    contract_id UUID;
    application_record RECORD;
    property_record RECORD;
    applicant_record RECORD;
    landlord_record RECORD;
    guarantor_record RECORD;
    rental_owner_record RECORD;
    tenant_email TEXT;
    landlord_email TEXT;
    start_date DATE;
    final_amount NUMERIC(12,2);
    guarantee_amount NUMERIC(12,2);
    validity_period_months INTEGER := 12;
    final_amount_currency TEXT := 'clp';
    guarantee_amount_currency TEXT := 'clp';
    account_holder_name TEXT := '';
    account_number TEXT := '';
    account_bank TEXT := '';
    account_type TEXT := 'corriente';
    has_dicom_clause BOOLEAN := false;
    allows_pets BOOLEAN := false;
    is_furnished BOOLEAN := false;
    has_brokerage_commission BOOLEAN := false;
    broker_name TEXT := NULL;
    broker_amount NUMERIC(10,2) := NULL;
    broker_rut TEXT := NULL;
BEGIN
    -- Obtener datos de la aplicación
    SELECT * INTO application_record
    FROM applications
    WHERE id = p_application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found: %', p_application_id;
    END IF;

    -- Obtener datos de la propiedad
    SELECT * INTO property_record
    FROM properties
    WHERE id = application_record.property_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Property not found: %', application_record.property_id;
    END IF;

    -- Obtener datos del arrendador (owner de la propiedad)
    SELECT p.* INTO landlord_record
    FROM profiles p
    WHERE p.id = property_record.owner_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Landlord not found: %', property_record.owner_id;
    END IF;

    -- Obtener datos del inquilino (applicant)
    SELECT aa.* INTO applicant_record
    FROM application_applicants aa
    WHERE aa.application_id = p_application_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Applicant not found for application: %', p_application_id;
    END IF;

    -- Obtener datos del garante si existe
    SELECT g.* INTO guarantor_record
    FROM guarantors g
    WHERE g.id = application_record.guarantor_id;

    -- Obtener datos del rental_owner para información bancaria
    SELECT ro.* INTO rental_owner_record
    FROM rental_owners ro
    WHERE ro.property_id = application_record.property_id
    LIMIT 1;

    -- Establecer emails
    tenant_email := COALESCE(applicant_record.email, '');
    landlord_email := COALESCE(landlord_record.email, '');

    -- Establecer fecha de inicio (hoy por defecto)
    start_date := CURRENT_DATE;

    -- Establecer montos desde la propiedad
    final_amount := COALESCE(property_record.price_clp::NUMERIC, 0);
    guarantee_amount := final_amount;  -- Usar el precio mensual como garantía por defecto

    -- Si hay datos bancarios en rental_owners, usarlos
    IF rental_owner_record IS NOT NULL THEN
        account_holder_name := COALESCE(rental_owner_record.account_holder_name, '');
        account_number := COALESCE(rental_owner_record.account_number, '');
        account_bank := COALESCE(rental_owner_record.account_bank, '');
        account_type := COALESCE(rental_owner_record.account_type, 'corriente');
    END IF;

    -- Verificar que no exista ya un contrato para esta aplicación
    IF EXISTS (SELECT 1 FROM rental_contracts WHERE application_id = p_application_id) THEN
        RAISE EXCEPTION 'Ya existe un contrato para la aplicación: %', p_application_id;
    END IF;

    -- TODO: Aquí podríamos agregar lógica adicional para determinar:
    -- - has_dicom_clause
    -- - allows_pets
    -- - is_furnished
    -- - has_brokerage_commission y datos del broker
    -- Por ahora dejamos los valores por defecto

    -- Insertar el contrato
    INSERT INTO rental_contracts (
        application_id,
        status,
        contract_content,
        owner_signed_at,
        tenant_signed_at,
        guarantor_signed_at,
        signed_contract_url,
        owner_signature_url,
        tenant_signature_url,
        guarantor_signature_url,
        created_at,
        updated_at,
        approved_at,
        sent_to_signature_at,
        created_by,
        approved_by,
        notes,
        version,
        contract_characteristic_id,
        contract_html,
        contract_format,
        contract_number,
        cancelled_at,
        cancelled_by,
        cancellation_reason,
        final_amount_currency,
        guarantee_amount_currency,
        account_holder_name,
        account_number,
        account_bank,
        account_type,
        start_date,
        validity_period_months,
        final_amount,
        guarantee_amount,
        has_dicom_clause,
        tenant_email,
        landlord_email,
        has_brokerage_commission,
        broker_name,
        broker_amount,
        broker_rut,
        allows_pets,
        is_furnished
    ) VALUES (
        p_application_id,
        'approved'::contract_status_enum,
        NULL, -- contract_content (se genera después)
        NULL, -- owner_signed_at
        NULL, -- tenant_signed_at
        NULL, -- guarantor_signed_at
        NULL, -- signed_contract_url
        NULL, -- owner_signature_url
        NULL, -- tenant_signature_url
        NULL, -- guarantor_signature_url
        NOW(), -- created_at
        NOW(), -- updated_at
        NOW(), -- approved_at
        NULL, -- sent_to_signature_at
        p_approved_by, -- created_by
        p_approved_by, -- approved_by
        'Contrato creado automáticamente al aprobar postulación', -- notes
        1, -- version
        NULL, -- contract_characteristic_id (se genera por trigger)
        NULL, -- contract_html (se genera después)
        'json'::character varying, -- contract_format
        NULL, -- contract_number (se genera por trigger)
        NULL, -- cancelled_at
        NULL, -- cancelled_by
        NULL, -- cancellation_reason
        final_amount_currency,
        guarantee_amount_currency,
        account_holder_name,
        account_number,
        account_bank,
        account_type,
        start_date,
        validity_period_months,
        final_amount,
        guarantee_amount,
        has_dicom_clause,
        tenant_email,
        landlord_email,
        has_brokerage_commission,
        broker_name,
        broker_amount,
        broker_rut,
        allows_pets,
        is_furnished
    ) RETURNING id INTO contract_id;

    -- Intentar sincronizar datos de condiciones contractuales si existen
    BEGIN
        PERFORM sync_contract_conditions_to_rental_contract(p_application_id);
        RAISE NOTICE 'Datos de condiciones contractuales sincronizados para contrato: %', contract_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- No fallar si no hay condiciones, solo registrar
            RAISE NOTICE 'No se pudieron sincronizar condiciones contractuales para contrato %: %', contract_id, SQLERRM;
    END;

    -- Log de creación exitosa
    RAISE NOTICE 'Contrato creado exitosamente: % para aplicación: %', contract_id, p_application_id;

    RETURN contract_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creando contrato para aplicación %: %', p_application_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION create_rental_contract_on_approval(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_contract_conditions_to_rental_contract(UUID) TO authenticated;
