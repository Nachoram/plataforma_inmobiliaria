-- Crear tabla para manejar el proceso detallado de firmas electrónicas
-- Esta tabla registra cada intento de firma y su estado

CREATE TABLE IF NOT EXISTS contract_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,

    -- Tipo de firmante
    signer_type signer_type_enum NOT NULL, -- 'owner', 'tenant', 'guarantor'

    -- Usuario que debe firmar
    signer_user_id UUID REFERENCES auth.users(id),

    -- Información del firmante (para casos donde no es usuario registrado)
    signer_name TEXT,
    signer_email TEXT,
    signer_rut TEXT,

    -- Estado de la firma
    signature_status signature_status_enum DEFAULT 'pending',

    -- Información de la firma electrónica
    signature_request_id TEXT, -- ID del proceso en el servicio de firma
    signature_url TEXT, -- URL donde el firmante puede firmar
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_certificate_url TEXT, -- URL del certificado de firma

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Fecha de expiración del enlace de firma
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    last_reminder_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT valid_signer_type CHECK (signer_type IN ('owner', 'tenant', 'guarantor')),
    CONSTRAINT valid_signature_status CHECK (
        signature_status IN ('pending', 'sent', 'viewed', 'signed', 'rejected', 'expired', 'cancelled')
    )
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signer_user_id ON contract_signatures(signer_user_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signer_email ON contract_signatures(signer_email);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signature_status ON contract_signatures(signature_status);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_expires_at ON contract_signatures(expires_at);

-- Políticas RLS (Row Level Security)
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si ya existen (para hacer la migración idempotente)
DROP POLICY IF EXISTS "Users can view signatures for contracts they are involved in" ON contract_signatures;

-- Política general: usuarios pueden ver firmas de contratos donde son parte interesada
CREATE POLICY "Users can view signatures for contracts they are involved in" ON contract_signatures
FOR SELECT USING (
    contract_id IN (
        SELECT rc.id FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        JOIN properties p ON a.property_id = p.id
        WHERE
            -- Propietarios pueden ver firmas de sus contratos
            p.owner_id = auth.uid()
            -- Arrendatarios pueden ver firmas de sus contratos
            OR a.applicant_id = auth.uid()
            -- El propio firmante puede ver su firma
            OR contract_signatures.signer_user_id = auth.uid()
    )
);

-- Política para insertar: solo propietarios pueden crear procesos de firma para sus contratos
CREATE POLICY "Owners can create signatures for their contracts" ON contract_signatures
FOR INSERT WITH CHECK (
    contract_id IN (
        SELECT rc.id FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        JOIN properties p ON a.property_id = p.id
        WHERE p.owner_id = auth.uid()
    )
);

-- Política para actualizar: el firmante puede actualizar su propia firma, propietarios pueden actualizar firmas de sus contratos
CREATE POLICY "Users can update signatures they are authorized to" ON contract_signatures
FOR UPDATE USING (
    -- El firmante puede actualizar su propia firma
    signer_user_id = auth.uid()
    -- Propietarios pueden actualizar firmas de sus contratos
    OR contract_id IN (
        SELECT rc.id FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        JOIN properties p ON a.property_id = p.id
        WHERE p.owner_id = auth.uid()
    )
)
WITH CHECK (
    -- El firmante puede actualizar su propia firma
    signer_user_id = auth.uid()
    -- Propietarios pueden actualizar firmas de sus contratos
    OR contract_id IN (
        SELECT rc.id FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        JOIN properties p ON a.property_id = p.id
        WHERE p.owner_id = auth.uid()
    )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si ya existe
DROP TRIGGER IF EXISTS trigger_update_contract_signatures_updated_at ON contract_signatures;

CREATE TRIGGER trigger_update_contract_signatures_updated_at
    BEFORE UPDATE ON contract_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_signatures_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE contract_signatures IS 'Registro detallado del proceso de firmas electrónicas para contratos';
COMMENT ON COLUMN contract_signatures.contract_id IS 'Referencia al contrato que se está firmando';
COMMENT ON COLUMN contract_signatures.signer_type IS 'Tipo de firmante: owner, tenant, guarantor';
COMMENT ON COLUMN contract_signatures.signer_user_id IS 'ID del usuario firmante si está registrado en el sistema';
COMMENT ON COLUMN contract_signatures.signer_name IS 'Nombre del firmante';
COMMENT ON COLUMN contract_signatures.signer_email IS 'Email del firmante para notificaciones';
COMMENT ON COLUMN contract_signatures.signer_rut IS 'RUT del firmante';
COMMENT ON COLUMN contract_signatures.signature_status IS 'Estado de la firma: pending, sent, viewed, signed, rejected, expired, cancelled';
COMMENT ON COLUMN contract_signatures.signature_request_id IS 'ID del proceso en el servicio de firma electrónica';
COMMENT ON COLUMN contract_signatures.signature_url IS 'URL única donde el firmante puede acceder para firmar';
COMMENT ON COLUMN contract_signatures.signed_at IS 'Fecha y hora cuando se completó la firma';
COMMENT ON COLUMN contract_signatures.signature_certificate_url IS 'URL del certificado digital de la firma';
COMMENT ON COLUMN contract_signatures.expires_at IS 'Fecha de expiración del enlace de firma';
COMMENT ON COLUMN contract_signatures.reminder_sent_at IS 'Fecha del primer recordatorio enviado';
COMMENT ON COLUMN contract_signatures.last_reminder_at IS 'Fecha del último recordatorio enviado';
