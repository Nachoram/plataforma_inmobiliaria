-- ============================================================================
-- ASIGNACIÓN MANUAL DE AVALES HUÉRFANOS
-- Reemplaza 'TU_ADMIN_UUID' con el UUID real del usuario administrador
-- ============================================================================

-- PASO 1: Reemplaza este UUID con uno real de tu tabla de usuarios
-- Puedes obtenerlo ejecutando find_admin_user_fixed.sql primero
DO $$
DECLARE
    admin_uuid CONSTANT UUID := 'TU_ADMIN_UUID'; -- ← CAMBIA ESTO
    assigned_count INTEGER;
BEGIN
    -- Verificar que el UUID existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_uuid) THEN
        RAISE EXCEPTION 'El UUID especificado no existe en auth.users';
    END IF;

    -- Contar antes de asignar
    SELECT COUNT(*) INTO assigned_count
    FROM guarantors g
    LEFT JOIN applications a ON a.guarantor_id = g.id
    WHERE a.id IS NULL AND g.created_by IS NULL;

    -- Asignar avales huérfanos
    UPDATE guarantors
    SET created_by = admin_uuid
    WHERE id IN (
      SELECT g.id
      FROM guarantors g
      LEFT JOIN applications a ON a.guarantor_id = g.id
      WHERE a.id IS NULL AND g.created_by IS NULL
    );

    RAISE NOTICE '✅ Asignados % avales huérfanos al usuario %', assigned_count, admin_uuid;
END $$;

-- PASO 2: Verificar el resultado
SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by
FROM guarantors;

-- PASO 3: Ver detalle de asignaciones
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.created_by,
  p.email
FROM guarantors g
LEFT JOIN profiles p ON p.id = g.created_by
WHERE g.id NOT IN (SELECT guarantor_id FROM applications WHERE guarantor_id IS NOT NULL)
ORDER BY g.created_at DESC;
