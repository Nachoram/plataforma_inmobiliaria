-- ============================================================================
-- DIAGNÓSTICO: ¿Por qué no puedo editar contratos?
-- ============================================================================
-- Este script identifica el problema específico
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR ESTRUCTURA DE RENTAL_CONTRACTS
-- ============================================================================
SELECT 
  'ESTRUCTURA DE RENTAL_CONTRACTS' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. VERIFICAR POLÍTICAS RLS ACTUALES
-- ============================================================================
SELECT 
  '=== POLÍTICAS RLS DE RENTAL_CONTRACTS ===' as info;

SELECT 
  policyname as "Política",
  cmd as "Operación",
  permissive as "Permisivo",
  roles as "Roles"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'rental_contracts'
ORDER BY cmd, policyname;

-- ============================================================================
-- 3. VER CONTRATOS EXISTENTES Y SUS RELACIONES
-- ============================================================================
SELECT 
  '=== CONTRATOS Y PROPIETARIOS ===' as info;

SELECT 
  rc.id as contract_id,
  rc.application_id,
  a.applicant_id,
  a.property_id,
  p.owner_id,
  CONCAT(p.address_street, ' ', p.address_number) as property_address,
  rc.status as contract_status,
  CASE 
    WHEN p.owner_id = auth.uid() THEN '✅ Eres propietario'
    WHEN a.applicant_id = auth.uid() THEN '✅ Eres aplicante'
    ELSE '❌ No tienes relación'
  END as tu_relacion
FROM rental_contracts rc
LEFT JOIN applications a ON a.id = rc.application_id
LEFT JOIN properties p ON p.id = a.property_id
ORDER BY rc.created_at DESC
LIMIT 10;

-- ============================================================================
-- 4. VERIFICAR PERMISOS DEL USUARIO ACTUAL
-- ============================================================================
SELECT 
  '=== TU USUARIO ===' as info;

SELECT 
  auth.uid() as tu_user_id,
  auth.role() as tu_rol;

-- ============================================================================
-- 5. PROBAR UPDATE DE UN CONTRATO (SIMULACIÓN)
-- ============================================================================
SELECT 
  '=== PRUEBA DE PERMISOS UPDATE ===' as info;

-- Ver si puedes actualizar algún contrato
SELECT 
  rc.id,
  rc.status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON p.id = a.property_id
      WHERE a.id = rc.application_id
      AND (a.applicant_id = auth.uid() OR p.owner_id = auth.uid())
    ) THEN '✅ PUEDES EDITAR'
    ELSE '❌ NO PUEDES EDITAR'
  END as permiso_edicion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = rc.application_id
      AND a.applicant_id = auth.uid()
    ) THEN 'Eres el aplicante'
    WHEN EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON p.id = a.property_id
      WHERE a.id = rc.application_id
      AND p.owner_id = auth.uid()
    ) THEN 'Eres el propietario'
    ELSE 'Sin relación'
  END as razon
FROM rental_contracts rc
LIMIT 5;

-- ============================================================================
-- 6. VERIFICAR SI contract_content ACEPTA JSON
-- ============================================================================
SELECT 
  '=== TIPO DE DATOS DE contract_content ===' as info;

SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
  AND column_name IN ('contract_content', 'contract_html', 'updated_at');

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta este script COMPLETO en Supabase SQL Editor
-- 2. Toma CAPTURA DE PANTALLA de TODOS los resultados
-- 3. Envíamela para identificar el problema exacto
-- 
-- Si ves "❌ NO PUEDES EDITAR" en la sección 5:
--   → El problema es de permisos RLS
--   → Solución: Ejecutar FIX_RLS_CORRECTO.sql
--
-- Si ves "✅ PUEDES EDITAR" pero aún así no funciona:
--   → El problema puede ser:
--     a) Tipo de dato incorrecto en contract_content
--     b) Campo updated_at con restricciones
--     c) Trigger que bloquea la actualización
-- ============================================================================

