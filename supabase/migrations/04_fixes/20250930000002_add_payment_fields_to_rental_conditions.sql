-- Agregar campos de pago y condiciones adicionales a rental_contract_conditions
-- 1. Información de cuenta bancaria para pago
-- 2. Renovación automática
-- 3. Cláusula de término por no pago

DO $$
BEGIN
  -- Agregar campos de información bancaria separados
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN bank_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'bank_account_type'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN bank_account_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'bank_account_number'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN bank_account_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'bank_account_rut'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN bank_account_rut TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'bank_account_holder'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN bank_account_holder TEXT;
  END IF;

  -- Agregar campo de renovación automática si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'automatic_renewal'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN automatic_renewal BOOLEAN DEFAULT FALSE;
  END IF;

  -- Agregar campo de cláusula de término por no pago si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'termination_clause_non_payment'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN termination_clause_non_payment TEXT;
  END IF;

  -- Agregar campo de fecha de inicio del contrato si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_conditions' AND column_name = 'contract_start_date'
  ) THEN
    ALTER TABLE rental_contract_conditions 
    ADD COLUMN contract_start_date DATE;
  END IF;
END $$;

-- Agregar comentarios para documentación
COMMENT ON COLUMN rental_contract_conditions.bank_name IS 'Nombre del banco donde se realizarán los pagos';
COMMENT ON COLUMN rental_contract_conditions.bank_account_type IS 'Tipo de cuenta bancaria (Cuenta Corriente, Cuenta Vista, Cuenta de Ahorro)';
COMMENT ON COLUMN rental_contract_conditions.bank_account_number IS 'Número de cuenta bancaria';
COMMENT ON COLUMN rental_contract_conditions.bank_account_rut IS 'RUT del titular de la cuenta';
COMMENT ON COLUMN rental_contract_conditions.bank_account_holder IS 'Nombre completo del titular de la cuenta';
COMMENT ON COLUMN rental_contract_conditions.automatic_renewal IS 'Indica si el contrato se renueva automáticamente al término del plazo';
COMMENT ON COLUMN rental_contract_conditions.termination_clause_non_payment IS 'Cláusula específica sobre el término del contrato en caso de no pago';
COMMENT ON COLUMN rental_contract_conditions.contract_start_date IS 'Fecha de inicio del contrato de arriendo';

