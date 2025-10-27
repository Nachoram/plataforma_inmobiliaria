-- ============================================================================
-- ASIGNACIÓN AUTOMÁTICA DE AVALES HUÉRFANOS (Versión Corregida)
-- Asigna automáticamente los avales sin created_by a un usuario administrador
-- ============================================================================

-- PASO 1: Encontrar usuario administrador automáticamente (sin campo role)
DO $$
DECLARE
    admin_user_id UUID;
    orphaned_count INTEGER;
    admin_email TEXT;
BEGIN
    -- Buscar primero usuario con email que contenga 'admin'
    SELECT p.id, p.email INTO admin_user_id, admin_email
    FROM profiles p
    WHERE p.email LIKE '%admin%'
    ORDER BY p.created_at ASC
    LIMIT 1;

    -- Si no hay admin por email, buscar por 'root'
    IF admin_user_id IS NULL THEN
        SELECT p.id, p.email INTO admin_user_id, admin_email
        FROM profiles p
        WHERE p.email LIKE '%root%'
        ORDER BY p.created_at ASC
        LIMIT 1;
    END IF;

    -- Si aún no hay, tomar el usuario más antiguo (creador del sistema)
    IF admin_user_id IS NULL THEN
        SELECT u.id, p.email INTO admin_user_id, admin_email
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
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

    -- Si no hay avales huérfanos, terminar
    IF orphaned_count = 0 THEN
        RAISE NOTICE 'ℹ️ No hay avales huérfanos para asignar';
        RETURN;
    END IF;

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
    RAISE NOTICE '   👤 Usuario administrador: % (%)', admin_user_id, admin_email;
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
  g.created_at DESC
LIMIT 20;
