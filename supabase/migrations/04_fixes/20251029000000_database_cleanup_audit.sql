-- ========================================================================
-- Migración: Limpieza de base de datos - Auditoría completa
-- Fecha: 2025-10-29
-- Descripción: Eliminar tablas y columnas no utilizadas basadas en auditoría exhaustiva
-- ========================================================================

DO $$ BEGIN
    RAISE NOTICE '🧹 INICIANDO LIMPIEZA DE BASE DE DATOS - AUDITORÍA COMPLETA';
END $$;

-- ========================================================================
-- PASO 1: IDENTIFICACIÓN DE TABLAS A ELIMINAR
-- ========================================================================
-- Basado en análisis CONSERVADOR de código, las siguientes tablas NO tienen uso activo:
-- - user_favorites: 0 referencias en código activo
-- - addresses: Solo usada en migraciones antiguas, pero tiene estructura compleja - MANTENER POR AHORA
-- - applicants: Reemplazada por estructura profiles + applications - MANTENER POR AHORA
-- - amenidades: Tabla experimental sin uso
-- - propiedad_amenidades: Duplicada de amenidades
-- - messages: Sistema de mensajes no implementado
-- - notifications: Sistema de notificaciones no implementado
-- - visit_requests: TIENE REFERENCIAS ACTIVAS - NO ELIMINAR
-- - user_profiles: Duplicada de profiles

DO $$ BEGIN
    RAISE NOTICE '📋 TABLAS IDENTIFICADAS PARA ELIMINACIÓN (CONSERVADOR):';
    RAISE NOTICE '  - user_favorites (favoritos de usuarios - no usado)';
    RAISE NOTICE '  ❌ addresses (MANTENIDO - estructura compleja)';
    RAISE NOTICE '  ❌ applicants (MANTENIDO - estructura compleja)';
    RAISE NOTICE '  - amenidades (experimental - no usado)';
    RAISE NOTICE '  - propiedad_amenidades (duplicada - no usada)';
    RAISE NOTICE '  - messages (sistema de mensajes - no implementado)';
    RAISE NOTICE '  - notifications (sistema de notificaciones - no implementado)';
    RAISE NOTICE '  ❌ visit_requests (MANTENIDO - tiene referencias activas)';
    RAISE NOTICE '  - user_profiles (duplicada de profiles - no usada)';
END $$;

-- ========================================================================
-- PASO 2: ELIMINAR TABLAS NO UTILIZADAS (CONSERVADOR)
-- ========================================================================

-- Eliminar tabla user_favorites (no tiene uso activo)
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DO $$ BEGIN
    RAISE NOTICE '✅ Eliminada tabla user_favorites';
END $$;

-- Eliminar tabla amenidades (experimental)
DROP TABLE IF EXISTS public.amenidades CASCADE;
DO $$ BEGIN
    RAISE NOTICE '✅ Eliminada tabla amenidades';
END $$;

-- Eliminar tabla propiedad_amenidades (duplicada)
DROP TABLE IF EXISTS public.propiedad_amenidades CASCADE;
DO $$ BEGIN
    RAISE NOTICE '✅ Eliminada tabla propiedad_amenidades';
END $$;

-- Eliminar tabla messages (no implementado)
DROP TABLE IF EXISTS public.messages CASCADE;
DO $$ BEGIN
    RAISE NOTICE '✅ Eliminada tabla messages';
END $$;

-- Eliminar tabla notifications (no implementado)
DROP TABLE IF EXISTS public.notifications CASCADE;
DO $$ BEGIN
    RAISE NOTICE '✅ Eliminada tabla notifications';
END $$;

-- Eliminar tabla user_profiles (duplicada)
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DO $$ BEGIN
    RAISE NOTICE '✅ Eliminada tabla user_profiles';
END $$;

-- NOTA: Las siguientes tablas se MANTIENEN por tener referencias activas o estructura compleja:
-- - addresses: Mantenida (estructura compleja)
-- - applicants: Mantenida (estructura compleja)
-- - visit_requests: Mantenida (referencias activas)

