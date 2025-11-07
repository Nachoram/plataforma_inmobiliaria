-- Crear tabla application_requests para solicitudes formales del postulante al arrendador
-- Esta tabla permite enviar peticiones específicas como cambios de condiciones, prórrogas, etc.

CREATE TABLE IF NOT EXISTS application_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Información del solicitante (siempre el postulante)
    applicant_id UUID NOT NULL REFERENCES auth.users(id),
    applicant_name TEXT NOT NULL,

    -- Información del destinatario (siempre el arrendador)
    landlord_id UUID NOT NULL REFERENCES auth.users(id),
    landlord_name TEXT NOT NULL,

    -- Tipo y detalles de la solicitud
    request_type TEXT NOT NULL CHECK (request_type IN (
        'condition_change',     -- Cambio de condiciones del contrato
        'extension_request',    -- Solicitud de prórroga
        'early_termination',    -- Terminación anticipada
        'modification',         -- Modificación general
        'document_request',     -- Solicitud de documentos adicionales
        'clarification',        -- Petición de aclaraciones
        'complaint',           -- Queja o reclamo
        'other'                -- Otro tipo
    )),

    -- Contenido de la solicitud
    subject TEXT NOT NULL, -- Asunto breve
    description TEXT NOT NULL, -- Descripción detallada
    requested_changes JSONB DEFAULT '{}', -- Cambios específicos solicitados (JSON)

    -- Archivos adjuntos (opcional)
    attachments JSONB DEFAULT '[]', -- Array de URLs de archivos adjuntos

    -- Estado de la solicitud
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    status_changed_by UUID REFERENCES auth.users(id), -- Quién cambió el estado

    -- Respuesta del arrendador (cuando se procesa)
    response TEXT, -- Respuesta del arrendador
    response_attachments JSONB DEFAULT '[]', -- Archivos adjuntos en la respuesta
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES auth.users(id),

    -- Prioridad
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Información técnica
    ip_address INET,
    user_agent TEXT,

    -- Notas internas (solo visibles para el arrendador)
    internal_notes TEXT
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_application_requests_application_id ON application_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_application_requests_property_id ON application_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_application_requests_applicant_id ON application_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_application_requests_landlord_id ON application_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_application_requests_request_type ON application_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_application_requests_status ON application_requests(status);
CREATE INDEX IF NOT EXISTS idx_application_requests_created_at ON application_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_requests_priority ON application_requests(priority);

-- Políticas RLS (Row Level Security)
ALTER TABLE application_requests ENABLE ROW LEVEL SECURITY;

-- Política: Los postulantes solo pueden ver sus propias solicitudes
CREATE POLICY "Applicants can view their own requests" ON application_requests
    FOR SELECT USING (
        applicant_id = auth.uid()
    );

-- Política: Los arrendadores solo pueden ver solicitudes de sus propiedades
CREATE POLICY "Landlords can view requests for their properties" ON application_requests
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Política: Solo los postulantes pueden crear solicitudes
CREATE POLICY "Only applicants can create requests" ON application_requests
    FOR INSERT WITH CHECK (
        applicant_id = auth.uid()
    );

-- Política: Los arrendadores pueden actualizar el estado de solicitudes de sus propiedades
CREATE POLICY "Landlords can update request status for their properties" ON application_requests
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Comentarios en la tabla y columnas
COMMENT ON TABLE application_requests IS 'Sistema de solicitudes formales entre postulantes y arrendadores';
COMMENT ON COLUMN application_requests.application_id IS 'ID de la postulación relacionada';
COMMENT ON COLUMN application_requests.property_id IS 'ID de la propiedad (para RLS)';
COMMENT ON COLUMN application_requests.request_type IS 'Tipo específico de solicitud';
COMMENT ON COLUMN application_requests.requested_changes IS 'Cambios específicos solicitados en formato JSON';
COMMENT ON COLUMN application_requests.attachments IS 'Archivos adjuntos como JSON array';
COMMENT ON COLUMN application_requests.status IS 'Estado actual de la solicitud';
COMMENT ON COLUMN application_requests.priority IS 'Prioridad de la solicitud';
COMMENT ON COLUMN application_requests.internal_notes IS 'Notas internas solo visibles para arrendadores';

