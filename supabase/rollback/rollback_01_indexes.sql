-- =====================================================
-- ROLLBACK 01_INDEXES - Eliminar todos los índices
-- =====================================================
-- Este script elimina todos los índices creados en las migraciones
-- Se ejecuta después del rollback del schema

DO $$
BEGIN
    RAISE NOTICE '🗂️ Iniciando rollback de índices...';
END $$;

-- =====================================================
-- ÍNDICES DE TABLAS RECIENTES
-- =====================================================

-- Índices de application_applicants y application_guarantors
DROP INDEX IF EXISTS idx_application_guarantors_entity_type CASCADE;
DROP INDEX IF EXISTS idx_application_guarantors_rut CASCADE;
DROP INDEX IF EXISTS idx_application_guarantors_application_id CASCADE;
DROP INDEX IF EXISTS idx_application_applicants_entity_type CASCADE;
DROP INDEX IF EXISTS idx_application_applicants_rut CASCADE;
DROP INDEX IF EXISTS idx_application_applicants_application_id CASCADE;

-- Índices de documentos
DROP INDEX IF EXISTS idx_documents_applicant_type CASCADE;
DROP INDEX IF EXISTS idx_applicant_document_types_active CASCADE;
DROP INDEX IF EXISTS idx_applicant_document_types_category CASCADE;
DROP INDEX IF EXISTS idx_applicant_document_content_type CASCADE;

-- Índices de características
DROP INDEX IF EXISTS idx_rental_owner_characteristics_rental_owner_id CASCADE;
DROP INDEX IF EXISTS idx_property_type_characteristics_property_id CASCADE;

-- Índices de auditoría
DROP INDEX IF EXISTS idx_application_modifications_application_id CASCADE;
DROP INDEX IF EXISTS idx_application_modifications_created_at CASCADE;

-- =====================================================
-- ÍNDICES DEL ESQUEMA PRINCIPAL
-- =====================================================

-- Índices de user_favorites
DROP INDEX IF EXISTS idx_user_favorites_created_at CASCADE;
DROP INDEX IF EXISTS idx_user_favorites_property_id CASCADE;
DROP INDEX IF EXISTS idx_user_favorites_user_id CASCADE;

-- Índices de property_images
DROP INDEX IF EXISTS idx_property_images_created_at CASCADE;
DROP INDEX IF EXISTS idx_property_images_property_id CASCADE;

-- Índices de documents
DROP INDEX IF EXISTS idx_documents_created_at CASCADE;
DROP INDEX IF EXISTS idx_documents_type CASCADE;
DROP INDEX IF EXISTS idx_documents_related_entity CASCADE;
DROP INDEX IF EXISTS idx_documents_uploader_id CASCADE;

-- Índices de offers
DROP INDEX IF EXISTS idx_offers_created_at CASCADE;
DROP INDEX IF EXISTS idx_offers_status CASCADE;
DROP INDEX IF EXISTS idx_offers_offerer_id CASCADE;
DROP INDEX IF EXISTS idx_offers_property_id CASCADE;

-- Índices de applications
DROP INDEX IF EXISTS idx_applications_created_at CASCADE;
DROP INDEX IF EXISTS idx_applications_status CASCADE;
DROP INDEX IF EXISTS idx_applications_guarantor_id CASCADE;
DROP INDEX IF EXISTS idx_applications_applicant_id CASCADE;
DROP INDEX IF EXISTS idx_applications_property_id CASCADE;

-- Índices de properties
DROP INDEX IF EXISTS idx_properties_created_at CASCADE;
DROP INDEX IF EXISTS idx_properties_price_clp CASCADE;
DROP INDEX IF EXISTS idx_properties_region CASCADE;
DROP INDEX IF EXISTS idx_properties_commune CASCADE;
DROP INDEX IF EXISTS idx_properties_listing_type CASCADE;
DROP INDEX IF EXISTS idx_properties_status CASCADE;
DROP INDEX IF EXISTS idx_properties_owner_id CASCADE;

-- Índices de profiles
DROP INDEX IF EXISTS idx_profiles_created_at CASCADE;
DROP INDEX IF EXISTS idx_profiles_email CASCADE;
DROP INDEX IF EXISTS idx_profiles_rut CASCADE;

-- =====================================================
-- ÍNDICES AGREGADOS EN FIXES
-- =====================================================

-- Índices agregados en migraciones de corrección
DROP INDEX IF EXISTS idx_profiles_entity_type CASCADE;
DROP INDEX IF EXISTS idx_profiles_company_rut CASCADE;
DROP INDEX IF EXISTS idx_guarantors_created_by CASCADE;
DROP INDEX IF EXISTS idx_offers_offerer_id CASCADE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    remaining_indexes integer;
BEGIN
    SELECT COUNT(*) INTO remaining_indexes
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND indexname NOT LIKE 'pg_%';

    RAISE NOTICE '✅ Rollback de índices completado';
    RAISE NOTICE '   - Índices restantes en public schema: %', remaining_indexes;

    IF remaining_indexes > 0 THEN
        RAISE WARNING '⚠️  Aún quedan % índices en el esquema. Verifica si todos los índices fueron eliminados.', remaining_indexes;
    ELSE
        RAISE NOTICE '🎉 Todos los índices han sido eliminados exitosamente.';
    END IF;
END $$;
