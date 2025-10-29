-- Sistema de Auditoría para Cambios en Postulaciones
-- ===================================================

-- Tabla para registrar todos los cambios en postulaciones
CREATE TABLE IF NOT EXISTS application_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Tipo de acción realizada
    action_type TEXT NOT NULL CHECK (action_type IN (
        'approve',           -- Aprobar postulación
        'reject',            -- Rechazar postulación
        'undo_approval',     -- Deshacer aprobación
        'modify_acceptance', -- Modificar aceptación
        'generate_contract', -- Generar contrato
        'sign_contract',     -- Firmar contrato
        'cancel_contract'    -- Cancelar contrato
    )),

    -- Estado anterior y nuevo
    previous_status TEXT,
    new_status TEXT,

    -- Detalles de la acción (JSON para flexibilidad)
    action_details JSONB DEFAULT '{}',

    -- Información adicional
    ip_address INET,
    user_agent TEXT,
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_application_audit_log_application_id ON application_audit_log(application_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_property_id ON application_audit_log(property_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_user_id ON application_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_action_type ON application_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_created_at ON application_audit_log(created_at DESC);

-- Políticas RLS (Row Level Security)
ALTER TABLE application_audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver auditorías de propiedades que les pertenecen
CREATE POLICY "Users can view audit logs for their properties" ON application_audit_log
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Política: Solo el sistema puede insertar registros de auditoría
CREATE POLICY "Only system can insert audit logs" ON application_audit_log
    FOR INSERT WITH CHECK (true);

-- Comentarios en la tabla
COMMENT ON TABLE application_audit_log IS 'Registro de auditoría completo para todas las acciones realizadas en postulaciones';
COMMENT ON COLUMN application_audit_log.action_type IS 'Tipo de acción: approve, reject, undo_approval, modify_acceptance, generate_contract, sign_contract, cancel_contract';
COMMENT ON COLUMN application_audit_log.action_details IS 'Detalles específicos de la acción en formato JSON';
COMMENT ON COLUMN application_audit_log.previous_status IS 'Estado de la postulación antes de la acción';
COMMENT ON COLUMN application_audit_log.new_status IS 'Estado de la postulación después de la acción';

-- Función para registrar eventos de auditoría
CREATE OR REPLACE FUNCTION log_application_audit(
    p_application_id UUID,
    p_property_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_previous_status TEXT DEFAULT NULL,
    p_new_status TEXT DEFAULT NULL,
    p_action_details JSONB DEFAULT '{}',
    p_notes TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO application_audit_log (
        application_id,
        property_id,
        user_id,
        action_type,
        previous_status,
        new_status,
        action_details,
        notes,
        ip_address,
        user_agent,
        created_by
    ) VALUES (
        p_application_id,
        p_property_id,
        p_user_id,
        p_action_type,
        p_previous_status,
        p_new_status,
        p_action_details,
        p_notes,
        p_ip_address,
        p_user_agent,
        p_user_id
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para obtener el property_id de una aplicación
CREATE OR REPLACE FUNCTION get_application_property_id(app_id UUID)
RETURNS UUID AS $$
    SELECT property_id FROM applications WHERE id = app_id;
$$ LANGUAGE SQL STABLE;

-- Grant permissions
GRANT SELECT ON application_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_application_audit TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_property_id TO authenticated;

-- Ejemplo de uso:
-- SELECT log_application_audit(
--     'application-uuid'::uuid,
--     'property-uuid'::uuid,
--     'user-uuid'::uuid,
--     'undo_approval',
--     'aprobada',
--     'pendiente',
--     '{"reason": "Error en la evaluación", "requested_by": "owner"}'::jsonb,
--     'Deshacer aprobación por error administrativo'
-- );

COMMENT ON FUNCTION log_application_audit IS 'Función para registrar eventos de auditoría en postulaciones con todos los detalles necesarios';
COMMENT ON FUNCTION get_application_property_id IS 'Función helper para obtener el property_id de una aplicación';
