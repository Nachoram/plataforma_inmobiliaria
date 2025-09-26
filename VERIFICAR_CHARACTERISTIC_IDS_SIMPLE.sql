-- =====================================================
-- VERIFICACIÓN SIMPLE DE IDs CARACTERÍSTICOS PARA WEBHOOKS
-- =====================================================

-- Este script verifica que los IDs característicos se generaron correctamente
-- para facilitar las búsquedas automáticas en webhooks.

-- 1. Verificar que las columnas characteristic_id existen en todas las tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%characteristic_id'
ORDER BY table_name;

-- 2. Verificar que los índices se crearon correctamente
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%characteristic_id%'
ORDER BY tablename;

-- 3. Verificar que los triggers se crearon correctamente
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%characteristic_id%'
ORDER BY event_object_table;

-- 4. Verificar que la función de generación existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_characteristic_id';

-- 5. Verificar comentarios en las columnas
SELECT 
    c.table_name,
    c.column_name,
    col_description(pgc.oid, pga.attnum) as comment
FROM information_schema.columns c
JOIN pg_class pgc ON pgc.relname = c.table_name
JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace
JOIN pg_attribute pga ON pga.attrelid = pgc.oid AND pga.attname = c.column_name
WHERE c.table_schema = 'public' 
AND c.column_name LIKE '%characteristic_id'
AND pgn.nspname = 'public'
ORDER BY c.table_name;

-- 6. Verificar datos por tabla individual (solo si las columnas existen)
-- Properties
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'property_characteristic_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Verificando properties...';
    PERFORM 1 FROM properties WHERE property_characteristic_id IS NOT NULL LIMIT 1;
  ELSE
    RAISE NOTICE 'Columna property_characteristic_id no existe en properties';
  END IF;
END $$;

-- Applications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'application_characteristic_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Verificando applications...';
    PERFORM 1 FROM applications WHERE application_characteristic_id IS NOT NULL LIMIT 1;
  ELSE
    RAISE NOTICE 'Columna application_characteristic_id no existe en applications';
  END IF;
END $$;

-- Offers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'offers' 
    AND column_name = 'offer_characteristic_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Verificando offers...';
    PERFORM 1 FROM offers WHERE offer_characteristic_id IS NOT NULL LIMIT 1;
  ELSE
    RAISE NOTICE 'Columna offer_characteristic_id no existe en offers';
  END IF;
END $$;

-- Guarantors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guarantors' 
    AND column_name = 'guarantor_characteristic_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Verificando guarantors...';
    PERFORM 1 FROM guarantors WHERE guarantor_characteristic_id IS NOT NULL LIMIT 1;
  ELSE
    RAISE NOTICE 'Columna guarantor_characteristic_id no existe en guarantors';
  END IF;
END $$;

-- Documents
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'document_characteristic_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Verificando documents...';
    PERFORM 1 FROM documents WHERE document_characteristic_id IS NOT NULL LIMIT 1;
  ELSE
    RAISE NOTICE 'Columna document_characteristic_id no existe en documents';
  END IF;
END $$;

-- Property Images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'property_images' 
    AND column_name = 'image_characteristic_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Verificando property_images...';
    PERFORM 1 FROM property_images WHERE image_characteristic_id IS NOT NULL LIMIT 1;
  ELSE
    RAISE NOTICE 'Columna image_characteristic_id no existe en property_images';
  END IF;
END $$;

-- User Favorites
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' 
    AND column_name = 'favorite_characteristic_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Verificando user_favorites...';
    PERFORM 1 FROM user_favorites WHERE favorite_characteristic_id IS NOT NULL LIMIT 1;
  ELSE
    RAISE NOTICE 'Columna favorite_characteristic_id no existe en user_favorites';
  END IF;
END $$;
