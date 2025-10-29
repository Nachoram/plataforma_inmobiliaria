-- Crear tabla application_modifications para historial detallado de modificaciones
-- Esta tabla almacena todas las modificaciones realizadas a postulaciones aceptadas

CREATE TABLE IF NOT EXISTS application_modifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Información del usuario que realizó la modificación
    modified_by UUID NOT NULL REFERENCES auth.users(id),
    modified_at TIMESTAMPTZ DEFAULT NOW(),

    -- Campos modificables (solo algunos pueden editarse según reglas de negocio)
    comments TEXT NOT NULL, -- Siempre obligatorio
    adjusted_score INTEGER, -- Opcional: nuevo score de riesgo
    additional_documents TEXT, -- Opcional: documentos adicionales solicitados
    special_conditions TEXT, -- Opcional: condiciones especiales

    -- Metadata de auditoría
    ip_address INET,
    user_agent TEXT,
    modification_reason TEXT, -- Motivo de la modificación

    -- Control de versiones (por si se permiten múltiples modificaciones)
    version INTEGER DEFAULT 1,
    previous_modification_id UUID REFERENCES application_modifications(id),

    -- Timestamp de creación
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_application_modifications_application_id ON application_modifications(application_id);
CREATE INDEX IF NOT EXISTS idx_application_modifications_property_id ON application_modifications(property_id);
CREATE INDEX IF NOT EXISTS idx_application_modifications_modified_by ON application_modifications(modified_by);
CREATE INDEX IF NOT EXISTS idx_application_modifications_modified_at ON application_modifications(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_modifications_version ON application_modifications(version);

-- Políticas RLS (Row Level Security)
ALTER TABLE application_modifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver modificaciones de propiedades que les pertenecen
CREATE POLICY "Users can view modifications for their properties" ON application_modifications
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Política: Solo el sistema puede insertar registros de modificación (a través de funciones)
CREATE POLICY "Only system can insert modifications" ON application_modifications
    FOR INSERT WITH CHECK (true);

-- Comentarios en la tabla y columnas
COMMENT ON TABLE application_modifications IS 'Historial detallado de modificaciones realizadas a postulaciones aceptadas';
COMMENT ON COLUMN application_modifications.comments IS 'Comentarios obligatorios explicando la modificación';
COMMENT ON COLUMN application_modifications.adjusted_score IS 'Nuevo score de riesgo asignado (opcional)';
COMMENT ON COLUMN application_modifications.additional_documents IS 'Documentos adicionales solicitados (opcional)';
COMMENT ON COLUMN application_modifications.special_conditions IS 'Condiciones especiales agregadas (opcional)';
COMMENT ON COLUMN application_modifications.version IS 'Número de versión de la modificación';
COMMENT ON COLUMN application_modifications.previous_modification_id IS 'ID de la modificación anterior (para tracking de versiones)';

-- Función para registrar una modificación
CREATE OR REPLACE FUNCTION log_application_modification(
    p_application_id UUID,
    p_property_id UUID,
    p_modified_by UUID,
    p_comments TEXT,
    p_adjusted_score INTEGER DEFAULT NULL,
    p_additional_documents TEXT DEFAULT NULL,
    p_special_conditions TEXT DEFAULT NULL,
    p_modification_reason TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    modification_id UUID;
    current_version INTEGER;
BEGIN
    -- Obtener la versión más reciente para esta aplicación
    SELECT COALESCE(MAX(version), 0) + 1
    INTO current_version
    FROM application_modifications
    WHERE application_id = p_application_id;

    -- Insertar la nueva modificación
    INSERT INTO application_modifications (
        application_id,
        property_id,
        modified_by,
        comments,
        adjusted_score,
        additional_documents,
        special_conditions,
        modification_reason,
        ip_address,
        user_agent,
        version
    ) VALUES (
        p_application_id,
        p_property_id,
        p_modified_by,
        p_comments,
        p_adjusted_score,
        p_additional_documents,
        p_special_conditions,
        p_modification_reason,
        p_ip_address,
        p_user_agent,
        current_version
    ) RETURNING id INTO modification_id;

    -- Actualizar el estado de la aplicación a 'modificada' si no lo está ya
    UPDATE applications
    SET status = 'modificada'::application_status_enum,
        updated_at = NOW()
    WHERE id = p_application_id
    AND status = 'aprobada';

    RETURN modification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el historial de modificaciones de una aplicación
CREATE OR REPLACE FUNCTION get_application_modifications(p_application_id UUID)
RETURNS TABLE (
    id UUID,
    modified_by UUID,
    modified_at TIMESTAMPTZ,
    comments TEXT,
    adjusted_score INTEGER,
    additional_documents TEXT,
    special_conditions TEXT,
    modification_reason TEXT,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        am.id,
        am.modified_by,
        am.modified_at,
        am.comments,
        am.adjusted_score,
        am.additional_documents,
        am.special_conditions,
        am.modification_reason,
        am.version
    FROM application_modifications am
    WHERE am.application_id = p_application_id
    ORDER BY am.version DESC, am.modified_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON application_modifications TO authenticated;
GRANT EXECUTE ON FUNCTION log_application_modification TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_modifications TO authenticated;

-- Función helper para verificar si una aplicación tiene modificaciones
CREATE OR REPLACE FUNCTION application_has_modifications(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM application_modifications
        WHERE application_id = p_application_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION application_has_modifications TO authenticated;
