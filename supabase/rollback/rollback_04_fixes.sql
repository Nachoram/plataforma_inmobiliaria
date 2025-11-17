-- =====================================================
-- ROLLBACK 04_FIXES - Revertir cambios de ALTER TABLE
-- =====================================================
-- Este script revierte todos los cambios realizados por ALTER TABLE
-- en las migraciones de fixes

DO $$
BEGIN
    RAISE NOTICE '🔧 Iniciando rollback de fixes (ALTER TABLE)...';
END $$;

-- =====================================================
-- REVERTIR CAMBIOS EN PROFILES
-- =====================================================

-- Remover campos de entity_type y compañía agregados en 20251104
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_juridica_entity_check CASCADE;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_natural_entity_check CASCADE;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_unique_company_rut CASCADE;

ALTER TABLE profiles DROP COLUMN IF EXISTS constitution_notary CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS constitution_cve CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS constitution_date CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS constitution_type CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS legal_representative_rut CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS legal_representative_name CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS company_rut CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS company_name CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS entity_type CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN APPLICATIONS
-- =====================================================

-- Remover campos de broker agregados en seed_applications.sql
ALTER TABLE applications DROP COLUMN IF EXISTS broker_phone CASCADE;
ALTER TABLE applications DROP COLUMN IF EXISTS broker_email CASCADE;
ALTER TABLE applications DROP COLUMN IF EXISTS broker_rut CASCADE;
ALTER TABLE applications DROP COLUMN IF EXISTS broker_firm_name CASCADE;
ALTER TABLE applications DROP COLUMN IF EXISTS intention CASCADE;
ALTER TABLE applications DROP COLUMN IF EXISTS broker_type CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN APPLICATION_APPLICANTS
-- =====================================================

-- Remover campos de broker agregados en seed_applicants.sql
ALTER TABLE application_applicants DROP COLUMN IF EXISTS broker_phone CASCADE;
ALTER TABLE application_applicants DROP COLUMN IF EXISTS broker_email CASCADE;
ALTER TABLE application_applicants DROP COLUMN IF EXISTS broker_rut CASCADE;
ALTER TABLE application_applicants DROP COLUMN IF EXISTS broker_firm_name CASCADE;
ALTER TABLE application_applicants DROP COLUMN IF EXISTS intention CASCADE;
ALTER TABLE application_applicants DROP COLUMN IF EXISTS broker_type CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN DOCUMENTS
-- =====================================================

-- Remover campos agregados en migraciones de documentos
ALTER TABLE documents DROP COLUMN IF EXISTS metadata CASCADE;
ALTER TABLE documents DROP COLUMN IF EXISTS last_processed_at CASCADE;
ALTER TABLE documents DROP COLUMN IF EXISTS processing_attempts CASCADE;
ALTER TABLE documents DROP COLUMN IF EXISTS processing_status CASCADE;
ALTER TABLE documents DROP COLUMN IF EXISTS applicant_document_type_code CASCADE;

-- Remover campos de receiver_id (deprecated)
ALTER TABLE documents DROP COLUMN IF EXISTS receiver_id CASCADE;

-- Remover campos de characteristic_id (deprecated)
ALTER TABLE documents DROP COLUMN IF EXISTS document_characteristic_id CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN PROPERTIES
-- =====================================================

-- Remover campos agregados en diferentes migraciones
ALTER TABLE properties DROP COLUMN IF EXISTS estacionamientos CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS bodega CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS property_type CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS tipo_propiedad CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS parcela_number CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS storage_location CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS conditional_fields CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS owner_phone CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS owner_email CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS owner_nationality CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS owner_apartment_number CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS dicom CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS notification_email CASCADE;

-- Remover campos de características (deprecated)
ALTER TABLE properties DROP COLUMN IF EXISTS property_characteristic_id CASCADE;

-- Remover campos de receiver_id (deprecated)
ALTER TABLE properties DROP COLUMN IF EXISTS receiver_id CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN APPLICATIONS
-- =====================================================

-- Remover campos agregados en migraciones de applications
ALTER TABLE applications DROP COLUMN IF EXISTS updated_at CASCADE;
ALTER TABLE applications DROP COLUMN IF EXISTS documents_urls CASCADE;

-- Remover campos de características (deprecated)
ALTER TABLE applications DROP COLUMN IF EXISTS application_characteristic_id CASCADE;

