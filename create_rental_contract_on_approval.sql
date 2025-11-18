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
    guarantee_amount := COALESCE(property_record.guarantee_amount, 0);

    -- Si hay datos bancarios en rental_owners, usarlos
    IF rental_owner_record IS NOT NULL THEN
        account_holder_name := COALESCE(rental_owner_record.account_holder_name, '');
        account_number := COALESCE(rental_owner_record.account_number, '');
        account_bank := COALESCE(rental_owner_record.account_bank, '');
        account_type := COALESCE(rental_owner_record.account_type, 'corriente');
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
        'draft'::contract_status_enum,
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




