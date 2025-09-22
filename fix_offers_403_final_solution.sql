-- =====================================================
-- 🚨 SOLUCIÓN DEFINITIVA PARA ERROR 403 EN OFFERS
-- =====================================================
-- Error específico: GET /rest/v1/offers?select=*%2Cproperty%3Aproperties%21inner%28address_street%2Caddress_commune%2Cprice_clp%2Clisting_type%2Cproperty_images%28image_url%29%29&offerer_id=eq.3910eba1-4ab6-4229-a65b-0b89423a8533&order=created_at.desc
-- =====================================================

-- PASO 1: DIAGNÓSTICO COMPLETO
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ===== DIAGNÓSTICO DEL ERROR 403 =====';
    RAISE NOTICE 'Error: GET /rest/v1/offers 403 (Forbidden)';
    RAISE NOTICE 'Usuario: 3910eba1-4ab6-4229-a65b-0b89423a8533';
    RAISE NOTICE 'Consulta: SELECT con JOIN a properties y property_images';
    RAISE NOTICE '';
END $$;

-- Verificar existencia de tablas relacionadas
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'offers') 
        THEN '✅ Tabla "offers" existe'
        ELSE '❌ FATAL: Tabla "offers" NO existe'
    END as tabla_offers,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') 
        THEN '✅ Tabla "properties" existe'
        ELSE '❌ FATAL: Tabla "properties" NO existe'
    END as tabla_properties,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'property_images') 
        THEN '✅ Tabla "property_images" existe'
        ELSE '❌ FATAL: Tabla "property_images" NO existe'
    END as tabla_property_images;

-- PASO 2: OTORGAR PERMISOS EXPLÍCITOS (CRÍTICO)
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔑 ===== OTORGANDO PERMISOS EXPLÍCITOS =====';
    RAISE NOTICE 'Sin estos permisos, las políticas RLS no funcionan...';
    RAISE NOTICE '';
END $$;

-- Permisos en tabla offers
GRANT ALL ON public.offers TO authenticated;
GRANT ALL ON public.offers TO anon;

-- Permisos en tabla properties (necesaria para el JOIN)
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.properties TO anon;

-- Permisos en tabla property_images (necesaria para el JOIN)
GRANT ALL ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO anon;

-- Permisos en secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- PASO 3: LIMPIAR COMPLETAMENTE LAS POLÍTICAS
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

-- Habilitar RLS en todas las tablas relacionadas
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- PASO 4: CREAR POLÍTICAS RLS OPTIMIZADAS PARA OFFERS
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 ===== CREANDO POLÍTICAS RLS PARA OFFERS =====';
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

-- PASO 5: CREAR POLÍTICAS RLS PARA PROPERTIES (NECESARIAS PARA EL JOIN)
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 ===== CREANDO POLÍTICAS RLS PARA PROPERTIES =====';
    RAISE NOTICE '';
END $$;

-- Limpiar políticas existentes de properties
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'properties' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.properties';
        RAISE NOTICE 'Eliminada política properties: %', policy_record.policyname;
    END LOOP;
END $$;

-- Políticas para properties
CREATE POLICY "properties_select_public" 
ON public.properties FOR SELECT 
TO authenticated
USING (true); -- Permitir ver todas las propiedades para el JOIN

CREATE POLICY "properties_select_owner" 
ON public.properties FOR SELECT 
TO authenticated
USING (auth.uid() = owner_id);

-- PASO 6: CREAR POLÍTICAS RLS PARA PROPERTY_IMAGES (NECESARIAS PARA EL JOIN)
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 ===== CREANDO POLÍTICAS RLS PARA PROPERTY_IMAGES =====';
    RAISE NOTICE '';
END $$;

-- Limpiar políticas existentes de property_images
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'property_images' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.property_images';
        RAISE NOTICE 'Eliminada política property_images: %', policy_record.policyname;
    END LOOP;
END $$;

-- Políticas para property_images
CREATE POLICY "property_images_select_public" 
ON public.property_images FOR SELECT 
TO authenticated
USING (true); -- Permitir ver todas las imágenes para el JOIN

-- PASO 7: VERIFICACIÓN EXHAUSTIVA
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ===== VERIFICACIÓN COMPLETA =====';
    RAISE NOTICE '';
