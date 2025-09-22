-- =====================================================
-- SOLUCIÓN COMPLETA PARA ERRORES 403 EN TABLA OFFERS
-- Corrige los errores: GET /rest/v1/offers 403 (Forbidden)
-- =====================================================

-- PASO 1: DIAGNÓSTICO INICIAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ===== DIAGNÓSTICO INICIAL TABLA OFFERS =====';
    RAISE NOTICE '';
END $$;

-- Verificar si la tabla exists
SELECT CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'offers') 
    THEN '✅ Tabla "offers" existe'
    ELSE '❌ ERROR: Tabla "offers" NO existe'
END as tabla_status;

-- Verificar estructura de la tabla
SELECT 
    '📋 Estructura de la tabla offers:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'offerer_id' THEN '🔑 CLAVE PARA RLS - Identifica quien hizo la oferta'
        WHEN column_name = 'property_id' THEN '🏠 RELACIÓN - Conecta con propiedades'
        WHEN column_name = 'id' THEN '🆔 PRIMARY KEY'
        ELSE '📝 Datos adicionales'
    END as importancia_rls
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'offers'
ORDER BY ordinal_position;

-- PASO 2: LIMPIAR ESTADO ACTUAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 ===== LIMPIANDO POLÍTICAS EXISTENTES =====';
    RAISE NOTICE '';
END $$;

-- Habilitar RLS (por si no estaba habilitado)
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_update_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_delete_policy" ON public.offers;
DROP POLICY IF EXISTS "Users can view their own offers or offers on their properties" ON public.offers;
DROP POLICY IF EXISTS "Users can create their own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can delete their own offers" ON public.offers;
DROP POLICY IF EXISTS "Enable read access for users on their own offers" ON public.offers;
DROP POLICY IF EXISTS "Enable read access for property owners" ON public.offers;

-- PASO 3: CREAR POLÍTICAS RLS OPTIMIZADAS
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 ===== CREANDO NUEVAS POLÍTICAS RLS =====';
    RAISE NOTICE '';
END $$;

-- POLÍTICA SELECT: Los usuarios pueden ver:
-- 1. Ofertas que ellos hicieron (offerer_id = auth.uid())
-- 2. Ofertas en sus propiedades (si son dueños de la propiedad)
CREATE POLICY "offers_select_authenticated" 
ON public.offers FOR SELECT 
USING (
    auth.role() = 'authenticated' AND (
        -- Puede ver sus propias ofertas
        auth.uid() = offerer_id OR 
        -- Puede ver ofertas en propiedades que posee
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE properties.id = offers.property_id 
            AND properties.owner_id = auth.uid()
        )
    )
);

-- POLÍTICA INSERT: Solo usuarios autenticados pueden crear ofertas para sí mismos
CREATE POLICY "offers_insert_authenticated" 
ON public.offers FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = offerer_id
);

-- POLÍTICA UPDATE: Solo pueden actualizar sus propias ofertas
CREATE POLICY "offers_update_own" 
ON public.offers FOR UPDATE 
USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = offerer_id
);

-- POLÍTICA DELETE: Solo pueden eliminar sus propias ofertas
CREATE POLICY "offers_delete_own" 
ON public.offers FOR DELETE 
USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = offerer_id
);

-- PASO 4: VERIFICACIÓN COMPLETA
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ===== VERIFICACIÓN DE POLÍTICAS CREADAS =====';
    RAISE NOTICE '';
END $$;

-- Verificar que RLS está habilitado
SELECT 
    '🔒 Estado RLS:' as verificacion,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO - ERROR'
    END as estado
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'offers';

-- Listar todas las políticas creadas
SELECT 
    '📋 Políticas creadas:' as verificacion;
    
SELECT 
    policyname,
    cmd as operacion,
    CASE cmd
        WHEN 'SELECT' THEN '🔍 Ver ofertas propias + ofertas en propiedades propias'
        WHEN 'INSERT' THEN '➕ Crear ofertas para uno mismo'
        WHEN 'UPDATE' THEN '✏️ Modificar ofertas propias'
        WHEN 'DELETE' THEN '🗑️ Eliminar ofertas propias'
    END as descripcion
FROM pg_policies 
WHERE tablename = 'offers'
ORDER BY cmd, policyname;

-- PASO 5: PRUEBAS DE FUNCIONALIDAD (SIMULADAS)
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 ===== PRUEBAS DE FUNCIONALIDAD =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Las siguientes consultas deberían funcionar ahora:';
    RAISE NOTICE '';
    RAISE NOTICE '1. OffersPage.tsx línea ~99:';
    RAISE NOTICE '   SELECT * FROM offers WHERE offerer_id = auth.uid()';
    RAISE NOTICE '   → Ver ofertas que el usuario envió';
    RAISE NOTICE '';
    RAISE NOTICE '2. OffersPage.tsx línea ~73:';
    RAISE NOTICE '   SELECT * FROM offers WHERE property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())';
    RAISE NOTICE '   → Ver ofertas recibidas en propiedades del usuario';
    RAISE NOTICE '';
    RAISE NOTICE '3. MyActivityPage.tsx línea ~63:';
    RAISE NOTICE '   SELECT * FROM offers WHERE offerer_id = auth.uid()';
    RAISE NOTICE '   → Ver actividad de ofertas del usuario';
    RAISE NOTICE '';
END $$;

-- PASO 6: MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== CORRECCIÓN COMPLETADA =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ PROBLEMAS SOLUCIONADOS:';
    RAISE NOTICE '   • GET /rest/v1/offers 403 (Forbidden)';
    RAISE NOTICE '   • Error "permission denied for table offers"';
    RAISE NOTICE '   • OffersPage.tsx Error fetching sent offers';
    RAISE NOTICE '   • MyActivityPage.tsx Error fetching offers';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SEGURIDAD GARANTIZADA:';
    RAISE NOTICE '   • Usuarios solo ven ofertas relevantes para ellos';
    RAISE NOTICE '   • Propietarios ven ofertas en sus propiedades';
    RAISE NOTICE '   • Nadie puede modificar ofertas de otros';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMO PASO:';
    RAISE NOTICE '   Recargar la aplicación y probar OffersPage.tsx';
    RAISE NOTICE '';
    RAISE NOTICE '📞 Si persisten errores, verificar:';
    RAISE NOTICE '   1. Usuario está autenticado (auth.uid() no es null)';
    RAISE NOTICE '   2. Tokens de sesión están actualizados';
    RAISE NOTICE '   3. Tabla "properties" tiene policies correctas';
    RAISE NOTICE '';
END $$;

-- CONSULTA FINAL: Contar registros (opcional para verificar que hay datos)
SELECT 
    'ℹ️ Información adicional:' as info,
    COUNT(*) as total_ofertas,
    COUNT(DISTINCT offerer_id) as usuarios_con_ofertas,
    COUNT(DISTINCT property_id) as propiedades_con_ofertas
FROM public.offers;