-- Remover campos de receiver_id (deprecated)
ALTER TABLE applications DROP COLUMN IF EXISTS receiver_id CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN GUARANTORS
-- =====================================================

-- Remover campos agregados en migraciones de guarantors
ALTER TABLE guarantors DROP COLUMN IF EXISTS contact_phone CASCADE;
ALTER TABLE guarantors DROP COLUMN IF EXISTS contact_email CASCADE;
ALTER TABLE guarantors DROP COLUMN IF EXISTS full_name CASCADE;
ALTER TABLE guarantors DROP COLUMN IF EXISTS updated_at CASCADE;
ALTER TABLE guarantors DROP COLUMN IF EXISTS created_by CASCADE;

-- Remover campos de características (deprecated)
ALTER TABLE guarantors DROP COLUMN IF EXISTS guarantor_characteristic_id CASCADE;

-- Remover campos de receiver_id (deprecated)
ALTER TABLE guarantors DROP COLUMN IF EXISTS receiver_id CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN OFFERS
-- =====================================================

-- Remover campos agregados en migraciones de offers
ALTER TABLE offers DROP COLUMN IF EXISTS offerer_id CASCADE;

-- Remover campos de características (deprecated)
ALTER TABLE offers DROP COLUMN IF EXISTS offer_characteristic_id CASCADE;

-- Remover campos de receiver_id (deprecated)
ALTER TABLE offers DROP COLUMN IF EXISTS receiver_id CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN PROPERTY_IMAGES
-- =====================================================

-- Remover campos de características (deprecated)
ALTER TABLE property_images DROP COLUMN IF EXISTS image_characteristic_id CASCADE;

-- Remover campos de receiver_id (deprecated)
ALTER TABLE property_images DROP COLUMN IF EXISTS receiver_id CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN USER_FAVORITES
-- =====================================================

-- Remover campos de características (deprecated)
ALTER TABLE user_favorites DROP COLUMN IF EXISTS favorite_characteristic_id CASCADE;

-- Remover campos de receiver_id (deprecated)
ALTER TABLE user_favorites DROP COLUMN IF EXISTS receiver_id CASCADE;

-- =====================================================
-- REVERTIR CAMBIOS EN CONTRATOS Y CONDICIONES
-- =====================================================

-- Remover campos agregados en contratos
ALTER TABLE rental_contracts DROP COLUMN IF EXISTS contract_html CASCADE;
ALTER TABLE rental_contracts DROP COLUMN IF EXISTS auto_renewal_clause CASCADE;
ALTER TABLE rental_contracts DROP COLUMN IF EXISTS contract_number CASCADE;

ALTER TABLE rental_contract_conditions DROP COLUMN IF EXISTS payment_fields CASCADE;

-- =====================================================
-- REVERTIR CONSTRAINTS Y VALIDACIONES
-- =====================================================

-- Remover constraints agregados
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_documents_urls_check CASCADE;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check CASCADE;

-- =====================================================
-- REVERTIR ENUMS AGREGADOS EN FIXES
-- =====================================================

-- Nota: Los enums principales se eliminan en rollback_00_schema.sql
-- Aquí solo revertimos cambios específicos de fixes

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    profiles_columns integer;
    applications_columns integer;
    properties_columns integer;
BEGIN
    -- Contar columnas agregadas en fixes (simplificado)
    SELECT COUNT(*) INTO profiles_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN ('entity_type', 'company_name', 'company_rut', 'legal_representative_name');

    SELECT COUNT(*) INTO applications_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'applications'
    AND column_name IN ('broker_type', 'intention', 'broker_firm_name');

    SELECT COUNT(*) INTO properties_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'properties'
    AND column_name IN ('property_type', 'tipo_propiedad', 'bodega', 'estacionamientos');

    RAISE NOTICE '✅ Rollback de fixes completado';
    RAISE NOTICE '   - Columnas de entity_type en profiles restantes: %', profiles_columns;
    RAISE NOTICE '   - Columnas de broker en applications restantes: %', applications_columns;
    RAISE NOTICE '   - Columnas adicionales en properties restantes: %', properties_columns;

    IF profiles_columns = 0 AND applications_columns = 0 AND properties_columns = 0 THEN
        RAISE NOTICE '🎉 Todas las modificaciones de fixes han sido revertidas exitosamente.';
    ELSE
        RAISE WARNING '⚠️  Aún quedan algunas columnas de fixes. Verifica manualmente si es necesario.';
    END IF;
END $$;
