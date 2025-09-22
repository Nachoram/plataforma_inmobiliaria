-- =====================================================
-- PASO 3: POLÍTICAS RLS PROACTIVAS PARA 'applications' Y 'documents'
-- Prevenir futuros errores 403/406
-- =====================================================

-- AUDITAR ESTRUCTURA DE TABLAS PARA RLS
SELECT '=== ESTRUCTURA TABLA APPLICATIONS ===' as apps_structure;
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name LIKE '%applicant%' OR column_name LIKE '%user%' THEN '👤 Usuario aplicante'
        WHEN column_name LIKE '%property%' THEN '🏠 Propiedad relacionada'
        WHEN column_name LIKE '%id' AND column_name != 'id' THEN '🔑 Clave foránea'
        ELSE '📝 Dato'
    END as relevancia_rls
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'applications'
ORDER BY ordinal_position;

SELECT '=== ESTRUCTURA TABLA DOCUMENTS ===' as docs_structure;
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name LIKE '%uploader%' OR column_name LIKE '%user%' OR column_name LIKE '%owner%' THEN '👤 Usuario propietario'
        WHEN column_name LIKE '%entity%' THEN '🔗 Entidad relacionada'
        WHEN column_name LIKE '%id' AND column_name != 'id' THEN '🔑 Clave foránea'
        ELSE '📝 Dato'
    END as relevancia_rls
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'documents'
ORDER BY ordinal_position;

-- =====================================================
-- IMPLEMENTACIÓN RLS PARA TABLA 'applications'
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "applications_select_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_update_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_policy" ON public.applications;
DROP POLICY IF EXISTS "Users can view their own applications or apps on their properties" ON public.applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;

-- SELECT: Usuario ve sus aplicaciones O aplicaciones en sus propiedades
CREATE POLICY "Users can view their own applications or apps on their properties"
ON public.applications FOR SELECT
USING (
  -- El usuario puede ver aplicaciones que él hizo
  auth.uid() = applicant_id OR
  -- El dueño de la propiedad puede ver aplicaciones en su propiedad
  (SELECT owner_id FROM public.properties WHERE id = applications.property_id) = auth.uid()
);

-- INSERT: Usuario puede crear aplicaciones para sí mismo
CREATE POLICY "Users can create their own applications"
ON public.applications FOR INSERT
WITH CHECK ( 
  auth.role() = 'authenticated' AND 
  auth.uid() = applicant_id 
);

-- UPDATE: Usuario puede actualizar sus propias aplicaciones
CREATE POLICY "Users can update their own applications"
ON public.applications FOR UPDATE
USING ( 
  auth.role() = 'authenticated' AND 
  auth.uid() = applicant_id 
);

-- DELETE: Usuario puede eliminar sus propias aplicaciones
CREATE POLICY "Users can delete their own applications"
ON public.applications FOR DELETE
USING ( 
  auth.role() = 'authenticated' AND 
  auth.uid() = applicant_id 
);

-- =====================================================
-- IMPLEMENTACIÓN RLS PARA TABLA 'documents'
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON public.documents;
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;

-- Política ALL: Usuario puede gestionar completamente sus propios documentos
CREATE POLICY "Users can manage their own documents"
ON public.documents FOR ALL
USING ( 
  auth.role() = 'authenticated' AND 
  auth.uid() = uploader_id 
);

-- =====================================================
-- VERIFICACIONES
-- =====================================================

-- Verificar políticas de applications
SELECT '=== POLÍTICAS CREADAS PARA APPLICATIONS ===' as apps_verification;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 Ver aplicaciones propias + en propiedades propias'
        WHEN cmd = 'INSERT' THEN '➕ Crear aplicaciones para uno mismo'
        WHEN cmd = 'UPDATE' THEN '✏️  Actualizar aplicaciones propias'
        WHEN cmd = 'DELETE' THEN '🗑️  Eliminar aplicaciones propias'
    END as descripcion
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY cmd, policyname;

-- Verificar políticas de documents
SELECT '=== POLÍTICAS CREADAS PARA DOCUMENTS ===' as docs_verification;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'ALL' THEN '🔧 Gestión completa de documentos propios'
        WHEN cmd = 'SELECT' THEN '🔍 Ver documentos propios'
        WHEN cmd = 'INSERT' THEN '➕ Subir documentos propios'
        WHEN cmd = 'UPDATE' THEN '✏️  Actualizar documentos propios'
        WHEN cmd = 'DELETE' THEN '🗑️  Eliminar documentos propios'
    END as descripcion
FROM pg_policies 
WHERE tablename = 'documents'
ORDER BY cmd, policyname;

-- Estado RLS de ambas tablas
SELECT '=== ESTADO RLS DE TABLAS CRÍTICAS ===' as rls_summary;
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ PROTEGIDA'
        ELSE '❌ VULNERABLE'
    END as estado_rls,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as num_policies
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('applications', 'documents', 'offers', 'properties', 'profiles')
ORDER BY tablename;

-- MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🛡️  IMPLEMENTACIÓN RLS PROACTIVA COMPLETADA';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tablas aseguradas:';
    RAISE NOTICE '   📋 applications - Aplicaciones de arriendo';
    RAISE NOTICE '   📄 documents - Documentos de usuario';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Políticas de seguridad:';
    RAISE NOTICE '   - Usuarios solo ven sus propios datos';
    RAISE NOTICE '   - Propietarios ven aplicaciones en sus propiedades';
    RAISE NOTICE '   - Documentos completamente privados por usuario';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Beneficios:';
    RAISE NOTICE '   - Previene futuros errores 403/406';
    RAISE NOTICE '   - Seguridad por capas implementada';
    RAISE NOTICE '   - Privacidad de datos garantizada';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximo paso:';
    RAISE NOTICE '   Ejecutar verificación final integral';
    RAISE NOTICE '';
END $$;
