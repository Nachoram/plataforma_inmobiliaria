-- =====================================================
-- VERIFICAR TABLAS EXISTENTES EN LA BASE DE DATOS
-- =====================================================

-- Este script verifica qué tablas existen realmente en tu base de datos
-- para determinar cuáles necesitan la columna receiver_id

-- 1. Listar todas las tablas en el esquema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar si las tablas específicas existen
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as properties_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as applications_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as offers_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as guarantors_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as documents_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as property_images_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as user_favorites_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_owners' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as property_owners_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visit_requests' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as visit_requests_status;

-- 3. Verificar si las columnas receiver_id ya existen en las tablas
SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as receiver_id_status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
    AND c.column_name = 'receiver_id' 
    AND c.table_schema = 'public'
WHERE t.table_schema = 'public' 
AND t.table_name IN (
    'properties', 'applications', 'offers', 'guarantors', 
    'documents', 'property_images', 'user_favorites', 
    'property_owners', 'visit_requests'
)
ORDER BY t.table_name;

-- 4. Mostrar la estructura de las tablas principales
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('properties', 'applications', 'offers', 'guarantors', 'documents', 'property_images', 'user_favorites')
ORDER BY table_name, ordinal_position;
