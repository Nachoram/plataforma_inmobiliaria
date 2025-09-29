-- Crear tabla para almacenar las condiciones del contrato de arriendo
-- Esta tabla se relaciona con applications y contiene toda la información necesaria para generar contratos

CREATE TABLE IF NOT EXISTS rental_contract_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Condiciones temporales
    lease_term_months INTEGER, -- Plazo en meses
    payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31), -- Día de pago mensual

    -- Condiciones económicas
    final_price_clp INTEGER, -- Precio final acordado
    broker_commission_clp INTEGER, -- Comisión del corredor
    guarantee_amount_clp INTEGER, -- Monto de garantía

    -- Información de contacto oficial
    official_communication_email TEXT, -- Email oficial para comunicaciones

    -- Condiciones especiales (checkboxes booleanos)
    accepts_pets BOOLEAN DEFAULT FALSE, -- Acepta mascotas
    dicom_clause BOOLEAN DEFAULT FALSE, -- Cláusula DICOM
    additional_conditions TEXT, -- Condiciones adicionales en texto libre

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_application_conditions UNIQUE (application_id),
    CONSTRAINT valid_payment_day CHECK (payment_day >= 1 AND payment_day <= 31)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_application_id
ON rental_contract_conditions(application_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE rental_contract_conditions ENABLE ROW LEVEL SECURITY;

-- Política para propietarios: pueden ver condiciones de sus propias aplicaciones
CREATE POLICY "Owners can view their applications contract conditions" ON rental_contract_conditions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND p.owner_id = auth.uid()
    )
);

-- Política para postulantes: pueden ver condiciones de sus propias aplicaciones
CREATE POLICY "Applicants can view their applications contract conditions" ON rental_contract_conditions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = rental_contract_conditions.application_id
        AND a.applicant_id = auth.uid()
    )
);

-- Política para insertar: solo propietarios pueden crear condiciones para sus aplicaciones
CREATE POLICY "Owners can create contract conditions for their applications" ON rental_contract_conditions
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND p.owner_id = auth.uid()
    )
);

-- Política para actualizar: solo propietarios pueden actualizar condiciones de sus aplicaciones
CREATE POLICY "Owners can update contract conditions for their applications" ON rental_contract_conditions
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND p.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND p.owner_id = auth.uid()
    )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_rental_contract_conditions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rental_contract_conditions_updated_at
    BEFORE UPDATE ON rental_contract_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_rental_contract_conditions_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE rental_contract_conditions IS 'Condiciones específicas del contrato de arriendo acordadas entre propietario y postulante';
COMMENT ON COLUMN rental_contract_conditions.lease_term_months IS 'Plazo del contrato de arriendo en meses';
COMMENT ON COLUMN rental_contract_conditions.payment_day IS 'Día del mes en que se realiza el pago mensual';
COMMENT ON COLUMN rental_contract_conditions.final_price_clp IS 'Precio final acordado en pesos chilenos';
COMMENT ON COLUMN rental_contract_conditions.broker_commission_clp IS 'Comisión del corredor inmobiliario en pesos chilenos';
COMMENT ON COLUMN rental_contract_conditions.guarantee_amount_clp IS 'Monto de la garantía o depósito en pesos chilenos';
COMMENT ON COLUMN rental_contract_conditions.official_communication_email IS 'Email oficial para todas las comunicaciones relacionadas con el contrato';
COMMENT ON COLUMN rental_contract_conditions.accepts_pets IS 'Indica si se permite el ingreso de mascotas';
COMMENT ON COLUMN rental_contract_conditions.dicom_clause IS 'Indica si se incluye cláusula DICOM (Derecho a Crédito por Cobranza Indebida)';
COMMENT ON COLUMN rental_contract_conditions.additional_conditions IS 'Condiciones adicionales acordadas en texto libre';
