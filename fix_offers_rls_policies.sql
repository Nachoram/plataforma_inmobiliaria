-- =====================================================
-- PASO 2: IMPLEMENTAR POLÍTICAS RLS PARA TABLA 'offers'
-- Solución directa para errores 403 Forbidden
-- =====================================================

-- VERIFICAR ESTRUCTURA DE LA TABLA OFFERS
SELECT '=== ESTRUCTURA DE LA TABLA OFFERS ===' as structure_check;
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name LIKE '%id' THEN '🔑 Clave (probablemente para RLS)'
        WHEN column_name LIKE '%user%' OR column_name LIKE '%owner%' OR column_name LIKE '%offerer%' THEN '👤 Usuario (usar para RLS)'
        WHEN column_name LIKE '%property%' THEN '🏠 Propiedad (relación)'
        ELSE '📝 Dato'
    END as relevancia_rls
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'offers'
ORDER BY ordinal_position;

-- HABILITAR RLS EN LA TABLA OFFERS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- LIMPIAR POLÍTICAS EXISTENTES (SI HUBIERA ALGUNA)
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_update_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_delete_policy" ON public.offers;
DROP POLICY IF EXISTS "Users can view their own offers or offers on their properties" ON public.offers;
DROP POLICY IF EXISTS "Users can create their own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can delete their own offers" ON public.offers;

-- POLÍTICA SELECT: Usuario puede ver ofertas que hizo O ofertas en sus propiedades
CREATE POLICY "Users can view their own offers or offers on their properties"
ON public.offers FOR SELECT
USING (
  -- El usuario puede ver ofertas que él hizo
  auth.uid() = offerer_id OR
  -- El dueño de la propiedad puede ver ofertas en su propiedad
  (SELECT owner_id FROM public.properties WHERE id = offers.property_id) = auth.uid()
);

-- POLÍTICA INSERT: Usuario autenticado puede crear ofertas para sí mismo
CREATE POLICY "Users can create their own offers"
ON public.offers FOR INSERT
WITH CHECK ( 
  auth.role() = 'authenticated' AND 
  auth.uid() = offerer_id 
);

-- POLÍTICA UPDATE: Usuario solo puede actualizar sus propias ofertas
CREATE POLICY "Users can update their own offers"
ON public.offers FOR UPDATE
USING ( 
  auth.role() = 'authenticated' AND 
  auth.uid() = offerer_id 
);

-- POLÍTICA DELETE: Usuario solo puede eliminar sus propias ofertas
CREATE POLICY "Users can delete their own offers"
ON public.offers FOR DELETE
USING ( 
  auth.role() = 'authenticated' AND 
  auth.uid() = offerer_id 
);

-- VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT '=== POLÍTICAS CREADAS PARA OFFERS ===' as verification;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 Permite ver ofertas propias y en propiedades propias'
        WHEN cmd = 'INSERT' THEN '➕ Permite crear ofertas para uno mismo'
        WHEN cmd = 'UPDATE' THEN '✏️  Permite actualizar ofertas propias'
        WHEN cmd = 'DELETE' THEN '🗑️  Permite eliminar ofertas propias'
    END as descripcion
FROM pg_policies 
WHERE tablename = 'offers'
ORDER BY cmd, policyname;

-- VERIFICAR ESTADO RLS
SELECT '=== ESTADO RLS OFFERS ===' as rls_status;
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'offers';

-- MENSAJE DE CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 POLÍTICAS RLS PARA TABLA "offers" IMPLEMENTADAS EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Políticas creadas:';
    RAISE NOTICE '   🔍 SELECT: Ver ofertas propias + ofertas en propiedades propias';
    RAISE NOTICE '   ➕ INSERT: Crear ofertas para uno mismo';
    RAISE NOTICE '   ✏️  UPDATE: Actualizar ofertas propias';
    RAISE NOTICE '   🗑️  DELETE: Eliminar ofertas propias';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Seguridad garantizada:';
    RAISE NOTICE '   - Los usuarios solo ven ofertas relevantes para ellos';
    RAISE NOTICE '   - Los propietarios pueden ver ofertas en sus propiedades';
    RAISE NOTICE '   - Nadie puede modificar ofertas ajenas';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Los errores 403 Forbidden en OffersPage.tsx deberían estar resueltos';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximo paso:';
    RAISE NOTICE '   Implementar políticas para "applications" y "documents"';
    RAISE NOTICE '';
END $$;
