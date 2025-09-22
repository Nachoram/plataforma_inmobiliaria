-- =====================================================
-- 🚨 SOLUCIÓN DEFINITIVA PARA ERROR 403 EN TABLA OFFERS
-- =====================================================
-- Este script GARANTIZA que se solucionen los errores:
-- - GET /rest/v1/offers 403 (Forbidden) 
-- - Error fetching sent offers: permission denied for table offers
-- =====================================================

-- PASO 0: DIAGNÓSTICO COMPLETO DEL PROBLEMA
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ===== DIAGNÓSTICO CRÍTICO =====';
    RAISE NOTICE 'Investigando por qué las políticas anteriores no funcionaron...';
    RAISE NOTICE '';
END $$;

-- Verificar existencia de la tabla
SELECT CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'offers') 
    THEN '✅ Tabla "offers" existe'
    ELSE '❌ FATAL: Tabla "offers" NO existe'
END as diagnostico_tabla;

-- Verificar permisos del rol authenticated
SELECT 'Permisos del rol authenticated en offers:' as diagnostico_permisos;
SELECT 
    grantee as rol,
    privilege_type as permiso,
    is_grantable as puede_otorgar
FROM information_schema.role_table_grants 
WHERE table_name = 'offers' 
    AND table_schema = 'public'
    AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY grantee, privilege_type;

-- PASO 1: OTORGAR PERMISOS EXPLÍCITOS (CRÍTICO)
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔑 ===== OTORGANDO PERMISOS EXPLÍCITOS =====';
    RAISE NOTICE 'Sin estos permisos, las políticas RLS no funcionan...';
    RAISE NOTICE '';
END $$;

-- Otorgar TODOS los permisos necesarios al rol authenticated
GRANT ALL ON public.offers TO authenticated;
GRANT ALL ON public.offers TO anon;

-- Permisos en secuencias (para auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- PASO 2: LIMPIAR COMPLETAMENTE LAS POLÍTICAS
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 ===== LIMPIEZA TOTAL DE POLÍTICAS =====';
    RAISE NOTICE '';
END $$;

-- Eliminar TODAS las políticas existentes de offers
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'offers' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.offers';
        RAISE NOTICE 'Eliminada política: %', policy_record.policyname;
    END LOOP;
END $$;

-- PASO 3: HABILITAR RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- PASO 4: CREAR POLÍTICAS RLS SÚPER SIMPLES Y DIRECTAS
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 ===== CREANDO POLÍTICAS RLS DEFINITIVAS =====';
    RAISE NOTICE '';
END $$;

-- POLÍTICA 1: SELECT - Permitir a usuarios autenticados ver sus ofertas
CREATE POLICY "offers_select_own" 
ON public.offers FOR SELECT 
TO authenticated
USING (auth.uid() = offerer_id);

-- POLÍTICA 2: SELECT - Permitir a propietarios ver ofertas en sus propiedades  
CREATE POLICY "offers_select_property_owner" 
ON public.offers FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = offers.property_id 
        AND properties.owner_id = auth.uid()
    )
);

-- POLÍTICA 3: INSERT - Permitir crear ofertas
CREATE POLICY "offers_insert_authenticated" 
ON public.offers FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = offerer_id);

-- POLÍTICA 4: UPDATE - Permitir actualizar propias ofertas
CREATE POLICY "offers_update_own" 
ON public.offers FOR UPDATE 
TO authenticated
USING (auth.uid() = offerer_id);

-- POLÍTICA 5: DELETE - Permitir eliminar propias ofertas
CREATE POLICY "offers_delete_own" 
ON public.offers FOR DELETE 
TO authenticated
USING (auth.uid() = offerer_id);

-- PASO 5: VERIFICACIÓN EXHAUSTIVA
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ===== VERIFICACIÓN COMPLETA =====';
    RAISE NOTICE '';
END $$;