-- Función para crear una solicitud
CREATE OR REPLACE FUNCTION create_application_request(
    p_application_id UUID,
    p_property_id UUID,
    p_applicant_id UUID,
    p_applicant_name TEXT,
    p_landlord_id UUID,
    p_landlord_name TEXT,
    p_request_type TEXT,
    p_subject TEXT,
    p_description TEXT,
    p_requested_changes JSONB DEFAULT '{}',
    p_attachments JSONB DEFAULT '[]',
    p_priority TEXT DEFAULT 'normal',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    request_id UUID;
BEGIN
    -- Validar que el applicant_id sea el mismo que el de la aplicación
    IF NOT EXISTS (
        SELECT 1 FROM applications
        WHERE id = p_application_id AND applicant_id = p_applicant_id
    ) THEN
        RAISE EXCEPTION 'Applicant ID does not match application';
    END IF;

    -- Validar que el landlord_id sea el owner de la propiedad
    IF NOT EXISTS (
        SELECT 1 FROM properties
        WHERE id = p_property_id AND owner_id = p_landlord_id
    ) THEN
        RAISE EXCEPTION 'Landlord ID does not match property owner';
    END IF;

    -- Insertar la solicitud
    INSERT INTO application_requests (
        application_id,
        property_id,
        applicant_id,
        applicant_name,
        landlord_id,
        landlord_name,
        request_type,
        subject,
        description,
        requested_changes,
        attachments,
        priority,
        ip_address,
        user_agent
    ) VALUES (
        p_application_id,
        p_property_id,
        p_applicant_id,
        p_applicant_name,
        p_landlord_id,
        p_landlord_name,
        p_request_type,
        p_subject,
        p_description,
        p_requested_changes,
        p_attachments,
        p_priority,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO request_id;

    -- Actualizar el updated_at de la aplicación
    UPDATE applications
    SET updated_at = NOW()
    WHERE id = p_application_id;

    RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar el estado de una solicitud (solo arrendadores)
CREATE OR REPLACE FUNCTION update_request_status(
    p_request_id UUID,
    p_landlord_id UUID,
    p_new_status TEXT,
    p_response TEXT DEFAULT NULL,
    p_response_attachments JSONB DEFAULT '[]',
    p_internal_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    property_owner_id UUID;
BEGIN
    -- Verificar que el landlord sea el owner de la propiedad
    SELECT p.owner_id INTO property_owner_id
    FROM application_requests ar
    JOIN properties p ON ar.property_id = p.id
    WHERE ar.id = p_request_id;

    IF property_owner_id != p_landlord_id THEN
        RAISE EXCEPTION 'Unauthorized: Not the property owner';
    END IF;

    -- Actualizar el estado
    UPDATE application_requests
    SET
        status = p_new_status,
        status_changed_at = NOW(),
        status_changed_by = p_landlord_id,
        response = COALESCE(p_response, response),
        response_attachments = COALESCE(p_response_attachments, response_attachments),
        responded_at = CASE WHEN p_response IS NOT NULL THEN NOW() ELSE responded_at END,
        responded_by = CASE WHEN p_response IS NOT NULL THEN p_landlord_id ELSE responded_by END,
        internal_notes = COALESCE(p_internal_notes, internal_notes),
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener solicitudes de una aplicación
CREATE OR REPLACE FUNCTION get_application_requests(p_application_id UUID, p_user_id UUID)
RETURNS TABLE (
    id UUID,
    applicant_id UUID,
    applicant_name TEXT,
    landlord_id UUID,
    landlord_name TEXT,
    request_type TEXT,
    subject TEXT,
    description TEXT,
    requested_changes JSONB,
    attachments JSONB,
    status TEXT,
    status_changed_at TIMESTAMPTZ,
    response TEXT,
    response_attachments JSONB,
    responded_at TIMESTAMPTZ,
    priority TEXT,
    created_at TIMESTAMPTZ,
    internal_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.id,
        ar.applicant_id,
        ar.applicant_name,
        ar.landlord_id,
        ar.landlord_name,
        ar.request_type,
        ar.subject,
        ar.description,
        ar.requested_changes,
        ar.attachments,
        ar.status,
        ar.status_changed_at,
        ar.response,
        ar.response_attachments,
        ar.responded_at,
        ar.priority,
        ar.created_at,
        -- Solo mostrar internal_notes si el usuario es el landlord
        CASE WHEN ar.landlord_id = p_user_id THEN ar.internal_notes ELSE NULL END as internal_notes
    FROM application_requests ar
    WHERE ar.application_id = p_application_id
    AND (ar.applicant_id = p_user_id OR ar.landlord_id = p_user_id)
    ORDER BY ar.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para contar solicitudes pendientes
CREATE OR REPLACE FUNCTION get_pending_requests_count(p_application_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM application_requests
        WHERE application_id = p_application_id
        AND (
            (applicant_id = p_user_id AND status = 'pending') OR
            (landlord_id = p_user_id AND status IN ('pending', 'under_review'))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON application_requests TO authenticated;
GRANT EXECUTE ON FUNCTION create_application_request TO authenticated;
GRANT EXECUTE ON FUNCTION update_request_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_requests TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_requests_count TO authenticated;

-- Función para registrar edición de postulación por el postulante
CREATE OR REPLACE FUNCTION log_application_edit(
    p_application_id UUID,
    p_user_id UUID,
    p_changes_summary TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    -- Insertar registro de auditoría para la edición
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
        p_user_id,
        'applicant_edit',
        jsonb_build_object('changes_summary', p_changes_summary),
        'Postulación editada por el postulante',
        p_ip_address,
        p_user_agent
    FROM applications a
    WHERE a.id = p_application_id
    RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_application_edit TO authenticated;
