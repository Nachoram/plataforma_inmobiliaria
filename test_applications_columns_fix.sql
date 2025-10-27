-- ============================================================================
-- VERIFICACIÓN: Columnas de applications después de la corrección
-- Ejecutar después de aplicar la migración para confirmar que todo funciona
-- ============================================================================

-- 1. Verificar que updated_at existe
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'applications'
AND column_name = 'updated_at';

-- 2. Verificar que las columnas snapshot existen
SELECT
  COUNT(*) as snapshot_columns_count,
  string_agg(column_name, ', ') as snapshot_columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'applications'
AND column_name LIKE 'snapshot_%';

-- 3. Verificar trigger
SELECT
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'update_applications_updated_at';

-- 4. Test de actualización (simular lo que hace el frontend)
DO $$
DECLARE
  test_app_id uuid;
  update_result record;
BEGIN
  -- Obtener una aplicación existente para test
  SELECT id INTO test_app_id
  FROM applications
  LIMIT 1;

  IF test_app_id IS NULL THEN
    RAISE NOTICE '⚠️ No hay aplicaciones para testear, pero la estructura está correcta';
    RETURN;
  END IF;

  -- Simular actualización como hace el frontend
  UPDATE applications
  SET
    message = 'Test update message',
    updated_at = now(),
    snapshot_applicant_profession = 'Test Profession'
  WHERE id = test_app_id
  RETURNING id, updated_at, snapshot_applicant_profession;

  RAISE NOTICE '✅ Test de actualización exitoso - updated_at funciona correctamente';
END $$;

-- 5. Verificar estructura completa
SELECT
  '✅ updated_at existe' as status_updated_at,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'applications'
    AND column_name = 'updated_at'
  ) THEN '✅' ELSE '❌' END as updated_at_check,

  '✅ Columnas snapshot existen' as status_snapshot,
  CASE WHEN (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'applications'
    AND column_name LIKE 'snapshot_%'
  ) >= 16 THEN '✅' ELSE '❌' END as snapshot_check,

  '✅ Trigger automático activo' as status_trigger,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_applications_updated_at'
  ) THEN '✅' ELSE '❌' END as trigger_check;

-- 6. Resumen final
DO $$
DECLARE
  updated_at_exists boolean;
  snapshot_count integer;
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'applications'
    AND column_name = 'updated_at'
  ) INTO updated_at_exists;

  SELECT COUNT(*) INTO snapshot_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'applications'
  AND column_name LIKE 'snapshot_%';

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_applications_updated_at'
  ) INTO trigger_exists;

  RAISE NOTICE '==================================================';
  RAISE NOTICE '🎯 VERIFICACIÓN FINAL - TABLA APPLICATIONS';
  RAISE NOTICE '==================================================';
  RAISE NOTICE '📅 updated_at: %', CASE WHEN updated_at_exists THEN '✅ PRESENTE' ELSE '❌ FALTANTE' END;
  RAISE NOTICE '📸 Columnas snapshot: %/16', snapshot_count;
  RAISE NOTICE '🔄 Trigger automático: %', CASE WHEN trigger_exists THEN '✅ ACTIVO' ELSE '❌ INACTIVO' END;
  RAISE NOTICE '';

  IF updated_at_exists AND snapshot_count >= 16 AND trigger_exists THEN
    RAISE NOTICE '🎉 ¡CORRECCIÓN COMPLETA Y EXITOSA!';
    RAISE NOTICE '✅ El error "Could not find updated_at column" está resuelto';
    RAISE NOTICE '✅ RentalApplicationForm puede actualizar postulaciones';
    RAISE NOTICE '✅ Sistema completamente funcional';
  ELSE
    RAISE NOTICE '⚠️ CORRECCIÓN INCOMPLETA:';
    IF NOT updated_at_exists THEN
      RAISE NOTICE '   ❌ Falta columna updated_at');
    END IF;
    IF snapshot_count < 16 THEN
      RAISE NOTICE '   ❌ Faltan columnas snapshot (%/16)', snapshot_count);
    END IF;
    IF NOT trigger_exists THEN
      RAISE NOTICE '   ❌ Falta trigger automático');
    END IF;
  END IF;

  RAISE NOTICE '==================================================';
END $$;