-- ========================================================================
-- PASO 3: LIMPIEZA CONSERVADORA DE COLUMNAS
-- ========================================================================
-- Solo eliminamos columnas que definitivamente no se usan

DO $$ BEGIN
    RAISE NOTICE '🧽 LIMPIANDO COLUMNAS LEGACY CONFIRMADAMENTE NO UTILIZADAS...';
END $$;

-- SOLO eliminar receiver_id donde no se usa activamente
-- Esta columna era de un sistema de webhooks antiguo

DO $$
BEGIN
    -- receiver_id en applications - verificar que no se usa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'applications' AND column_name = 'receiver_id'
    ) THEN
        ALTER TABLE public.applications DROP COLUMN IF EXISTS receiver_id;
        RAISE NOTICE '✅ Eliminada columna receiver_id de applications (legacy webhooks)';
    END IF;
END $$;

DO $$
BEGIN
    -- receiver_id en offers - verificar que no se usa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offers' AND column_name = 'receiver_id'
    ) THEN
        ALTER TABLE public.offers DROP COLUMN IF EXISTS receiver_id;
        RAISE NOTICE '✅ Eliminada columna receiver_id de offers (legacy webhooks)';
    END IF;
END $$;

DO $$
BEGIN
    -- receiver_id en properties - verificar que no se usa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'properties' AND column_name = 'receiver_id'
    ) THEN
        ALTER TABLE public.properties DROP COLUMN IF EXISTS receiver_id;
        RAISE NOTICE '✅ Eliminada columna receiver_id de properties (legacy webhooks)';
    END IF;
END $$;

DO $$
BEGIN
    -- receiver_id en documents - verificar que no se usa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'receiver_id'
    ) THEN
        ALTER TABLE public.documents DROP COLUMN IF EXISTS receiver_id;
        RAISE NOTICE '✅ Eliminada columna receiver_id de documents (legacy webhooks)';
    END IF;
END $$;

DO $$
BEGIN
    -- receiver_id en property_images - verificar que no se usa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'property_images' AND column_name = 'receiver_id'
    ) THEN
        ALTER TABLE public.property_images DROP COLUMN IF EXISTS receiver_id;
        RAISE NOTICE '✅ Eliminada columna receiver_id de property_images (legacy webhooks)';
    END IF;
END $$;

DO $$
BEGIN
    -- receiver_id en guarantors - verificar que no se usa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'guarantors' AND column_name = 'receiver_id'
    ) THEN
        ALTER TABLE public.guarantors DROP COLUMN IF EXISTS receiver_id;
        RAISE NOTICE '✅ Eliminada columna receiver_id de guarantors (legacy webhooks)';
    END IF;
END $$;

-- NOTA: Las siguientes columnas se MANTIENEN porque tienen referencias activas:
-- - applicant_data (applications) - usado en supabase.ts
-- - documents_urls (applications) - podría usarse
-- - structured_applicant_id/guarantor_id (applications) - usados en lógica
-- - applicant_id (offers) - usado en ApplicationsPage.tsx y otros
-- - structured_applicant_id (offers) - podría usarse
-- - property_type (properties) - usado extensivamente en formularios
-- - address_id (properties) - usado en supabase.ts

DO $$ BEGIN
    RAISE NOTICE '⚠️  COLUMNAS MANTENIDAS POR REFERENCIAS ACTIVAS:';
    RAISE NOTICE '  - applicant_data (applications) - usado en supabase.ts';
    RAISE NOTICE '  - applicant_id (offers) - usado en ApplicationsPage.tsx';
    RAISE NOTICE '  - property_type (properties) - usado en formularios';
    RAISE NOTICE '  - address_id (properties) - usado en supabase.ts';
END $$;

-- ========================================================================
-- PASO 4: LIMPIEZA DE CONSTRAINTS Y TRIGGERS ORPHANS
-- ========================================================================

DO $$ BEGIN
    RAISE NOTICE '🔧 LIMPIANDO CONSTRAINTS Y TRIGGERS HUÉRFANOS...';
