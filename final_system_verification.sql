-- ============================================================================
-- VERIFICACIÓN FINAL COMPLETA: Sistema de Avales 100% Funcional
-- Ejecutar DESPUÉS de asignar todos los avales huérfanos
-- ============================================================================

-- RESULTADO ESPERADO DESPUÉS DE LA ASIGNACIÓN:
-- total_guarantors: 14
-- null_created_by: 0
-- valid_created_by: 14

SELECT
  COUNT(*) as total_guarantors,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_created_by,
  COUNT(DISTINCT created_by) as unique_owners
FROM guarantors;

-- VERIFICACIÓN DE POLÍTICAS RLS
SELECT
  COUNT(*) as total_policies,
  CASE WHEN COUNT(*) = 4 THEN '✅ 4 políticas RLS activas' ELSE '❌ Políticas incompletas' END as rls_status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'guarantors';

-- VERIFICACIÓN DE ÍNDICE DE PERFORMANCE
SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ Índice de ownership creado' ELSE '❌ Índice faltante' END as index_status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'guarantors'
  AND indexname = 'idx_guarantors_created_by';

-- VERIFICACIÓN DE RLS HABILITADO
SELECT
  CASE WHEN rowsecurity THEN '✅ RLS habilitado' ELSE '❌ RLS deshabilitado' END as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'guarantors';

-- REPORTE FINAL DE SISTEMA
DO $$
DECLARE
    total_count INTEGER;
    null_count INTEGER;
    policies_count INTEGER;
    index_count INTEGER;
    rls_enabled BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO total_count FROM guarantors;
    SELECT COUNT(*) INTO null_count FROM guarantors WHERE created_by IS NULL;
    SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename = 'guarantors';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE tablename = 'guarantors' AND indexname = 'idx_guarantors_created_by';
    SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'guarantors';

    RAISE NOTICE '==================================================';
    RAISE NOTICE '🎯 VERIFICACIÓN FINAL DEL SISTEMA DE AVALES';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📊 ESTADÍSTICAS:';
    RAISE NOTICE '   • Total avales: %', total_count;
    RAISE NOTICE '   • Con created_by NULL: %', null_count;
    RAISE NOTICE '   • Con created_by válido: %', (total_count - null_count);
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SEGURIDAD:';
    RAISE NOTICE '   • RLS habilitado: %', CASE WHEN rls_enabled THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   • Políticas activas: %/4', policies_count;
    RAISE NOTICE '   • Índice de performance: %', CASE WHEN index_count > 0 THEN '✅' ELSE '❌' END;
    RAISE NOTICE '';

    IF null_count = 0 AND policies_count = 4 AND index_count > 0 AND rls_enabled THEN
        RAISE NOTICE '🎉 ¡SISTEMA 100%% FUNCIONAL Y SEGURO!';
        RAISE NOTICE '✅ Todos los avales tienen ownership válido';
        RAISE NOTICE '✅ Políticas RLS completamente configuradas';
        RAISE NOTICE '✅ Índices de performance activos';
        RAISE NOTICE '✅ Protección de datos habilitada';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 PRUEBA FINAL RECOMENDADA:';
        RAISE NOTICE '   1. Crear aval desde formulario web';
        RAISE NOTICE '   2. Verificar NO error 403';
        RAISE NOTICE '   3. Confirmar guardado correcto';
        RAISE NOTICE '';
        RAISE NOTICE '📝 RESUMEN DE CAMBIOS APLICADOS:';
        RAISE NOTICE '   • ✅ Políticas RLS corregidas (4 activas)';
        RAISE NOTICE '   • ✅ Campo created_by agregado a todos los avales';
        RAISE NOTICE '   • ✅ Índice de performance creado';
        RAISE NOTICE '   • ✅ Avales huérfanos asignados a usuario activo';
        RAISE NOTICE '   • ✅ Sistema listo para producción';
    ELSE
        RAISE NOTICE '⚠️ SISTEMA INCOMPLETO:';
        IF null_count > 0 THEN
            RAISE NOTICE '   ❌ Aún hay % avales sin created_by', null_count;
        END IF;
        IF policies_count != 4 THEN
            RAISE NOTICE '   ❌ Políticas RLS incompletas: %/4', policies_count;
        END IF;
        IF index_count = 0 THEN
            RAISE NOTICE '   ❌ Índice de performance faltante';
        END IF;
        IF NOT rls_enabled THEN
            RAISE NOTICE '   ❌ RLS no está habilitado';
        END IF;
    END IF;

    RAISE NOTICE '==================================================';
END $$;

-- LISTADO FINAL DE TODOS LOS AVALES CON SU ESTADO
SELECT
  g.id,
  g.first_name,
  g.paternal_last_name,
  g.rut,
  g.created_by,
  p.email as owner_email,
  CASE
    WHEN a.id IS NOT NULL THEN '📋 Aval de aplicación'
    WHEN g.created_by IS NOT NULL THEN '👤 Aval huérfano asignado'
    ELSE '❌ Error: sin asignar'
  END as type,
  CASE
    WHEN g.created_by IS NOT NULL THEN '✅ Funcional'
    ELSE '❌ RLS Error 403'
  END as rls_status
FROM guarantors g
LEFT JOIN applications a ON a.guarantor_id = g.id
LEFT JOIN profiles p ON p.id = g.created_by
ORDER BY
  CASE
    WHEN g.created_by IS NULL THEN 1
    ELSE 2
  END,
  g.created_at DESC;