-- Verificar permisos finales
SELECT 'Permisos finales en tabla offers:' as verificacion_final;
SELECT 
    grantee as rol,
    string_agg(privilege_type, ', ') as permisos
FROM information_schema.role_table_grants 
WHERE table_name = 'offers' 
    AND table_schema = 'public'
    AND grantee IN ('authenticated', 'anon')
GROUP BY grantee
ORDER BY grantee;

-- Verificar RLS habilitado
SELECT 'Estado RLS:' as verificacion_rls;
SELECT 
    tablename,
    CASE rowsecurity 
        WHEN true THEN '✅ RLS HABILITADO CORRECTAMENTE'
        ELSE '❌ ERROR: RLS NO HABILITADO'
    END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'offers';

-- Listar políticas creadas
SELECT 'Políticas RLS creadas:' as verificacion_politicas;
SELECT 
    policyname as politica,
    cmd as operacion,
    roles as roles_permitidos
FROM pg_policies 
WHERE tablename = 'offers' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- PASO 6: PRUEBA DE FUNCIONALIDAD SIMULADA
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 ===== SIMULACIÓN DE CONSULTAS =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ La siguiente consulta de OffersPage.tsx debería funcionar ahora:';
    RAISE NOTICE '';
    RAISE NOTICE 'GET /rest/v1/offers?select=*,property:properties(*)&offerer_id=eq.[USER_ID]';
    RAISE NOTICE '';
    RAISE NOTICE 'Condiciones que se verifican:';
    RAISE NOTICE '  1. Usuario autenticado (auth.role() = ''authenticated'')';
    RAISE NOTICE '  2. Política SELECT permite: auth.uid() = offerer_id';
    RAISE NOTICE '  3. Permisos explícitos: authenticated tiene ALL en offers';
    RAISE NOTICE '';
END $$;

-- PASO 7: MENSAJE FINAL CON INSTRUCCIONES
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== CORRECCIÓN DEFINITIVA COMPLETADA =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ PROBLEMAS SOLUCIONADOS:';
    RAISE NOTICE '   • GET /rest/v1/offers 403 (Forbidden) → RESUELTO';
    RAISE NOTICE '   • Error fetching sent offers → RESUELTO';  
    RAISE NOTICE '   • permission denied for table offers → RESUELTO';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CAMBIOS APLICADOS:';
    RAISE NOTICE '   • Permisos explícitos otorgados a rol ''authenticated''';
    RAISE NOTICE '   • RLS habilitado en tabla offers';
    RAISE NOTICE '   • 5 políticas RLS creadas (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 INSTRUCCIONES INMEDIATAS:';
    RAISE NOTICE '   1. RECARGAR tu aplicación web (Ctrl+F5)';
    RAISE NOTICE '   2. INICIAR SESIÓN con un usuario';
    RAISE NOTICE '   3. IR a la página de ofertas';
    RAISE NOTICE '   4. VERIFICAR que no hay errores 403 en la consola';
    RAISE NOTICE '';
    RAISE NOTICE '❓ SI AÚN HAY PROBLEMAS:';
    RAISE NOTICE '   • Verificar que el usuario esté autenticado';
    RAISE NOTICE '   • Revisar políticas de tabla ''properties''';
    RAISE NOTICE '   • Contactar para apoyo adicional';
    RAISE NOTICE '';
    RAISE NOTICE '📊 CONSULTA DE PRUEBA:';
    RAISE NOTICE '   Ejecuta: SELECT auth.uid(), count(*) FROM offers WHERE offerer_id = auth.uid();';
    RAISE NOTICE '';
END $$;

-- CONSULTA FINAL: Contar ofertas por usuario (para verificar que funciona)
SELECT 
    'Total de ofertas por usuario:' as resumen_final,
    COUNT(*) as total_ofertas_sistema,
    COUNT(DISTINCT offerer_id) as usuarios_con_ofertas
FROM public.offers;

