-- Función para anular la aprobación de postulaciones
CREATE OR REPLACE FUNCTION revert_application_approval(
    p_application_id UUID,
    p_reverted_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    contract_exists BOOLEAN := FALSE;
BEGIN
    -- Verificar que la aplicación esté aprobada
    IF NOT EXISTS (
        SELECT 1 FROM applications
        WHERE id = p_application_id AND status = 'aprobada'::application_status_enum
    ) THEN
        RAISE EXCEPTION 'Application % is not approved or does not exist', p_application_id;
    END IF;

    -- Verificar si existe un contrato para esta aplicación
    SELECT EXISTS(
        SELECT 1 FROM rental_contracts
        WHERE application_id = p_application_id
    ) INTO contract_exists;

    -- Si existe un contrato, eliminarlo
    IF contract_exists THEN
        DELETE FROM rental_contracts
        WHERE application_id = p_application_id;

        RAISE NOTICE 'Contract deleted for application %', p_application_id;
    END IF;

    -- Revertir el estado de la aplicación a 'pendiente'
    UPDATE applications
    SET
        status = 'pendiente'::application_status_enum,
        approved_at = NULL,
        approved_by = NULL,
        updated_at = NOW()
    WHERE id = p_application_id;

    -- Registrar la acción en el audit log
    INSERT INTO application_audit_log (
        application_id,
        property_id,
        created_by,
        event_type,
        event_data,
        notes,
        ip_address,
        user_agent
    )
    SELECT
        a.id,
        a.property_id,
        p_reverted_by,
        'approval_reverted',
        jsonb_build_object(
            'previous_status', 'aprobada',
            'new_status', 'pendiente',
            'contract_deleted', contract_exists,
            'reverted_at', NOW()
        ),
        CASE
            WHEN contract_exists THEN 'Aprobación anulada y contrato eliminado'
            ELSE 'Aprobación anulada (sin contrato asociado)'
        END,
        NULL, -- ip_address
        NULL  -- user_agent
    FROM applications a
    WHERE a.id = p_application_id;

    RAISE NOTICE 'Application % approval reverted successfully', p_application_id;
    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error reverting approval for application %: %', p_application_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION revert_application_approval(UUID, UUID) TO authenticated;


