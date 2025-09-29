-- Crear tabla para almacenar contratos de arriendo generados
-- Esta tabla contiene el contenido editable del contrato y su estado en el proceso de firma

CREATE TABLE IF NOT EXISTS rental_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Estado del contrato
    status contract_status_enum DEFAULT 'draft',

    -- Contenido del contrato (JSON con estructura editable)
    contract_content JSONB NOT NULL DEFAULT '{}',

    -- Información de firmas
    owner_signed_at TIMESTAMP WITH TIME ZONE,
    tenant_signed_at TIMESTAMP WITH TIME ZONE,
    guarantor_signed_at TIMESTAMP WITH TIME ZONE,

    -- URLs de documentos firmados (generados por el servicio de firma)
    signed_contract_url TEXT,
    owner_signature_url TEXT,
    tenant_signature_url TEXT,
    guarantor_signature_url TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_to_signature_at TIMESTAMP WITH TIME ZONE,

    -- Usuario que creó/aprobó el contrato
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),

    -- Información adicional
    notes TEXT,
    version INTEGER DEFAULT 1,

    -- Constraints
    CONSTRAINT unique_contract_per_application UNIQUE (application_id),
    CONSTRAINT valid_status_transitions CHECK (
        status IN ('draft', 'approved', 'sent_to_signature', 'partially_signed', 'fully_signed', 'cancelled')
    )
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_rental_contracts_application_id ON rental_contracts(application_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON rental_contracts(status);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_created_by ON rental_contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_approved_by ON rental_contracts(approved_by);

-- Políticas RLS (Row Level Security)
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si ya existen (para hacer la migración idempotente)
DROP POLICY IF EXISTS "Owners can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Applicants can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Guarantors can view contracts where they are guarantor" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can create contracts for their applications" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can update contracts for their applications" ON rental_contracts;

-- Política para propietarios: pueden ver contratos de sus propias aplicaciones
CREATE POLICY "Owners can view their applications contracts" ON rental_contracts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contracts.application_id
        AND p.owner_id = auth.uid()
    )
);

-- Política para postulantes: pueden ver contratos de sus propias aplicaciones
CREATE POLICY "Applicants can view their applications contracts" ON rental_contracts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = rental_contracts.application_id
        AND a.applicant_id = auth.uid()
    )
);

-- Política para aval: pueden ver contratos donde son aval
CREATE POLICY "Guarantors can view contracts where they are guarantor" ON rental_contracts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = rental_contracts.application_id
        AND a.guarantor_id = auth.uid()
    )
);

-- Política para insertar: solo propietarios pueden crear contratos para sus aplicaciones
CREATE POLICY "Owners can create contracts for their applications" ON rental_contracts
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contracts.application_id
        AND p.owner_id = auth.uid()
    )
);

-- Política para actualizar: propietarios pueden actualizar contratos de sus aplicaciones
CREATE POLICY "Owners can update contracts for their applications" ON rental_contracts
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contracts.application_id
        AND p.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contracts.application_id
        AND p.owner_id = auth.uid()
    )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_rental_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si ya existe
DROP TRIGGER IF EXISTS trigger_update_rental_contracts_updated_at ON rental_contracts;

CREATE TRIGGER trigger_update_rental_contracts_updated_at
    BEFORE UPDATE ON rental_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_rental_contracts_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE rental_contracts IS 'Contratos de arriendo generados con contenido editable y estado de firmas';
COMMENT ON COLUMN rental_contracts.application_id IS 'Referencia a la aplicación aprobada';
COMMENT ON COLUMN rental_contracts.status IS 'Estado del contrato: draft, approved, sent_to_signature, partially_signed, fully_signed, cancelled';
COMMENT ON COLUMN rental_contracts.contract_content IS 'Contenido JSON del contrato editable como canvas';
COMMENT ON COLUMN rental_contracts.owner_signed_at IS 'Fecha y hora cuando el propietario firmó';
COMMENT ON COLUMN rental_contracts.tenant_signed_at IS 'Fecha y hora cuando el arrendatario firmó';
COMMENT ON COLUMN rental_contracts.guarantor_signed_at IS 'Fecha y hora cuando el aval firmó';
COMMENT ON COLUMN rental_contracts.signed_contract_url IS 'URL del contrato completamente firmado';
COMMENT ON COLUMN rental_contracts.created_by IS 'Usuario que creó el contrato (propietario)';
COMMENT ON COLUMN rental_contracts.approved_by IS 'Usuario que aprobó el contrato para firma';
COMMENT ON COLUMN rental_contracts.notes IS 'Notas adicionales sobre el contrato';
COMMENT ON COLUMN rental_contracts.version IS 'Versión del contrato para tracking de cambios';
