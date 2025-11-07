-- Crear tabla application_audit_log para auditoría completa de postulaciones
-- Esta tabla almacena todas las acciones administrativas realizadas en postulaciones

CREATE TABLE IF NOT EXISTS application_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Información del usuario que realizó la acción
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Tipo de acción/evento
    event_type TEXT NOT NULL, -- 'approve', 'modify_acceptance', 'cancel_contract', 'undo_acceptance', etc.

    -- Estados antes y después de la acción
    previous_status TEXT,
    new_status TEXT,

    -- Detalles de la acción (JSON para flexibilidad)
    event_data JSONB DEFAULT '{}',

    -- Notas adicionales
    notes TEXT,

    -- Metadata técnica
    ip_address INET,
    user_agent TEXT,

    -- Timestamp de creación (duplicado por conveniencia)
    created_at_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_application_audit_log_application_id ON application_audit_log(application_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_property_id ON application_audit_log(property_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_created_by ON application_audit_log(created_by);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_event_type ON application_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_created_at ON application_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_previous_status ON application_audit_log(previous_status);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_new_status ON application_audit_log(new_status);

-- Políticas RLS (Row Level Security)
ALTER TABLE application_audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver logs de auditoría de propiedades que les pertenecen
CREATE POLICY "Users can view audit logs for their properties" ON application_audit_log
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Política: Solo el sistema puede insertar registros de auditoría (a través de funciones)
CREATE POLICY "Only system can insert audit logs" ON application_audit_log
    FOR INSERT WITH CHECK (true);

-- Comentarios en la tabla y columnas
COMMENT ON TABLE application_audit_log IS 'Registro completo de auditoría para todas las acciones administrativas en postulaciones';
COMMENT ON COLUMN application_audit_log.application_id IS 'ID de la postulación afectada';
COMMENT ON COLUMN application_audit_log.property_id IS 'ID de la propiedad (para RLS)';
COMMENT ON COLUMN application_audit_log.created_by IS 'Usuario que realizó la acción';
COMMENT ON COLUMN application_audit_log.event_type IS 'Tipo de acción realizada (approve, modify, cancel, etc.)';
COMMENT ON COLUMN application_audit_log.previous_status IS 'Estado anterior de la postulación';
COMMENT ON COLUMN application_audit_log.new_status IS 'Estado nuevo de la postulación';
COMMENT ON COLUMN application_audit_log.event_data IS 'Datos adicionales específicos de la acción (JSON)';
COMMENT ON COLUMN application_audit_log.notes IS 'Notas adicionales opcionales';

-- Función para registrar una acción en el log de auditoría
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
    -- Insertar el registro de auditoría
    INSERT INTO application_audit_log (
        application_id,
        property_id,
        created_by,
        event_type,
        previous_status,
        new_status,
        event_data,
        notes,
        ip_address,
        user_agent
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
        p_user_agent
    ) RETURNING id INTO audit_id;

    -- Actualizar el updated_at de la aplicación
    UPDATE applications
    SET updated_at = NOW()
    WHERE id = p_application_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON application_audit_log TO authenticated;
GRANT INSERT ON application_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_application_audit TO authenticated;

-- Función helper para obtener conteo de acciones de auditoría por aplicación
CREATE OR REPLACE FUNCTION get_application_audit_count(p_application_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM application_audit_log
        WHERE application_id = p_application_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_application_audit_count TO authenticated;

-- Función helper para verificar si una aplicación tiene registros de auditoría
CREATE OR REPLACE FUNCTION application_has_audit_logs(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM application_audit_log
        WHERE application_id = p_application_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION application_has_audit_logs TO authenticated;












