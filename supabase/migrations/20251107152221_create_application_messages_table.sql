-- Crear tabla application_messages para comunicación entre postulante y arrendador
-- Esta tabla permite el intercambio de mensajes formales durante el proceso de postulación

CREATE TABLE IF NOT EXISTS application_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Información del remitente
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_type TEXT NOT NULL CHECK (sender_type IN ('applicant', 'landlord')),
    sender_name TEXT NOT NULL, -- Nombre del remitente para referencia rápida

    -- Información del destinatario
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('applicant', 'landlord')),
    recipient_name TEXT NOT NULL, -- Nombre del destinatario para referencia rápida

    -- Contenido del mensaje
    subject TEXT NOT NULL, -- Asunto del mensaje
    message TEXT NOT NULL, -- Contenido del mensaje
    message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'contract_update', 'document_request', 'status_update')),

    -- Archivos adjuntos (opcional)
    attachments JSONB DEFAULT '[]', -- Array de URLs de archivos adjuntos

    -- Estado del mensaje
    is_read BOOLEAN DEFAULT false, -- Si el destinatario lo ha leído
    read_at TIMESTAMPTZ, -- Fecha de lectura

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Control de versiones/conversación
    parent_message_id UUID REFERENCES application_messages(id), -- Para respuestas en hilo
    conversation_id UUID, -- ID de conversación (primer mensaje de la cadena)

    -- Información técnica
    ip_address INET,
    user_agent TEXT
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_application_messages_application_id ON application_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_property_id ON application_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_sender_id ON application_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_recipient_id ON application_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_sender_type ON application_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_application_messages_recipient_type ON application_messages(recipient_type);
CREATE INDEX IF NOT EXISTS idx_application_messages_created_at ON application_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_messages_is_read ON application_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_application_messages_conversation_id ON application_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_parent_message_id ON application_messages(parent_message_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE application_messages ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver mensajes donde son remitente o destinatario
CREATE POLICY "Users can view messages they sent or received" ON application_messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Política: Los usuarios solo pueden enviar mensajes donde son el remitente
CREATE POLICY "Users can send messages as sender" ON application_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
    );

-- Política: Los usuarios solo pueden actualizar mensajes que les pertenecen (marcar como leído)
CREATE POLICY "Users can update their own messages" ON application_messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Comentarios en la tabla y columnas
COMMENT ON TABLE application_messages IS 'Sistema de mensajería entre postulantes y arrendadores para comunicación formal';
COMMENT ON COLUMN application_messages.application_id IS 'ID de la postulación relacionada';
COMMENT ON COLUMN application_messages.property_id IS 'ID de la propiedad (para RLS adicional)';
COMMENT ON COLUMN application_messages.sender_type IS 'Tipo de remitente (applicant/landlord)';
COMMENT ON COLUMN application_messages.recipient_type IS 'Tipo de destinatario (applicant/landlord)';
COMMENT ON COLUMN application_messages.subject IS 'Asunto del mensaje';
COMMENT ON COLUMN application_messages.message_type IS 'Tipo de mensaje para categorización';
COMMENT ON COLUMN application_messages.attachments IS 'Archivos adjuntos como JSON array';
COMMENT ON COLUMN application_messages.is_read IS 'Si el destinatario ha leído el mensaje';
COMMENT ON COLUMN application_messages.conversation_id IS 'ID de la conversación para agrupar hilos';

-- Función para enviar un mensaje
CREATE OR REPLACE FUNCTION send_application_message(
    p_application_id UUID,
    p_property_id UUID,
    p_sender_id UUID,
    p_sender_type TEXT,
    p_sender_name TEXT,
    p_recipient_id UUID,
    p_recipient_type TEXT,
    p_recipient_name TEXT,
    p_subject TEXT,
    p_message TEXT,
    p_message_type TEXT DEFAULT 'general',
    p_attachments JSONB DEFAULT '[]',
    p_parent_message_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    conv_id UUID;
BEGIN
    -- Determinar el conversation_id
    IF p_parent_message_id IS NOT NULL THEN
        -- Si es una respuesta, usar el conversation_id del mensaje padre
        SELECT conversation_id INTO conv_id
        FROM application_messages
        WHERE id = p_parent_message_id;

        -- Si no tiene conversation_id, usar el id del padre
        IF conv_id IS NULL THEN
            conv_id := p_parent_message_id;
        END IF;
    ELSE
        -- Nuevo mensaje, generar nuevo conversation_id
        conv_id := gen_random_uuid();
    END IF;

    -- Insertar el mensaje
    INSERT INTO application_messages (
        application_id,
        property_id,
        sender_id,
        sender_type,
        sender_name,
        recipient_id,
        recipient_type,
        recipient_name,
        subject,
        message,
        message_type,
        attachments,
        parent_message_id,
        conversation_id,
        ip_address,
        user_agent
    ) VALUES (
        p_application_id,
        p_property_id,
        p_sender_id,
        p_sender_type,
        p_sender_name,
        p_recipient_id,
        p_recipient_type,
        p_recipient_name,
        p_subject,
        p_message,
        p_message_type,
        p_attachments,
        p_parent_message_id,
        conv_id,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO message_id;

    -- Actualizar el updated_at de la aplicación
    UPDATE applications
    SET updated_at = NOW()
    WHERE id = p_application_id;

    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar mensaje como leído
CREATE OR REPLACE FUNCTION mark_message_as_read(p_message_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE application_messages
    SET is_read = true, read_at = NOW()
    WHERE id = p_message_id
    AND recipient_id = p_user_id
    AND is_read = false;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener mensajes de una aplicación (para un usuario específico)
CREATE OR REPLACE FUNCTION get_application_messages(
    p_application_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    sender_type TEXT,
    sender_name TEXT,
    recipient_id UUID,
    recipient_type TEXT,
    recipient_name TEXT,
    subject TEXT,
    message TEXT,
    message_type TEXT,
    attachments JSONB,
    is_read BOOLEAN,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    parent_message_id UUID,
    conversation_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        am.id,
        am.sender_id,
        am.sender_type,
        am.sender_name,
        am.recipient_id,
        am.recipient_type,
        am.recipient_name,
        am.subject,
        am.message,
        am.message_type,
        am.attachments,
        am.is_read,
        am.read_at,
        am.created_at,
        am.parent_message_id,
        am.conversation_id
    FROM application_messages am
    WHERE am.application_id = p_application_id
    AND (am.sender_id = p_user_id OR am.recipient_id = p_user_id)
    ORDER BY am.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para contar mensajes no leídos
CREATE OR REPLACE FUNCTION get_unread_messages_count(p_application_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM application_messages
        WHERE application_id = p_application_id
        AND recipient_id = p_user_id
        AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON application_messages TO authenticated;
GRANT EXECUTE ON FUNCTION send_application_message TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_messages_count TO authenticated;




