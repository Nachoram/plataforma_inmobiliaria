-- ============================================================================
-- VERIFICACIÓN: ¿Ya puedes editar contratos?
-- ============================================================================
-- Ejecuta este script para verificar que todo esté configurado correctamente
-- ============================================================================

-- 1. VER POLÍTICAS RLS DE RENTAL_CONTRACTS
SELECT
  '=== POLÍTICAS RLS DE RENTAL_CONTRACTS ===' as seccion;

SELECT
  policyname as "Política",
  cmd as "Operación",
  permissive as "Tipo",
  roles as "Roles Permitidos"
FROM pg_policies
WHERE tablename = 'rental_contracts'
ORDER BY cmd;

-- 2. VER CONTRATOS Y QUIÉN PUEDE EDITARLOS
SELECT
  '=== CONTRATOS Y PERMISOS DE EDICIÓN ===' as seccion;

SELECT
  rc.id as contract_id,
  rc.status as contract_status,
  a.applicant_id,
  p.owner_id,
  CONCAT('Calle ', p.address_street, ' ', p.address_number) as property,
  CASE
    WHEN a.applicant_id = auth.uid() THEN '✅ Tú eres el aplicante - PUEDES EDITAR'
    WHEN p.owner_id = auth.uid() THEN '✅ Tú eres el propietario - PUEDES EDITAR'
    ELSE '❌ No tienes permisos para editar'
  END as tu_permiso
FROM rental_contracts rc
LEFT JOIN applications a ON a.id = rc.application_id
LEFT JOIN properties p ON p.id = a.property_id
ORDER BY rc.created_at DESC
LIMIT 5;

-- 3. PROBAR UNA ACTUALIZACIÓN DE PRUEBA (SIMULACIÓN)
SELECT
  '=== SIMULACIÓN DE PERMISO UPDATE ===' as seccion;

-- Esta consulta simula la lógica de la política RLS
SELECT
  rc.id,
  rc.status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON p.id = a.property_id
      WHERE a.id = rc.application_id
      AND (a.applicant_id = auth.uid() OR p.owner_id = auth.uid())
    ) THEN '✅ PUEDES EDITAR ESTE CONTRATO'
    ELSE '❌ NO PUEDES EDITAR ESTE CONTRATO'
  END as permiso_simulado
FROM rental_contracts rc
LIMIT 3;

-- 4. VER TU USUARIO ACTUAL
SELECT
  '=== INFORMACIÓN DE TU SESIÓN ===' as seccion,
  auth.uid() as tu_user_id,
  auth.role() as tu_rol;

-- ============================================================================
-- RESULTADOS ESPERADOS:
-- ============================================================================
--
-- ✅ Deberías ver al menos una política UPDATE para rental_contracts
-- ✅ Para contratos donde eres aplicante o propietario: "✅ PUEDES EDITAR"
-- ✅ Tu user_id debería aparecer (no null)
-- ✅ Tu rol debería ser "authenticated"
--
-- ============================================================================
-- SI NO FUNCIONA:
-- ============================================================================
--
-- ❌ Si no hay política UPDATE:
--    → Ejecuta: SOLUCION_RAPIDA_EDICION_CONTRATOS.sql
--
-- ❌ Si todos los contratos muestran "NO PUEDES EDITAR":
--    → Verifica que estés logueado en la aplicación
--    → Asegúrate de que eres aplicante o propietario de algún contrato
--
-- ❌ Si tu user_id es null:
--    → No estás logueado, inicia sesión primero
--    → Los scripts en SQL Editor no tienen tu sesión de usuario
--
-- ============================================================================
-- ✅ SOLUCIÓN PARA user_id = null:
-- ============================================================================
--
-- El script ejecutado en SQL Editor no tiene tu sesión de usuario.
-- Para verificar correctamente:
--
-- 1. Inicia sesión en tu aplicación web
-- 2. Abre la consola del navegador (F12)
-- 3. Copia y pega el contenido de: diagnostico_contratos_frontend.js
-- 4. Presiona Enter y revisa los resultados
--
-- El diagnóstico detectará automáticamente si tus contratos usan:
-- - contract_html (HTML completo)
-- - contract_content (JSON estructurado)
-- - Ambos formatos
--
-- Y probará editar la columna correcta.
--
-- ============================================================================
