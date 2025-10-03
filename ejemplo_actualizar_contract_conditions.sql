-- Ejemplo: Actualizar solo un campo específico usando rental_contract_conditions_characteristic_id

-- 📝 Caso de uso: Cambiar el precio final de un contrato específico
UPDATE rental_contract_conditions
SET final_price_clp = 550000
WHERE rental_contract_conditions_characteristic_id = 'CONTRACT_COND_1704067200_d4e5f6g7';

-- 📝 Caso de uso: Cambiar el día de pago
UPDATE rental_contract_conditions
SET payment_day = 10
WHERE rental_contract_conditions_characteristic_id = 'CONTRACT_COND_1704067200_d4e5f6g7';

-- 📝 Caso de uso: Cambiar la comisión del corredor
UPDATE rental_contract_conditions
SET broker_commission_clp = 60000
WHERE rental_contract_conditions_characteristic_id = 'CONTRACT_COND_1704067200_d4e5f6g7';

-- 📝 Caso de uso: Cambiar múltiples campos a la vez
UPDATE rental_contract_conditions
SET
  final_price_clp = 550000,
  payment_day = 10,
  guarantee_amount_clp = 120000
WHERE rental_contract_conditions_characteristic_id = 'CONTRACT_COND_1704067200_d4e5f6g7';

-- 🔍 Para verificar qué campos puedes actualizar:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rental_contract_conditions'
ORDER BY ordinal_position;

-- 🔍 Para ver tus datos actuales:
SELECT
  rental_contract_conditions_characteristic_id,
  lease_term_months,
  payment_day,
  final_price_clp,
  broker_commission_clp,
  guarantee_amount_clp,
  official_communication_email,
  accepts_pets,
  dicom_clause,
  additional_conditions
FROM rental_contract_conditions
ORDER BY created_at DESC
LIMIT 10;
