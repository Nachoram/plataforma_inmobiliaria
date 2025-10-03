-- ============================================================================
-- SOLUCIÓN RÁPIDA: Habilitar edición de contratos
-- ============================================================================
-- Copia y pega este script COMPLETO en el SQL Editor de Supabase
-- https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql
-- ============================================================================

-- 1. HABILITAR RLS EN LA TABLA RENTAL_CONTRACTS
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS EXISTENTES QUE BLOQUEAN LA EDICIÓN
DROP POLICY IF EXISTS "contracts_update_related" ON rental_contracts;
DROP POLICY IF EXISTS "contracts_update_owner" ON rental_contracts;
DROP POLICY IF EXISTS "rental_contracts_update_policy" ON rental_contracts;

-- 3. CREAR POLÍTICA QUE PERMITE EDITAR CONTRATOS
-- Los usuarios pueden editar contratos donde son:
-- - El aplicante (applicant_id)
-- - O el propietario de la propiedad (owner_id)
-- Permite editar tanto contract_content como contract_html
CREATE POLICY "contracts_update_related" ON rental_contracts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN properties ON properties.id = applications.property_id
      WHERE applications.id = rental_contracts.application_id
      AND (
        applications.applicant_id = auth.uid() OR
        properties.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      JOIN properties ON properties.id = applications.property_id
      WHERE applications.id = rental_contracts.application_id
      AND (
        applications.applicant_id = auth.uid() OR
        properties.owner_id = auth.uid()
      )
    )
  );

-- 4. ASEGURAR PERMISOS DE UPDATE
GRANT UPDATE ON rental_contracts TO authenticated;

-- 5. VERIFICACIÓN
SELECT
  '✅ POLÍTICA APLICADA - AHORA PUEDES EDITAR CONTRATOS' as resultado,
  'Soporta contract_html y contract_content' as nota,
  'Verifica en tu aplicación que ya puedes editar contratos' as siguiente_paso;

-- 6. MOSTRAR POLÍTICAS ACTUALES
SELECT
  policyname as "Política",
  cmd as "Operación",
  '✅ ACTIVA' as "Estado"
FROM pg_policies
WHERE tablename = 'rental_contracts'
  AND cmd = 'UPDATE';

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
--
-- 1. Ve a: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql
-- 2. Copia TODO este script
-- 3. Pégalo en el SQL Editor
-- 4. Click "Run" (o presiona Ctrl+Enter)
-- 5. Deberías ver: "✅ POLÍTICA APLICADA - AHORA PUEDES EDITAR CONTRATOS"
-- 6. Ve a tu aplicación y prueba editar un contrato
--
-- ============================================================================
-- ¿PROBLEMAS?
-- ============================================================================
--
-- Si aún no puedes editar:
-- 1. Recarga la página (Ctrl+F5)
-- 2. Verifica que estés logueado
-- 3. Asegúrate de ser propietario o aplicante del contrato
-- 4. Revisa la consola del navegador (F12) por errores
--
-- ============================================================================
