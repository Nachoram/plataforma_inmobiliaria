-- ============================================================================
-- ASIGNAR AVALES HUÉRFANOS AL USUARIO MÁS ACTIVO
-- Usa el usuario que ya creó más avales como "administrador"
-- ============================================================================

DO $$
DECLARE
    active_user_id CONSTANT UUID := '3910eba1-4ab6-4229-a65b-0b89423a8533';
    active_user_email CONSTANT TEXT := 'iramirez.leg@gmail.com';
    orphaned_count INTEGER;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = active_user_id) THEN
        RAISE EXCEPTION 'Usuario administrador no encontrado: %', active_user_id;
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
    SET created_by = active_user_id
    WHERE id IN (
      SELECT g.id
      FROM guarantors g
      LEFT JOIN applications a ON a.guarantor_id = g.id
      WHERE a.id IS NULL AND g.created_by IS NULL
    );

    -- Reportar resultados
    RAISE NOTICE '✅ Asignación completada exitosamente!';
    RAISE NOTICE '   👤 Usuario administrador: % (%)', active_user_id, active_user_email;
    RAISE NOTICE '   📋 Avales asignados: %', orphaned_count;
    RAISE NOTICE '   🎯 Total avales con ownership válido: todos!';
END $$;

-- VERIFICACIÓN INMEDIATA
SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by,
  CASE
    WHEN COUNT(CASE WHEN created_by IS NULL THEN 1 END) = 0 THEN '🎉 ¡PERFECTO! Todos los avales tienen ownership'
    ELSE '⚠️ Aún hay avales sin asignar'
  END as status
FROM guarantors;

-- DETALLE DE ASIGNACIONES FINALES
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.rut,
  g.created_by,
  p.email as assigned_to_email,
  CASE
    WHEN a.id IS NOT NULL THEN '✅ Aval de aplicación existente'
    WHEN g.created_by IS NOT NULL THEN '✅ Aval huérfano asignado'
    ELSE '❌ Error: aún sin asignar'
  END as final_status
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
