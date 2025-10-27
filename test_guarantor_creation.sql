-- ============================================================================
-- TEST FINAL: Verificar creación de aval después de la corrección RLS
-- Ejecutar después de probar desde el frontend
-- ============================================================================

-- 1. Verificar que el aval se creó correctamente
SELECT
  id,
  first_name,
  paternal_last_name,
  rut,
  profession,
  monthly_income_clp,
  created_by,
  created_at
FROM guarantors
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar que created_by coincide con el usuario autenticado
-- (Reemplaza 'USER_ID_DEL_USUARIO' con el ID real del usuario que hizo la prueba)
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.rut,
  g.created_by,
  CASE
    WHEN g.created_by IS NOT NULL THEN '✅ Correcto: created_by asignado'
    ELSE '❌ Error: created_by es NULL'
  END as status
FROM guarantors g
ORDER BY g.created_at DESC
LIMIT 5;

-- 3. Verificar que no hay registros con created_by inválido
SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by
FROM guarantors;

-- 4. Test de simulación de INSERT (descomenta y reemplaza USER_ID)
/*
-- Simular contexto autenticado (reemplaza con un UUID real)
SET request.jwt.claim.sub = 'USER_ID_REAL_DEL_USUARIO';

-- Intentar INSERT (esto debería funcionar ahora)
INSERT INTO guarantors (
  first_name,
  paternal_last_name,
  maternal_last_name,
  rut,
  profession,
  monthly_income_clp,
  address_street,
  address_number,
  address_commune,
  address_region,
  created_by
) VALUES (
  'Test Guarantor',
  'Pérez',
  'González',
  '12345678-9',
  'Ingeniero',
  2000000,
  'Calle Test',
  '123',
  'Santiago',
  'Metropolitana',
  'USER_ID_REAL_DEL_USUARIO'
) RETURNING *;
*/
