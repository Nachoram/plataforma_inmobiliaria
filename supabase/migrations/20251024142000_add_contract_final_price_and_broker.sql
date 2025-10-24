-- =====================================================
-- MIGRACIÓN: Agregar campos de precio final y corredor a rental_contract_conditions
-- =====================================================
-- Fecha: 2025-10-24 14:20:00
-- Descripción: Agregar final_rent_price, broker_name y broker_rut a rental_contract_conditions
-- =====================================================

-- Agregar columnas faltantes en rental_contract_conditions
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS final_rent_price NUMERIC(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS broker_name VARCHAR(120) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS broker_rut VARCHAR(20) NOT NULL DEFAULT '';

-- Comentarios en las columnas
COMMENT ON COLUMN rental_contract_conditions.final_rent_price IS 'Precio final mensual del arriendo (CLP)';
COMMENT ON COLUMN rental_contract_conditions.broker_name IS 'Nombre del corredor responsable';
COMMENT ON COLUMN rental_contract_conditions.broker_rut IS 'RUT del corredor responsable';

-- Crear índices útiles para optimización
CREATE INDEX IF NOT EXISTS idx_rcc_final_rent_price ON rental_contract_conditions(final_rent_price);
CREATE INDEX IF NOT EXISTS idx_rcc_broker_rut ON rental_contract_conditions(broker_rut);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar columnas agregadas:
-- SELECT column_name, data_type, is_nullable, column_default, col_description
-- FROM information_schema.columns c
-- LEFT JOIN pg_description pd ON pd.objoid = c.table_name::regclass AND pd.objsubid = c.ordinal_position
-- WHERE table_name = 'rental_contract_conditions'
-- AND column_name IN ('final_rent_price', 'broker_name', 'broker_rut');
--
-- 2. Verificar índices creados:
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'rental_contract_conditions'
-- AND indexname LIKE '%rcc_%';
--
-- 3. Verificar que no hay datos nulos en registros existentes:
-- SELECT COUNT(*) as total_records,
--        COUNT(final_rent_price) as with_final_price,
--        COUNT(broker_name) as with_broker_name,
--        COUNT(broker_rut) as with_broker_rut
-- FROM rental_contract_conditions;
-- =====================================================
