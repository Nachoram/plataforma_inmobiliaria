-- =====================================================
-- DIAGNÓSTICO COMPLETO PARA FORMULARIO DE POSTULACIÓN DE ARRIENDO
-- =====================================================
-- Este script diagnóstica TODAS las tablas involucradas en el formulario

-- 1. LISTAR TODAS LAS TABLAS RELACIONADAS CON EL FORMULARIO
SELECT 'TABLAS INVOLUCRADAS EN EL FORMULARIO DE POSTULACIÓN:' as "INFO";

-- 2. VERIFICAR QUE TODAS LAS TABLAS EXISTEN
SELECT 
    'guarantors' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') 
         THEN '✓ EXISTE' 
         ELSE '✗ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'applications' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') 
         THEN '✓ EXISTE' 
         ELSE '✗ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'application_documents' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'application_documents' AND table_schema = 'public') 
         THEN '✓ EXISTE' 
         ELSE '✗ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'properties' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') 
         THEN '✓ EXISTE' 
         ELSE '✗ NO EXISTE' 
    END as estado
ORDER BY tabla;

-- 3. VERIFICAR EL ESTADO DE RLS EN TODAS LAS TABLAS CRÍTICAS
SELECT '--- ESTADO DE RLS EN TABLAS CRÍTICAS ---' as "INFO";
SELECT 
    c.relname as tabla,
    CASE 
        WHEN c.relrowsecurity = 't' THEN '✓ RLS HABILITADO'
        ELSE '✗ RLS DESHABILITADO'
    END as "Estado RLS"
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('guarantors', 'applications', 'application_documents', 'properties')
ORDER BY c.relname;

-- 4. LISTAR TODAS LAS POLÍTICAS PARA LAS TABLAS DEL FORMULARIO
SELECT '--- POLÍTICAS EXISTENTES ---' as "INFO";
SELECT 
    tablename as "Tabla",
    policyname as "Política",
    cmd as "Operación",
    permissive as "Tipo",
    roles as "Roles"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('guarantors', 'applications', 'application_documents', 'properties')
ORDER BY tablename, cmd, policyname;

-- 5. VERIFICAR ESPECÍFICAMENTE LAS POLÍTICAS INSERT
SELECT '--- POLÍTICAS INSERT (LAS MÁS CRÍTICAS) ---' as "INFO";
SELECT 
    tablename as "Tabla",
    policyname as "Política INSERT",
    roles as "Roles Permitidos",
    with_check as "Condición"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('guarantors', 'applications', 'application_documents')
  AND cmd = 'INSERT'
ORDER BY tablename;

-- 6. IDENTIFICAR TABLAS SIN POLÍTICA INSERT
SELECT '--- TABLAS QUE NECESITAN POLÍTICA INSERT ---' as "INFO";
SELECT 
    t.table_name as "Tabla Sin Política INSERT",
    '⚠️ NECESITA POLÍTICA INSERT' as "Acción Requerida"
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('guarantors', 'applications', 'application_documents')
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.schemaname = 'public' 
      AND p.tablename = t.table_name 
      AND p.cmd = 'INSERT'
  );

-- 7. VERIFICAR PERMISOS DE ROLES ESPECÍFICOS
SELECT '--- VERIFICACIÓN DE ROLES ---' as "INFO";
SELECT 
    'authenticated' as "Rol",
    CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') 
         THEN '✓ ROL EXISTE' 
         ELSE '✗ ROL NO EXISTE' 
    END as "Estado"
UNION ALL
SELECT 
    'anon' as "Rol",
    CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') 
         THEN '✓ ROL EXISTE' 
         ELSE '✗ ROL NO EXISTE' 
    END as "Estado";

-- =====================================================
-- INSTRUCCIONES BASADAS EN EL DIAGNÓSTICO:
-- =====================================================
-- 
-- Si ves tablas con "✗ RLS DESHABILITADO":
--   -> Necesitas habilitar RLS: ALTER TABLE tabla_name ENABLE ROW LEVEL SECURITY;
--
-- Si ves tablas en "TABLAS QUE NECESITAN POLÍTICA INSERT":
--   -> Necesitas crear políticas INSERT para esas tablas
--
-- Si ves "✗ ROL NO EXISTE":
--   -> Hay un problema con la configuración de Supabase
--
-- =====================================================
