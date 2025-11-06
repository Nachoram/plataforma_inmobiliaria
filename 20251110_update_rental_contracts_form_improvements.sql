-- Migración: Actualizar tabla rental_contracts con mejoras del formulario
-- Fecha: 10 de noviembre de 2025
-- Descripción: Agregar campos de monedas, información de pagos detallada y eliminar tipo de inmueble

-- ========================================
-- AGREGAR NUEVAS COLUMNAS
-- ========================================

-- Agregar campos de moneda para los montos
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS final_amount_currency TEXT NOT NULL DEFAULT 'clp' CHECK (final_amount_currency IN ('clp', 'uf'));

ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS guarantee_amount_currency TEXT NOT NULL DEFAULT 'clp' CHECK (guarantee_amount_currency IN ('clp', 'uf'));

-- Agregar campos detallados para información de pagos
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS account_holder_name TEXT NOT NULL DEFAULT '';

ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS account_number TEXT NOT NULL DEFAULT '';

ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS account_bank TEXT NOT NULL DEFAULT '';

-- Agregar account_type sin restricción inicialmente para evitar errores con datos existentes
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'corriente';

-- Agregar la restricción después de actualizar los datos existentes
ALTER TABLE rental_contracts
ADD CONSTRAINT rental_contracts_account_type_check CHECK (account_type IN ('corriente', 'vista', 'ahorro'));

-- ========================================
-- ELIMINAR COLUMNA OBSOLETA
-- ========================================

-- Eliminar campo de tipo de inmueble (ya no se usa)
ALTER TABLE rental_contracts
DROP COLUMN IF EXISTS property_type;

-- ========================================
-- ACTUALIZAR REGISTROS EXISTENTES
-- ========================================

-- Para contratos existentes, asignar valores por defecto solo donde falten
UPDATE rental_contracts
SET
  final_amount_currency = COALESCE(final_amount_currency, 'clp'),
  guarantee_amount_currency = COALESCE(guarantee_amount_currency, 'clp'),
  account_holder_name = COALESCE(NULLIF(TRIM(account_holder_name), ''), 'Por definir'),
  account_number = COALESCE(NULLIF(TRIM(account_number), ''), 'Por definir'),
  account_bank = COALESCE(NULLIF(TRIM(account_bank), ''), 'Por definir'),
  account_type = COALESCE(NULLIF(TRIM(account_type), ''), 'corriente');

-- ========================================
-- COMENTARIOS EN COLUMNAS
-- ========================================

COMMENT ON COLUMN rental_contracts.final_amount_currency IS 'Moneda del monto final del contrato: clp o uf';
COMMENT ON COLUMN rental_contracts.guarantee_amount_currency IS 'Moneda del monto de garantía: clp o uf';
COMMENT ON COLUMN rental_contracts.account_holder_name IS 'Nombre completo del titular de la cuenta bancaria';
COMMENT ON COLUMN rental_contracts.account_number IS 'Número de la cuenta bancaria';
COMMENT ON COLUMN rental_contracts.account_bank IS 'Nombre del banco de la cuenta';
COMMENT ON COLUMN rental_contracts.account_type IS 'Tipo de cuenta bancaria: corriente, vista o ahorro';

-- ========================================
-- VALIDACIONES
-- ========================================

-- Nota: Las validaciones se manejan a nivel de aplicación para mayor flexibilidad
-- con contratos existentes que pueden tener valores temporales "Por definir"

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Crear índices para las nuevas columnas de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_rental_contracts_account_bank ON rental_contracts(account_bank);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_account_type ON rental_contracts(account_type);

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

DO $$
DECLARE
    contract_count integer;
    updated_count integer;
BEGIN
    SELECT COUNT(*) INTO contract_count FROM rental_contracts;
    SELECT COUNT(*) INTO updated_count
    FROM rental_contracts
    WHERE account_holder_name IS NOT NULL
      AND account_number IS NOT NULL
      AND account_bank IS NOT NULL
      AND account_type IS NOT NULL;

    RAISE NOTICE 'Migración completada exitosamente:';
    RAISE NOTICE '  - Total de contratos: %', contract_count;
    RAISE NOTICE '  - Contratos con información bancaria: %', updated_count;
    RAISE NOTICE '  - Nuevas columnas agregadas: final_amount_currency, guarantee_amount_currency, account_holder_name, account_number, account_bank, account_type';
    RAISE NOTICE '  - Columna eliminada: property_type';
    RAISE NOTICE '  - Restricciones y índices creados exitosamente';
END $$;
