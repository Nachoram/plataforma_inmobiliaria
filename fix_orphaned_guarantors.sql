-- ============================================================================
-- SOLUCIÓN: Asignar avales huérfanos sin aplicación asociada
-- Los avales que no tienen applicant_id necesitan un created_by válido
-- ============================================================================

-- PASO 1: Identificar avales huérfanos (sin aplicación asociada)
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.rut,
  g.created_at,
  'ORPHANED' as status
FROM guarantors g
LEFT JOIN applications a ON a.guarantor_id = g.id
WHERE a.id IS NULL AND g.created_by IS NULL
ORDER BY g.created_at DESC;

-- PASO 2: ASIGNACIÓN DE AVALES HUÉRFANOS
-- IMPORTANTE: Reemplaza 'ADMIN_USER_ID' con el UUID de un usuario administrador real
-- Puedes obtenerlo desde la tabla auth.users o profiles

-- OPCIÓN A: Asignar a un usuario administrador específico
-- UPDATE guarantors
-- SET created_by = 'ADMIN_USER_ID'::uuid  -- ← Reemplaza con UUID real
-- WHERE id IN (
--   SELECT g.id
--   FROM guarantors g
--   LEFT JOIN applications a ON a.guarantor_id = g.id
--   WHERE a.id IS NULL AND g.created_by IS NULL
-- );

-- OPCIÓN B: Asignar a un usuario específico por nombre/email (más seguro)
-- Primero, encuentra el UUID del administrador:

-- SELECT id, email FROM auth.users WHERE email = 'admin@tusistema.com';
-- O si tienes tabla profiles:
-- SELECT p.id, p.email FROM profiles p WHERE p.email = 'admin@tusistema.com';

-- Una vez que tengas el UUID, ejecuta:
-- UPDATE guarantors
-- SET created_by = 'UUID_DEL_ADMINISTRADOR'::uuid
-- WHERE created_by IS NULL
--   AND id NOT IN (SELECT guarantor_id FROM applications WHERE guarantor_id IS NOT NULL);

-- PASO 3: Verificar que se asignaron correctamente
SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by,
  COUNT(CASE
    WHEN created_by IS NOT NULL AND id IN (SELECT guarantor_id FROM applications WHERE guarantor_id IS NOT NULL) THEN 1
  END) as linked_to_applications,
  COUNT(CASE
    WHEN created_by IS NOT NULL AND id NOT IN (SELECT guarantor_id FROM applications WHERE guarantor_id IS NOT NULL) THEN 1
  END) as orphaned_but_assigned
FROM guarantors;

-- PASO 4: Resumen final de asignaciones
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.rut,
  g.created_by,
  CASE
    WHEN g.created_by IS NOT NULL AND a.id IS NOT NULL THEN '✅ Aplicación existente'
    WHEN g.created_by IS NOT NULL AND a.id IS NULL THEN '✅ Aval huérfano asignado'
    ELSE '❌ Aún sin asignar'
  END as assignment_status,
  p.email as creator_email
FROM guarantors g
LEFT JOIN applications a ON a.guarantor_id = g.id
LEFT JOIN profiles p ON p.id = g.created_by
ORDER BY
  CASE
    WHEN g.created_by IS NULL THEN 1
    WHEN a.id IS NULL THEN 2
    ELSE 3
  END,
  g.created_at DESC;
