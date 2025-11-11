-- =====================================================
-- MIGRACIÓN: Agregar columnas faltantes a rental_contract_conditions
-- =====================================================
-- Fecha: 2025-11-11
-- Descripción: Agregar contract_start_date, landlord_email e is_furnished
-- =====================================================

-- Agregar columnas faltantes
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS landlord_email TEXT,
ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT FALSE;

-- Comentarios en las columnas
COMMENT ON COLUMN rental_contract_conditions.contract_start_date IS 'Fecha de inicio del contrato de arriendo';
COMMENT ON COLUMN rental_contract_conditions.landlord_email IS 'Email del propietario para comunicaciones del contrato';
COMMENT ON COLUMN rental_contract_conditions.is_furnished IS 'Indica si la propiedad está amoblada';

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_contract_start_date
ON rental_contract_conditions(contract_start_date);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_landlord_email
ON rental_contract_conditions(landlord_email);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_is_furnished
ON rental_contract_conditions(is_furnished);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar columnas agregadas:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'rental_contract_conditions'
-- AND column_name IN ('contract_start_date', 'landlord_email', 'is_furnished');
--
-- 2. Verificar índices creados:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE tablename = 'rental_contract_conditions'
-- AND indexname LIKE '%contract_start_date%' OR indexname LIKE '%landlord_email%' OR indexname LIKE '%is_furnished%';
-- =====================================================
