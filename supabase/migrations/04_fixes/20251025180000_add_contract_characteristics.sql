-- =====================================================
-- MIGRACIÓN: Agregar columnas de características para contratos
-- =====================================================
-- Fecha: 2025-10-25 18:00:00
-- Descripción: Agregar columnas necesarias para el sistema de generación de contratos con webhook
-- =====================================================

-- Agregar columnas faltantes en applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS guarantor_characteristic_id UUID;

-- Agregar columnas faltantes en properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS property_characteristic_id UUID,
ADD COLUMN IF NOT EXISTS rental_owner_characteristic_id UUID;

-- Crear tabla contract_conditions
CREATE TABLE IF NOT EXISTS contract_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    contract_conditions_characteristic_id UUID,
    start_date DATE,
    duration_months INTEGER DEFAULT 12,
    guarantee_amount DECIMAL(12,2),
    payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),
    allows_pets BOOLEAN DEFAULT false,
    sublease_allowed TEXT DEFAULT 'No Permitido',
    max_occupants INTEGER,
    allowed_use TEXT,
    access_clause TEXT,
    broker_commission DECIMAL(10,2),
    payment_method TEXT DEFAULT 'transferencia' CHECK (payment_method IN ('transferencia', 'plataforma')),
    bank_account_holder TEXT,
    bank_account_rut TEXT,
    bank_name TEXT,
    bank_account_type TEXT CHECK (bank_account_type IN ('Cuenta Corriente', 'Cuenta Vista', 'Cuenta de Ahorro', 'Cuenta RUT')),
    bank_account_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_contract_conditions_application_id ON contract_conditions(application_id);
CREATE INDEX IF NOT EXISTS idx_contract_conditions_created_at ON contract_conditions(created_at);

-- Comentarios en las columnas
COMMENT ON COLUMN applications.application_characteristic_id IS 'ID de características de la postulación';
COMMENT ON COLUMN applications.guarantor_characteristic_id IS 'ID de características del garante';
COMMENT ON COLUMN properties.property_characteristic_id IS 'ID de características de la propiedad';
COMMENT ON COLUMN properties.rental_owner_characteristic_id IS 'ID de características del propietario';
COMMENT ON COLUMN contract_conditions.contract_conditions_characteristic_id IS 'ID de condiciones del contrato';

-- Otorgar permisos
GRANT ALL ON contract_conditions TO authenticated;
GRANT ALL ON contract_conditions TO service_role;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at en contract_conditions
DROP TRIGGER IF EXISTS update_contract_conditions_updated_at ON contract_conditions;
CREATE TRIGGER update_contract_conditions_updated_at
    BEFORE UPDATE ON contract_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar columnas en applications:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'applications' AND column_name IN ('application_characteristic_id', 'guarantor_characteristic_id');
--
-- 2. Verificar columnas en properties:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'properties' AND column_name IN ('property_characteristic_id', 'rental_owner_characteristic_id');
--
-- 3. Verificar tabla contract_conditions:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'contract_conditions';
--
-- 4. Verificar permisos:
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'contract_conditions';
-- =====================================================

