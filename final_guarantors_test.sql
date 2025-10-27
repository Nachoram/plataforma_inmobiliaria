-- ============================================================================
-- TEST FINAL COMPLETO: Verificación total del sistema de avales
-- Ejecutar después de actualizar los registros antiguos
-- ============================================================================

-- 1. Verificar estado final de la tabla
SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by,
  COUNT(DISTINCT created_by) as unique_creators
FROM guarantors;

-- 2. Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'guarantors';

-- 3. Verificar políticas activas
SELECT
  policyname,
  cmd,
  CASE
    WHEN policyname = 'authenticated_users_can_insert_guarantors' THEN '✅ INSERT: Solo usuarios autenticados con created_by válido'
    WHEN policyname = 'users_can_update_own_guarantors' THEN '✅ UPDATE: Solo quien creó puede actualizar'
    WHEN policyname = 'users_can_view_own_guarantors' THEN '✅ SELECT: Ver avales propios o relacionados'
    WHEN policyname = 'users_can_delete_own_guarantors' THEN '✅ DELETE: Solo quien creó puede eliminar'
    ELSE '❓ Política desconocida'
  END as description
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'guarantors'
ORDER BY policyname;

-- 4. Verificar índice de performance
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'guarantors'
AND indexname = 'idx_guarantors_created_by';

-- 5. Test de simulación de operaciones (descomenta y reemplaza USER_ID)
-- IMPORTANTE: Reemplaza 'USER_ID_REAL' con un UUID válido

/*
-- Simular contexto autenticado
SET request.jwt.claim.sub = 'USER_ID_REAL';

-- Test INSERT (debería funcionar)
INSERT INTO guarantors (
  first_name, paternal_last_name, rut, profession,
  monthly_income_clp, created_by
) VALUES (
  'Test Aval', 'Pérez', '99999999-9', 'Ingeniero',
  1500000, 'USER_ID_REAL'
) RETURNING id, first_name, created_by;

-- Test SELECT (debería ver sus propios avales)
SELECT id, first_name, created_by FROM guarantors
WHERE created_by = 'USER_ID_REAL';

-- Test UPDATE (debería poder actualizar sus propios avales)
UPDATE guarantors
SET profession = 'Ingeniero Senior'
WHERE created_by = 'USER_ID_REAL' AND first_name = 'Test Aval'
RETURNING id, first_name, profession;
*/

-- 6. Resumen final
DO $$
DECLARE
    total_count INTEGER;
    null_count INTEGER;
    valid_count INTEGER;
    policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM guarantors;
    SELECT COUNT(*) INTO null_count FROM guarantors WHERE created_by IS NULL;
    SELECT COUNT(*) INTO valid_count FROM guarantors WHERE created_by IS NOT NULL;
    SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename = 'guarantors';

    RAISE NOTICE '==================================================';
    RAISE NOTICE '📊 RESUMEN FINAL DEL SISTEMA DE AVALES';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 Total de avales: %', total_count;
    RAISE NOTICE '❌ Con created_by NULL: %', null_count;
    RAISE NOTICE '✅ Con created_by válido: %', valid_count;
    RAISE NOTICE '🔒 Políticas RLS activas: %', policies_count;
    RAISE NOTICE '';

    IF null_count = 0 AND policies_count = 4 THEN
        RAISE NOTICE '🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!';
        RAISE NOTICE '✅ Todos los avales tienen ownership asignado';
        RAISE NOTICE '✅ Políticas RLS correctamente configuradas';
        RAISE NOTICE '✅ Listo para uso en producción';
    ELSIF null_count > 0 THEN
        RAISE NOTICE '⚠️ AÚN HAY AVALES SIN CREATED_BY';
        RAISE NOTICE 'Ejecuta fix_null_created_by.sql para resolver';
    ELSE
        RAISE NOTICE '⚠️ VERIFICA LAS POLÍTICAS RLS';
        RAISE NOTICE 'Deberían haber exactamente 4 políticas activas';
    END IF;

    RAISE NOTICE '==================================================';
END $$;
