-- ============================================================================
-- HABILITAR EDICIÓN DE CONTRATOS EXISTENTES
-- ============================================================================
-- Este script asegura que los contratos existentes puedan ser editados
-- por sus propietarios y aplicantes.
-- ============================================================================

-- 1. PRIMERO: LIMPIAR POLÍTICAS EXISTENTES QUE PUEDEN ESTAR BLOQUEANDO
-- ============================================================================

DROP POLICY IF EXISTS "contracts_update_related" ON rental_contracts;
DROP POLICY IF EXISTS "contracts_update_owner" ON rental_contracts;
DROP POLICY IF EXISTS "rental_contracts_update_policy" ON rental_contracts;

-- 2. APLICAR POLÍTICA DE EDICIÓN PARA CONTRATOS EXISTENTES
-- ============================================================================
-- Los usuarios pueden editar contratos donde son:
-- - El aplicante (applicant_id)
-- - O el propietario de la propiedad (owner_id)

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

-- 3. ASEGURAR PERMISOS GENERALES
-- ============================================================================

GRANT UPDATE ON rental_contracts TO authenticated;

-- 4. VERIFICACIÓN: MOSTRAR POLÍTICAS ACTIVAS
-- ============================================================================

SELECT
  '✅ POLÍTICAS DE EDICIÓN APLICADAS' as estado,
  'Ahora los usuarios pueden editar contratos existentes' as mensaje;

-- Mostrar políticas activas
SELECT
  policyname as "Política",
  cmd as "Operación",
  '✅ ACTIVA' as "Estado"
FROM pg_policies
WHERE tablename = 'rental_contracts'
  AND cmd = 'UPDATE';

-- 5. VERIFICACIÓN: CONTRATOS EXISTENTES Y SUS PERMISOS
-- ============================================================================

SELECT
  '=== CONTRATOS EXISTENTES Y PERMISOS ===' as info;

SELECT
  rc.id as contract_id,
  rc.status as contract_status,
  rc.contract_format,
  CASE
    WHEN rc.contract_html IS NOT NULL THEN 'HTML'
    WHEN rc.contract_content IS NOT NULL THEN 'JSON'
    ELSE 'VACÍO'
  END as contenido_tipo,
  a.applicant_id,
  p.owner_id,
  CASE
    WHEN a.applicant_id = auth.uid() THEN '✅ PUEDES EDITAR (eres aplicante)'
    WHEN p.owner_id = auth.uid() THEN '✅ PUEDES EDITAR (eres propietario)'
    ELSE '❌ NO PUEDES EDITAR'
  END as tu_permiso_actual
FROM rental_contracts rc
LEFT JOIN applications a ON a.id = rc.application_id
LEFT JOIN properties p ON p.id = a.property_id
ORDER BY rc.created_at DESC
LIMIT 10;

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
--
-- 1. Ejecuta TODO este script en Supabase SQL Editor
-- 2. Ve a tu aplicación web
-- 3. Intenta editar un contrato existente
-- 4. El botón "Editar" debería aparecer ahora
--
-- ============================================================================
-- SI AÚN NO FUNCIONA:
-- ============================================================================
--
-- Ejecuta el diagnóstico desde el navegador:
-- diagnostico_contrato_especifico.js
--
-- O el diagnóstico general:
-- diagnostico_contratos_frontend.js
--
-- ============================================================================
