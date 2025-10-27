-- ============================================================================
-- ASIGNACIÓN AUTOMÁTICA DE AVALES HUÉRFANOS
-- Asigna automáticamente los avales sin created_by a un usuario administrador
-- ============================================================================

-- PASO 1: Encontrar usuario administrador automáticamente
DO $$
DECLARE
    admin_user_id UUID;
    orphaned_count INTEGER;
BEGIN
    -- Buscar primero usuario con rol admin
    SELECT p.id INTO admin_user_id
    FROM profiles p
    WHERE p.role = 'admin'
    ORDER BY p.created_at ASC
    LIMIT 1;

    -- Si no hay admin, buscar por email que contenga 'admin'
    IF admin_user_id IS NULL THEN
        SELECT p.id INTO admin_user_id
        FROM profiles p
        WHERE p.email LIKE '%admin%'
        ORDER BY p.created_at ASC
        LIMIT 1;
    END IF;

    -- Si aún no hay, tomar el usuario más antiguo (probablemente creador del sistema)
    IF admin_user_id IS NULL THEN
        SELECT u.id INTO admin_user_id
        FROM auth.users u
        ORDER BY u.created_at ASC
        LIMIT 1;
    END IF;

    -- Verificar que encontramos un usuario
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún usuario válido para asignar los avales huérfanos';
    END IF;

    -- Contar avales huérfanos antes de actualizar
    SELECT COUNT(*) INTO orphaned_count
    FROM guarantors g
    LEFT JOIN applications a ON a.guarantor_id = g.id
    WHERE a.id IS NULL AND g.created_by IS NULL;

    -- Actualizar avales huérfanos
    UPDATE guarantors
    SET created_by = admin_user_id
    WHERE id IN (
      SELECT g.id
      FROM guarantors g
      LEFT JOIN applications a ON a.guarantor_id = g.id
      WHERE a.id IS NULL AND g.created_by IS NULL
    );

    -- Reportar resultados
    RAISE NOTICE '✅ Asignación completada:';
    RAISE NOTICE '   👤 Usuario administrador: %', admin_user_id;
    RAISE NOTICE '   📋 Avales asignados: %', orphaned_count;
END $$;

-- PASO 2: Verificar resultados
SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by
FROM guarantors;

-- PASO 3: Mostrar detalle de asignaciones
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.rut,
  g.created_by,
  p.email as assigned_to_email,
  CASE
    WHEN a.id IS NOT NULL THEN '✅ Aval de aplicación existente'
    WHEN g.created_by IS NOT NULL THEN '✅ Aval huérfano asignado automáticamente'
    ELSE '❌ Error: aún sin asignar'
  END as status
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
