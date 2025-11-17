-- =====================================================
-- MIGRACIÓN: Agregar columnas faltantes a rental_contract_conditions
-- =====================================================
-- Fecha: 2025-11-11
-- Descripción: Agregar contract_start_date, landlord_email, is_furnished y otras columnas faltantes
-- =====================================================

-- Agregar columnas faltantes que podrían no existir
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS landlord_email TEXT,
ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lease_term_months INTEGER,
ADD COLUMN IF NOT EXISTS auto_renewal_clause BOOLEAN DEFAULT FALSE;

-- Comentarios en las columnas
COMMENT ON COLUMN rental_contract_conditions.contract_start_date IS 'Fecha de inicio del contrato de arriendo';
COMMENT ON COLUMN rental_contract_conditions.landlord_email IS 'Email del propietario para comunicaciones del contrato';
COMMENT ON COLUMN rental_contract_conditions.is_furnished IS 'Indica si la propiedad está amoblada';
COMMENT ON COLUMN rental_contract_conditions.lease_term_months IS 'Plazo del contrato de arriendo en meses (compatibilidad)';
COMMENT ON COLUMN rental_contract_conditions.auto_renewal_clause IS 'Indica si incluye cláusula de renovación automática';

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_contract_start_date
ON rental_contract_conditions(contract_start_date);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_landlord_email
ON rental_contract_conditions(landlord_email);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_is_furnished
ON rental_contract_conditions(is_furnished);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_lease_term_months
ON rental_contract_conditions(lease_term_months);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_auto_renewal_clause
ON rental_contract_conditions(auto_renewal_clause);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar columnas agregadas:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'rental_contract_conditions'
-- AND column_name IN ('contract_start_date', 'landlord_email', 'is_furnished', 'lease_term_months', 'auto_renewal_clause');
--
-- 2. Verificar índices creados:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE tablename = 'rental_contract_conditions'
-- AND (indexname LIKE '%contract_start_date%' OR indexname LIKE '%landlord_email%' OR indexname LIKE '%is_furnished%'
--      OR indexname LIKE '%lease_term_months%' OR indexname LIKE '%auto_renewal_clause%');
-- =====================================================


