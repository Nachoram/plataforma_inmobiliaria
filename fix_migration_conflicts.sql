-- Script para arreglar conflictos de migraciones en Supabase
-- Ejecutar este script en el SQL Editor de Supabase ANTES de ejecutar las migraciones

-- ===========================================
-- LIMPIEZA COMPLETA PARA MIGRACIONES IDÉMPOTENTES
-- ===========================================

-- Eliminar políticas duplicadas de rental_contracts
DROP POLICY IF EXISTS "Owners can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Applicants can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Guarantors can view contracts where they are guarantor" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can create contracts for their applications" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can update contracts for their applications" ON rental_contracts;

-- Eliminar políticas duplicadas de contract_signatures
DROP POLICY IF EXISTS "Users can view signatures for contracts they are involved in" ON contract_signatures;
DROP POLICY IF EXISTS "Owners can create signatures for their contracts" ON contract_signatures;

-- Eliminar triggers duplicados
DROP TRIGGER IF EXISTS trigger_update_rental_contracts_updated_at ON rental_contracts;
DROP TRIGGER IF EXISTS trigger_update_contract_signatures_updated_at ON contract_signatures;
DROP TRIGGER IF EXISTS trigger_update_contract_clauses_updated_at ON contract_clauses;

-- Eliminar funciones (se recrearán con CREATE OR REPLACE)
-- DROP FUNCTION IF EXISTS update_rental_contracts_updated_at();
-- DROP FUNCTION IF EXISTS update_contract_signatures_updated_at();
-- DROP FUNCTION IF EXISTS update_contract_clauses_updated_at();
-- DROP FUNCTION IF EXISTS get_contract_canvas_content(uuid);
-- DROP FUNCTION IF EXISTS sync_contract_canvas_content(uuid);

-- Eliminar tabla contract_clauses completamente (se recreará)
DROP TABLE IF EXISTS contract_clauses CASCADE;

-- Confirmación de limpieza
SELECT
    'Migration conflicts cleaned - ready to run migrations' as status,
    now() as cleaned_at;
