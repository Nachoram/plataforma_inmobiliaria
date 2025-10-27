-- ============================================================================
-- SOLUCIÓN: Actualizar avales antiguos sin created_by
-- Los registros existentes necesitan asignar un created_by válido
-- ============================================================================

-- OPCION 1: Para avales relacionados con aplicaciones existentes
-- Asignar created_by basado en el applicant_id de la aplicación
UPDATE guarantors
SET created_by = applications.applicant_id
FROM applications
WHERE guarantors.id = applications.guarantor_id
  AND guarantors.created_by IS NULL
  AND applications.guarantor_id IS NOT NULL;

-- OPCION 2: Para avales sin aplicaciones (casos raros)
-- Asignar a un usuario administrador o dejar como NULL temporalmente
-- IMPORTANTE: Reemplaza 'ADMIN_USER_ID' con un UUID válido de usuario administrador

-- UPDATE guarantors
-- SET created_by = 'ADMIN_USER_ID'::uuid
-- WHERE created_by IS NULL;

-- Verificar resultados después de la actualización
SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by
FROM guarantors;

-- Ver detalle de avales actualizados
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.rut,
  g.created_by,
  CASE
    WHEN g.created_by IS NOT NULL THEN '✅ Actualizado'
    ELSE '⚠️ Aún NULL - revisar manualmente'
  END as status,
  a.applicant_id,
  a.property_id
FROM guarantors g
LEFT JOIN applications a ON a.guarantor_id = g.id
ORDER BY g.created_at DESC;
