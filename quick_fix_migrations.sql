-- FIX RÁPIDO PARA MIGRACIONES DUPLICADAS
-- Ejecutar este script en el SQL Editor de Supabase

-- Paso 1: Limpiar políticas existentes
DROP POLICY IF EXISTS "Owners can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Applicants can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Guarantors can view contracts where they are guarantor" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can create contracts for their applications" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can update contracts for their applications" ON rental_contracts;

DROP POLICY IF EXISTS "Users can view signatures for contracts they are involved in" ON contract_signatures;
DROP POLICY IF EXISTS "Owners can create signatures for their contracts" ON contract_signatures;

-- Paso 2: Limpiar triggers
DROP TRIGGER IF EXISTS trigger_update_rental_contracts_updated_at ON rental_contracts;
DROP TRIGGER IF EXISTS trigger_update_contract_signatures_updated_at ON contract_signatures;

-- Paso 3: Limpiar tabla de cláusulas
DROP TABLE IF EXISTS contract_clauses CASCADE;

-- Resultado
SELECT '✅ Ready to run migrations!' as status;
