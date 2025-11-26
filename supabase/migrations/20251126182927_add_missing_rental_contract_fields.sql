-- =====================================================
-- MIGRACIÓN: Agregar campos faltantes a rental_contract_conditions
-- =====================================================
-- Fecha: 2025-11-26
-- Descripción: Agregar tenant_email y created_by que faltan para el formulario
-- =====================================================

-- Agregar columna tenant_email si no existe
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS tenant_email TEXT;

-- Agregar columna created_by si no existe
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Agregar columna brokerage_commission si no existe (por compatibilidad)
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS brokerage_commission NUMERIC;

-- Comentarios en las nuevas columnas
COMMENT ON COLUMN rental_contract_conditions.tenant_email IS 'Correo electrónico del arrendatario para notificaciones del contrato';
COMMENT ON COLUMN rental_contract_conditions.created_by IS 'Usuario que creó las condiciones contractuales';
COMMENT ON COLUMN rental_contract_conditions.brokerage_commission IS 'Comisión del corredor (opcional)';

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_tenant_email
ON rental_contract_conditions(tenant_email);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_created_by
ON rental_contract_conditions(created_by);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_brokerage_commission
ON rental_contract_conditions(brokerage_commission);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar columnas agregadas:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'rental_contract_conditions'
-- AND column_name IN ('tenant_email', 'created_by', 'brokerage_commission');
--
-- 2. Verificar índices creados:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE tablename = 'rental_contract_conditions'
-- AND (indexname LIKE '%tenant_email%' OR indexname LIKE '%created_by%' OR indexname LIKE '%brokerage_commission%');
-- =====================================================
