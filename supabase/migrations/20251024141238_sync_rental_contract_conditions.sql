-- =====================================================
-- MIGRACIÓN: Sincronizar rental_contract_conditions con formulario
-- =====================================================
-- Fecha: 2025-10-24 14:12:38
-- Descripción: Agregar columnas faltantes y renombrar para coincidir con formulario
-- =====================================================

-- Cambiar nombres de columnas existentes para coincidir con formulario
-- lease_term_months -> contract_duration_months
ALTER TABLE rental_contract_conditions
RENAME COLUMN lease_term_months TO contract_duration_months;

-- payment_day -> monthly_payment_day
ALTER TABLE rental_contract_conditions
RENAME COLUMN payment_day TO monthly_payment_day;

-- final_price_clp -> final_rent_price (y cambiar tipo a NUMERIC)
ALTER TABLE rental_contract_conditions
RENAME COLUMN final_price_clp TO final_rent_price_old;

ALTER TABLE rental_contract_conditions
ADD COLUMN final_rent_price NUMERIC(12,2);

-- Copiar datos y convertir a NUMERIC
UPDATE rental_contract_conditions
SET final_rent_price = final_rent_price_old::NUMERIC(12,2)
WHERE final_rent_price_old IS NOT NULL;

-- Eliminar columna antigua
ALTER TABLE rental_contract_conditions
DROP COLUMN final_rent_price_old;

-- broker_commission_clp -> brokerage_commission (y cambiar tipo a NUMERIC)
ALTER TABLE rental_contract_conditions
RENAME COLUMN broker_commission_clp TO brokerage_commission_old;

ALTER TABLE rental_contract_conditions
ADD COLUMN brokerage_commission NUMERIC(12,2);

-- Copiar datos y convertir a NUMERIC
UPDATE rental_contract_conditions
SET brokerage_commission = brokerage_commission_old::NUMERIC(12,2)
WHERE brokerage_commission_old IS NOT NULL;

-- Eliminar columna antigua
ALTER TABLE rental_contract_conditions
DROP COLUMN brokerage_commission_old;

-- guarantee_amount_clp -> guarantee_amount (y cambiar tipo a NUMERIC)
ALTER TABLE rental_contract_conditions
RENAME COLUMN guarantee_amount_clp TO guarantee_amount_old;

ALTER TABLE rental_contract_conditions
ADD COLUMN guarantee_amount NUMERIC(12,2);

-- Copiar datos y convertir a NUMERIC
UPDATE rental_contract_conditions
SET guarantee_amount = guarantee_amount_old::NUMERIC(12,2)
WHERE guarantee_amount_old IS NOT NULL;

-- Eliminar columna antigua
ALTER TABLE rental_contract_conditions
DROP COLUMN guarantee_amount_old;

-- bank_account_holder -> account_holder_name
ALTER TABLE rental_contract_conditions
RENAME COLUMN bank_account_holder TO account_holder_name;

-- bank_account_rut -> account_holder_rut
ALTER TABLE rental_contract_conditions
RENAME COLUMN bank_account_rut TO account_holder_rut;

-- bank_account_type -> account_type
ALTER TABLE rental_contract_conditions
RENAME COLUMN bank_account_type TO account_type;

-- bank_account_number -> account_number
ALTER TABLE rental_contract_conditions
RENAME COLUMN bank_account_number TO account_number;

-- Agregar columnas faltantes
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'transferencia_bancaria'
CHECK (payment_method IN ('transferencia_bancaria', 'plataforma')),

ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Actualizar valores por defecto para payment_method existente
UPDATE rental_contract_conditions
SET payment_method = 'transferencia_bancaria'
WHERE payment_method IS NULL OR payment_method = '';

-- Hacer payment_method NOT NULL después de actualizar valores existentes
ALTER TABLE rental_contract_conditions
ALTER COLUMN payment_method SET NOT NULL;

-- Agregar restricciones CHECK faltantes usando DO block para verificar existencia
DO $$
BEGIN
  -- Agregar restricción check_monthly_payment_day si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_monthly_payment_day'
    AND conrelid = 'rental_contract_conditions'::regclass
  ) THEN
    ALTER TABLE rental_contract_conditions
    ADD CONSTRAINT check_monthly_payment_day
    CHECK (monthly_payment_day BETWEEN 1 AND 31);
  END IF;

  -- Agregar restricción check_payment_method si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_payment_method'
    AND conrelid = 'rental_contract_conditions'::regclass
  ) THEN
    ALTER TABLE rental_contract_conditions
    ADD CONSTRAINT check_payment_method
    CHECK (payment_method IN ('transferencia_bancaria', 'plataforma'));
  END IF;
END $$;

-- Actualizar comentarios descriptivos
COMMENT ON COLUMN rental_contract_conditions.final_rent_price IS 'Precio final mensual del arriendo en CLP';
COMMENT ON COLUMN rental_contract_conditions.contract_start_date IS 'Fecha de inicio del contrato de arriendo';
COMMENT ON COLUMN rental_contract_conditions.contract_duration_months IS 'Duración del contrato en meses';
COMMENT ON COLUMN rental_contract_conditions.guarantee_amount IS 'Monto de la garantía en CLP';
COMMENT ON COLUMN rental_contract_conditions.monthly_payment_day IS 'Día del mes para pago del arriendo (1-31)';
COMMENT ON COLUMN rental_contract_conditions.brokerage_commission IS 'Comisión de corretaje (opcional)';
COMMENT ON COLUMN rental_contract_conditions.payment_method IS 'Método de pago: transferencia_bancaria o plataforma';
COMMENT ON COLUMN rental_contract_conditions.account_holder_name IS 'Nombre del titular de la cuenta bancaria';
COMMENT ON COLUMN rental_contract_conditions.account_holder_rut IS 'RUT del titular de la cuenta';
COMMENT ON COLUMN rental_contract_conditions.bank_name IS 'Nombre del banco';
COMMENT ON COLUMN rental_contract_conditions.account_type IS 'Tipo de cuenta bancaria';
COMMENT ON COLUMN rental_contract_conditions.account_number IS 'Número de cuenta bancaria';
COMMENT ON COLUMN rental_contract_conditions.created_by IS 'Usuario que creó las condiciones del contrato';

-- Crear índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_start_date
ON rental_contract_conditions(contract_start_date);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_created_by
ON rental_contract_conditions(created_by);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar estructura de la tabla:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'rental_contract_conditions'
-- ORDER BY ordinal_position;
--
-- 2. Verificar que los datos se mantuvieron:
-- SELECT COUNT(*) as total_records,
--        COUNT(final_rent_price) as with_final_price,
--        COUNT(guarantee_amount) as with_guarantee
-- FROM rental_contract_conditions;
--
-- 3. Verificar restricciones:
-- SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(c.oid)
-- FROM pg_constraint c
-- JOIN pg_class t ON t.oid = c.conrelid
-- WHERE t.relname = 'rental_contract_conditions';
-- =====================================================
