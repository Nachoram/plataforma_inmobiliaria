-- =====================================================
-- MIGRACIÓN: Limpiar restricciones duplicadas en rental_contract_conditions
-- =====================================================
-- Fecha: 2025-10-24 14:13:00
-- Descripción: Eliminar restricciones duplicadas después de la sincronización
-- =====================================================

-- Eliminar restricciones duplicadas que ya no son necesarias
DO $$
BEGIN
  -- Eliminar la restricción antigua valid_payment_day (para payment_day)
  -- ya que ahora usamos monthly_payment_day con check_monthly_payment_day
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_payment_day'
    AND conrelid = 'rental_contract_conditions'::regclass
  ) THEN
    ALTER TABLE rental_contract_conditions
    DROP CONSTRAINT valid_payment_day;
  END IF;

  -- Verificar si hay restricciones duplicadas de payment_method
  -- y mantener solo la nueva check_payment_method
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rental_contract_conditions_payment_method_check'
    AND conrelid = 'rental_contract_conditions'::regclass
  ) THEN
    ALTER TABLE rental_contract_conditions
    DROP CONSTRAINT rental_contract_conditions_payment_method_check;
  END IF;

END $$;

-- =====================================================
-- VERIFICACIÓN DE LA LIMPIEZA
-- =====================================================
-- Para verificar que la limpieza se aplicó correctamente:
--
-- SELECT conname, contype, conrelid::regclass
-- FROM pg_constraint
-- WHERE conrelid = 'rental_contract_conditions'::regclass
-- ORDER BY conname;
--
-- Deberías ver solo estas restricciones activas:
-- - check_monthly_payment_day
-- - check_payment_method
-- - rental_contract_conditions_pkey
-- - unique_application_conditions
-- - rental_contract_conditions_application_id_fkey
-- - rental_contract_conditions_created_by_fkey
-- =====================================================

