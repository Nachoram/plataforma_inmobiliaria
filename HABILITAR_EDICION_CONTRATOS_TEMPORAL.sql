-- ============================================================================
-- SOLUCIÓN TEMPORAL: Habilitar edición de contratos
-- ============================================================================
-- Este script permite que TODOS los usuarios autenticados puedan editar
-- CUALQUIER contrato. Úsalo SOLO para probar mientras diagnosticamos.
-- ============================================================================

-- ============================================================================
-- OPCIÓN 1: Políticas MUY PERMISIVAS (temporal para debugging)
-- ============================================================================

-- Eliminar política UPDATE restrictiva actual
DROP POLICY IF EXISTS "contracts_update_related" ON rental_contracts;
DROP POLICY IF EXISTS "contracts_update_owner" ON rental_contracts;
DROP POLICY IF EXISTS "rental_contracts_update_policy" ON rental_contracts;

-- Crear política UPDATE temporal MUY PERMISIVA
CREATE POLICY "contracts_update_temp_permissive" ON rental_contracts
  FOR UPDATE TO authenticated
  USING (true)  -- ⚠️ CUALQUIERA puede actualizar
  WITH CHECK (true);

-- Asegurar que authenticated tiene permisos
GRANT UPDATE ON rental_contracts TO authenticated;

-- ============================================================================
-- VERIFICAR QUE SE APLICÓ
-- ============================================================================

SELECT 
  '✅ POLÍTICA PERMISIVA APLICADA' as resultado,
  'AHORA intenta editar un contrato en tu aplicación' as siguiente_paso;

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rental_contracts' 
  AND cmd = 'UPDATE';

-- ============================================================================
-- ⚠️ IMPORTANTE:
-- ============================================================================
-- Esta política es INSEGURA y solo para debugging.
-- Una vez que funcione la edición, ejecuta FIX_RLS_CORRECTO.sql
-- para restaurar las políticas seguras.
-- ============================================================================

-- Para revertir a políticas seguras después:
-- 1. Ejecuta: FIX_RLS_CORRECTO.sql
-- ============================================================================