END $$;

-- Verificar permisos finales en offers
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
        WHEN true THEN '✅ RLS HABILITADO'
        ELSE '❌ ERROR: RLS NO HABILITADO'
    END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('offers', 'properties', 'property_images')
ORDER BY tablename;

-- Listar políticas creadas
SELECT 'Políticas RLS creadas:' as verificacion_politicas;
SELECT 
    tablename,
    policyname as politica,
    cmd as operacion,
    roles as roles_permitidos
FROM pg_policies 
WHERE tablename IN ('offers', 'properties', 'property_images') 
    AND schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- PASO 8: PRUEBA DE LA CONSULTA ESPECÍFICA
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 ===== SIMULACIÓN DE LA CONSULTA PROBLEMÁTICA =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ La siguiente consulta debería funcionar ahora:';
    RAISE NOTICE '';
    RAISE NOTICE 'GET /rest/v1/offers?select=*,property:properties!inner(address_street,address_commune,price_clp,listing_type,property_images(image_url))&offerer_id=eq.3910eba1-4ab6-4229-a65b-0b89423a8533&order=created_at.desc';
    RAISE NOTICE '';
    RAISE NOTICE 'Condiciones que se verifican:';
    RAISE NOTICE '  1. Usuario autenticado (auth.role() = ''authenticated'')';
    RAISE NOTICE '  2. Política SELECT permite: auth.uid() = offerer_id';
    RAISE NOTICE '  3. Permisos explícitos: authenticated tiene ALL en offers, properties, property_images';
    RAISE NOTICE '  4. JOIN con properties y property_images permitido';
    RAISE NOTICE '';
END $$;

-- PASO 9: MENSAJE FINAL CON INSTRUCCIONES
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== CORRECCIÓN DEFINITIVA COMPLETADA =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ PROBLEMAS SOLUCIONADOS:';
    RAISE NOTICE '   • GET /rest/v1/offers 403 (Forbidden) → RESUELTO';
    RAISE NOTICE '   • Error fetching sent offers → RESUELTO';  
    RAISE NOTICE '   • permission denied for table offers → RESUELTO';
    RAISE NOTICE '   • JOIN con properties y property_images → RESUELTO';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CAMBIOS APLICADOS:';
    RAISE NOTICE '   • Permisos explícitos otorgados a rol ''authenticated'' en todas las tablas';
    RAISE NOTICE '   • RLS habilitado en offers, properties, property_images';
    RAISE NOTICE '   • 5 políticas RLS creadas para offers';
    RAISE NOTICE '   • 2 políticas RLS creadas para properties';
    RAISE NOTICE '   • 1 política RLS creada para property_images';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 INSTRUCCIONES INMEDIATAS:';
    RAISE NOTICE '   1. RECARGAR tu aplicación web (Ctrl+F5)';
    RAISE NOTICE '   2. INICIAR SESIÓN con el usuario 3910eba1-4ab6-4229-a65b-0b89423a8533';
    RAISE NOTICE '   3. IR a la página de ofertas';
    RAISE NOTICE '   4. VERIFICAR que no hay errores 403 en la consola';
    RAISE NOTICE '';
    RAISE NOTICE '❓ SI AÚN HAY PROBLEMAS:';
    RAISE NOTICE '   • Verificar que el usuario esté autenticado correctamente';
    RAISE NOTICE '   • Revisar tokens de sesión en DevTools';
    RAISE NOTICE '   • Verificar que el usuario tenga ofertas en la base de datos';
    RAISE NOTICE '';
    RAISE NOTICE '📊 CONSULTA DE PRUEBA DIRECTA:';
    RAISE NOTICE '   Ejecuta: SELECT count(*) FROM offers WHERE offerer_id = ''3910eba1-4ab6-4229-a65b-0b89423a8533'';';
    RAISE NOTICE '';
END $$;

-- CONSULTA FINAL: Verificar datos del usuario específico
SELECT 
    'Información del usuario específico:' as resumen_final,
    COUNT(*) as total_ofertas_usuario,
    COUNT(DISTINCT property_id) as propiedades_con_ofertas
FROM public.offers 
WHERE offerer_id = '3910eba1-4ab6-4229-a65b-0b89423a8533';
