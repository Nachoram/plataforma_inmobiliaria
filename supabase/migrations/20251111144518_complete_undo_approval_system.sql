-- Migración completa para el sistema de anulación de aprobaciones
-- Esta migración consolida todos los cambios necesarios para el sistema de undo approval

-- =====================================================
-- 1. AGREGAR CAMPOS DE AUDITORÍA OPCIONALES A APPLICATIONS
-- =====================================================

-- Agregar campos opcionales para rastrear anulaciones de aprobación
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS undo_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS undo_requested_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS undo_reason TEXT;

-- Comentarios para los nuevos campos
COMMENT ON COLUMN applications.undo_date IS 'Fecha y hora cuando se anuló la aprobación de esta postulación';
COMMENT ON COLUMN applications.undo_requested_by IS 'Usuario que solicitó la anulación de la aprobación';
COMMENT ON COLUMN applications.undo_reason IS 'Razón por la cual se anuló la aprobación';

-- =====================================================
-- 2. ACTUALIZAR FUNCIÓN DE REVERTIR APROBACIÓN
-- =====================================================

-- Función mejorada para anular la aprobación de postulaciones
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

-- =====================================================
-- 3. FUNCIÓN HELPER PARA VERIFICAR SI SE PUEDE ANULAR APROBACIÓN
-- =====================================================

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

-- =====================================================
-- 4. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para los nuevos campos de undo
CREATE INDEX IF NOT EXISTS idx_applications_undo_date ON applications(undo_date);
CREATE INDEX IF NOT EXISTS idx_applications_undo_requested_by ON applications(undo_requested_by);

-- =====================================================
-- 5. ACTUALIZAR POLÍTICAS RLS SI ES NECESARIO
-- =====================================================

-- Asegurar que los campos de undo sean visibles para los propietarios
-- (Las políticas existentes deberían cubrir esto, pero por claridad)

-- =====================================================
-- 6. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION revert_application_approval(UUID, UUID, TEXT) IS 'Anula la aprobación de una postulación, revirtiéndola a estado pendiente y eliminando contratos draft si existen';
COMMENT ON FUNCTION can_undo_application_approval(UUID) IS 'Verifica si se puede anular la aprobación de una postulación y retorna detalles del estado';

-- =====================================================
-- 7. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todo esté configurado correctamente
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    -- Verificar que las funciones existan
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('revert_application_approval', 'can_undo_application_approval', 'log_application_audit');

    IF function_count < 3 THEN
        RAISE NOTICE 'Warning: Not all required functions are available. Found % of 3 expected functions.', function_count;
    ELSE
        RAISE NOTICE 'All required functions are available.';
    END IF;

    -- Verificar que los campos existan
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'applications'
        AND column_name IN ('undo_date', 'undo_requested_by', 'undo_reason')
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Undo audit fields added successfully to applications table.';
    ELSE
        RAISE NOTICE 'Warning: Some undo audit fields may be missing.';
    END IF;
END $$;
