-- =====================================================
-- MIGRACIÓN COMPLETA DEL SISTEMA DE ANULACIÓN DE APROBACIONES
-- Ejecutar en SQL Editor de Supabase Dashboard
-- Fecha: 2025-11-11
-- =====================================================

-- 1. AGREGAR CAMPOS DE AUDITORÍA OPCIONALES A APPLICATIONS
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS undo_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS undo_requested_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS undo_reason TEXT;

COMMENT ON COLUMN applications.undo_date IS 'Fecha y hora cuando se anuló la aprobación de esta postulación';
COMMENT ON COLUMN applications.undo_requested_by IS 'Usuario que solicitó la anulación de la aprobación';
COMMENT ON COLUMN applications.undo_reason IS 'Razón por la cual se anuló la aprobación';

-- 2. ACTUALIZAR FUNCIÓN DE REVERTIR APROBACIÓN
CREATE OR REPLACE FUNCTION revert_application_approval(
    p_application_id UUID,
    p_reverted_by UUID,
    p_undo_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    contract_exists BOOLEAN := FALSE;
    application_record RECORD;
BEGIN
    -- Obtener información de la aplicación
    SELECT * INTO application_record
    FROM applications
    WHERE id = p_application_id;

    -- Verificar que la aplicación exista
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application % does not exist', p_application_id;
    END IF;

    -- Verificar que la aplicación esté aprobada
    IF application_record.status != 'aprobada'::application_status_enum THEN
        RAISE EXCEPTION 'Application % is not approved (current status: %)', p_application_id, application_record.status;
    END IF;

    -- Verificar si existe un contrato para esta aplicación
    SELECT EXISTS(
        SELECT 1 FROM rental_contracts
        WHERE application_id = p_application_id
    ) INTO contract_exists;

    -- Si existe un contrato, verificar que no esté firmado
    IF contract_exists THEN
        -- Solo permitir eliminar contratos en estado 'draft'
        IF EXISTS(
            SELECT 1 FROM rental_contracts
            WHERE application_id = p_application_id
            AND status != 'draft'
        ) THEN
            RAISE EXCEPTION 'Cannot undo approval: Contract for application % is already signed', p_application_id;
        END IF;

        -- Eliminar el contrato draft
        DELETE FROM rental_contracts
        WHERE application_id = p_application_id;

        RAISE NOTICE 'Draft contract deleted for application %', p_application_id;
    END IF;

    -- Actualizar el estado de la aplicación y campos de undo
    UPDATE applications
    SET
        status = 'pendiente'::application_status_enum,
        approved_at = NULL,
        approved_by = NULL,
        undo_date = NOW(),
        undo_requested_by = p_reverted_by,
        undo_reason = p_undo_reason,
        updated_at = NOW()
    WHERE id = p_application_id;

    -- Registrar la acción en el audit log usando la función existente
    PERFORM log_application_audit(
        p_application_id,
        application_record.property_id,
        p_reverted_by,
        'undo_approval',
        'aprobada',
        'pendiente',
        jsonb_build_object(
            'reason', p_undo_reason,
            'contract_existed', contract_exists,
            'contract_status', CASE WHEN contract_exists THEN 'draft' ELSE null END,
            'undo_requested_by', p_reverted_by,
            'undo_date', NOW()
        ),
        CASE
            WHEN p_undo_reason IS NOT NULL THEN format('Aprobación anulada: %s', p_undo_reason)
            ELSE 'Aprobación anulada desde panel administrativo'
        END,
        NULL, -- ip_address
        NULL  -- user_agent
    );

    RAISE NOTICE 'Application % approval reverted successfully', p_application_id;
    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error reverting approval for application %: %', p_application_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION revert_application_approval(UUID, UUID, TEXT) TO authenticated;

-- 3. FUNCIÓN HELPER PARA VERIFICAR SI SE PUEDE ANULAR APROBACIÓN
CREATE OR REPLACE FUNCTION can_undo_application_approval(p_application_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    application_status TEXT;
    contract_status TEXT;
BEGIN
    -- Verificar estado de la aplicación
    SELECT status INTO application_status
    FROM applications
    WHERE id = p_application_id;

    IF application_status IS NULL THEN
        RETURN jsonb_build_object(
            'can_undo', false,
            'reason', 'Application not found'
        );
    END IF;

    IF application_status != 'aprobada' THEN
        RETURN jsonb_build_object(
            'can_undo', false,
            'reason', format('Application status is %s (must be approved)', application_status)
        );
    END IF;

    -- Verificar si existe contrato firmado
    SELECT status INTO contract_status
    FROM rental_contracts
    WHERE application_id = p_application_id;

    IF contract_status IS NOT NULL AND contract_status != 'draft' THEN
        RETURN jsonb_build_object(
            'can_undo', false,
            'reason', format('Contract exists and is %s (cannot undo)', contract_status)
        );
    END IF;

    -- Si llega aquí, se puede anular
    RETURN jsonb_build_object(
        'can_undo', true,
        'contract_exists', contract_status IS NOT NULL,
        'contract_status', contract_status
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'can_undo', false,
            'reason', format('Error checking application: %s', SQLERRM)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_undo_application_approval(UUID) TO authenticated;

-- 4. ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_applications_undo_date ON applications(undo_date);
CREATE INDEX IF NOT EXISTS idx_applications_undo_requested_by ON applications(undo_requested_by);

-- 5. VERIFICACIÓN FINAL
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE MIGRACIÓN ===';

    -- Verificar que las funciones existan
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('revert_application_approval', 'can_undo_application_approval', 'log_application_audit');

    RAISE NOTICE 'Funciones disponibles: % de 3', function_count;

    -- Verificar que los campos existan
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'applications'
        AND column_name IN ('undo_date', 'undo_requested_by', 'undo_reason')
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✓ Campos de auditoría agregados correctamente';
    ELSE
        RAISE NOTICE '⚠ Algunos campos de auditoría pueden faltar';
    END IF;

    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
END $$;