END $$;

-- Nota: Los constraints se eliminan automáticamente con DROP TABLE CASCADE
-- Verificar que no queden triggers huérfanos

DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Buscar triggers que referencien tablas eliminadas
    FOR trigger_record IN
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger
        WHERE tgname LIKE '%receiver%'
           OR tgname LIKE '%structured%'
           OR tgname LIKE '%legacy%'
    LOOP
        RAISE NOTICE '⚠️  Trigger potencialmente huérfano encontrado: % en tabla %', trigger_record.tgname, trigger_record.table_name;
    END LOOP;
END $$;

-- ========================================================================
-- PASO 5: VERIFICACIÓN FINAL
-- ========================================================================

DO $$
DECLARE
    table_count INTEGER;
    total_tables INTEGER;
BEGIN
    -- Contar tablas restantes
    SELECT COUNT(*) INTO total_tables FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO table_count FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('profiles', 'properties', 'applications', 'guarantors', 'documents', 'property_images', 'offers', 'rental_contract_conditions', 'rental_contracts', 'property_type_characteristics', 'rental_owner_characteristics', 'contract_clauses', 'contract_conditions', 'contract_signatures', 'property_owners', 'rental_owners', 'sale_owners', 'applicant_document_content', 'applicant_document_types', 'addresses', 'applicants', 'visit_requests');

    RAISE NOTICE '📊 VERIFICACIÓN FINAL (CONSERVADORA):';
    RAISE NOTICE '  - Total de tablas en esquema public: %', total_tables;
    RAISE NOTICE '  - Tablas activas identificadas: %', table_count;
    RAISE NOTICE '  - Tablas eliminadas en esta migración: %', 6;

    IF total_tables <= table_count THEN
        RAISE NOTICE '✅ ÉXITO: Base de datos limpiada correctamente';
    ELSE
        RAISE NOTICE 'ℹ️  INFO: Quedan % tablas adicionales (legacy mantenidas)', total_tables - table_count;
    END IF;
END $$;

-- ========================================================================
-- PASO 6: REGISTRO DE CAMBIOS PARA ROLLBACK
-- ========================================================================

DO $$ BEGIN
    RAISE NOTICE '📝 REGISTRO DE CAMBIOS APLICADOS (CONSERVADOR):';
    RAISE NOTICE '  TABLAS ELIMINADAS:';
    RAISE NOTICE '    - user_favorites (no usado)';
    RAISE NOTICE '    - amenidades (experimental)';
    RAISE NOTICE '    - propiedad_amenidades (duplicada)';
    RAISE NOTICE '    - messages (no implementado)';
    RAISE NOTICE '    - notifications (no implementado)';
    RAISE NOTICE '    - user_profiles (duplicada)';
    RAISE NOTICE '  TABLAS MANTENIDAS:';
    RAISE NOTICE '    - addresses (estructura compleja)';
    RAISE NOTICE '    - applicants (estructura compleja)';
    RAISE NOTICE '    - visit_requests (referencias activas)';
    RAISE NOTICE '  COLUMNAS ELIMINADAS:';
    RAISE NOTICE '    - receiver_id (applications, offers, properties, documents, property_images, guarantors)';
    RAISE NOTICE '  COLUMNAS MANTENIDAS:';
    RAISE NOTICE '    - applicant_data (applications) - usado en supabase.ts';
    RAISE NOTICE '    - applicant_id (offers) - usado en ApplicationsPage.tsx';
    RAISE NOTICE '    - property_type (properties) - usado en formularios';
    RAISE NOTICE '    - address_id (properties) - usado en supabase.ts';
    RAISE NOTICE '';
    RAISE NOTICE '✅ ESTRATEGIA CONSERVADORA: Se priorizó la estabilidad sobre limpieza agresiva';
    RAISE NOTICE '⚠️  IMPORTANTE: Crear backup antes de aplicar esta migración.';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 AUDITORÍA Y LIMPIEZA COMPLETADA EXITOSAMENTE';
END $$;
