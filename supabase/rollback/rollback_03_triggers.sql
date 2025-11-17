-- =====================================================
-- ROLLBACK 03_TRIGGERS - Eliminar triggers y funciones
-- =====================================================
-- Este script elimina todos los triggers y funciones creadas
-- Se ejecuta después del rollback de políticas RLS

DO $$
BEGIN
    RAISE NOTICE '⚡ Iniciando rollback de triggers y funciones...';
END $$;

-- =====================================================
-- TRIGGERS Y FUNCIONES DE TABLAS RECIENTES
-- =====================================================

-- Triggers y funciones de property_sale_offers
DROP TRIGGER IF EXISTS trigger_offer_bank_executives_updated_at ON offer_bank_executives CASCADE;
DROP FUNCTION IF EXISTS update_offer_bank_executives_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_offer_with_executives(uuid) CASCADE;

DROP TRIGGER IF EXISTS trigger_log_sale_offer_status_change ON property_sale_offers CASCADE;
DROP TRIGGER IF EXISTS trigger_property_sale_offers_updated_at ON property_sale_offers CASCADE;
DROP FUNCTION IF EXISTS log_property_sale_offer_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_property_sale_offers_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_property_sale_offers(uuid) CASCADE;

-- Triggers de documentos de propietarios
DROP TRIGGER IF EXISTS trigger_rental_owner_documents_updated_at ON rental_owner_documents CASCADE;
DROP FUNCTION IF EXISTS update_rental_owner_documents_updated_at() CASCADE;

DROP TRIGGER IF EXISTS trigger_sale_owner_documents_updated_at ON sale_owner_documents CASCADE;
DROP FUNCTION IF EXISTS update_sale_owner_documents_updated_at() CASCADE;

DROP TRIGGER IF EXISTS trigger_property_sale_documents_updated_at ON property_sale_documents CASCADE;

-- Triggers de user_documents y user_guarantor_documents
DROP TRIGGER IF EXISTS trigger_update_user_guarantor_documents_updated_at ON user_guarantor_documents CASCADE;
DROP TRIGGER IF EXISTS trigger_update_user_guarantors_updated_at ON user_guarantor_documents CASCADE;
DROP TRIGGER IF EXISTS trigger_update_user_documents_updated_at ON user_documents CASCADE;

-- Triggers de documentos de applicants y guarantors
DROP TRIGGER IF EXISTS update_guarantor_documents_updated_at ON guarantor_documents CASCADE;
DROP TRIGGER IF EXISTS update_applicant_documents_updated_at ON applicant_documents CASCADE;

-- Triggers de property owners
DROP TRIGGER IF EXISTS update_property_sale_owners_updated_at ON property_sale_owners CASCADE;
DROP TRIGGER IF EXISTS update_property_rental_owners_updated_at ON property_rental_owners CASCADE;

-- Triggers de características
DROP TRIGGER IF EXISTS trigger_generate_rental_owner_characteristic_id ON rental_owners CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_property_characteristic_id ON properties CASCADE;

-- Triggers de contratos
DROP TRIGGER IF EXISTS trigger_update_contract_signatures_updated_at ON contract_signatures CASCADE;
DROP TRIGGER IF EXISTS trigger_update_contract_clauses_updated_at ON contract_clauses CASCADE;
DROP TRIGGER IF EXISTS trigger_update_rental_contracts_updated_at ON rental_contracts CASCADE;
DROP TRIGGER IF EXISTS trigger_update_rental_contract_conditions_updated_at ON rental_contract_conditions CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_contract_number ON rental_contracts CASCADE;

-- =====================================================
-- TRIGGERS Y FUNCIONES DEL ESQUEMA PRINCIPAL
-- =====================================================

-- Trigger principal de creación de perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS create_public_profile_for_new_user() CASCADE;

-- Funciones helper del esquema principal
DROP FUNCTION IF EXISTS get_property_with_details(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_complete_profile(uuid) CASCADE;

-- =====================================================
-- FUNCIONES ADICIONALES DE FIXES
-- =====================================================

-- Funciones de application_applicants y application_guarantors
DROP FUNCTION IF EXISTS get_applicant_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_guarantor_count(uuid) CASCADE;

-- Funciones de contratos y características
DROP FUNCTION IF EXISTS generate_rental_contract_conditions_characteristic_id() CASCADE;

-- Funciones de receiver_id
DROP FUNCTION IF EXISTS maintain_receiver_id() CASCADE;

-- Funciones de characteristic_id
DROP FUNCTION IF EXISTS generate_characteristic_id() CASCADE;

-- =====================================================
-- TRIGGERS DE UPDATED_AT (GENERALES)
-- =====================================================

-- Triggers de updated_at en tablas principales
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles CASCADE;
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications CASCADE;
DROP TRIGGER IF EXISTS update_applicants_updated_at ON applicants CASCADE;
DROP TRIGGER IF EXISTS update_guarantors_updated_at ON guarantors CASCADE;
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties CASCADE;
DROP TRIGGER IF EXISTS update_contract_conditions_updated_at ON contract_conditions CASCADE;

-- Triggers de características
DROP TRIGGER IF EXISTS property_type_characteristics_updated_at ON property_type_characteristics CASCADE;
DROP TRIGGER IF EXISTS rental_owner_characteristics_updated_at ON rental_owner_characteristics CASCADE;
DROP TRIGGER IF EXISTS guarantors_updated_at_trigger ON guarantors CASCADE;

-- =====================================================
-- TRIGGERS DE RECEIVER_ID (DEPRECATED)
-- =====================================================

-- Triggers de receiver_id (ya no se usan)
DROP TRIGGER IF EXISTS trigger_maintain_property_owners_receiver_id ON property_owners CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_visit_requests_receiver_id ON visit_requests CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_user_favorites_receiver_id ON user_favorites CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_property_images_receiver_id ON property_images CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_documents_receiver_id ON documents CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_guarantors_receiver_id ON guarantors CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_offers_receiver_id ON offers CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_applications_receiver_id ON applications CASCADE;
DROP TRIGGER IF EXISTS trigger_maintain_properties_receiver_id ON properties CASCADE;

-- =====================================================
-- TRIGGERS DE CHARACTERISTIC_ID (DEPRECATED)
-- =====================================================

-- Triggers de characteristic_id (ya no se usan)
DROP TRIGGER IF EXISTS trigger_generate_favorite_characteristic_id ON user_favorites CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_image_characteristic_id ON property_images CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_document_characteristic_id ON documents CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_guarantor_characteristic_id ON guarantors CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_offer_characteristic_id ON offers CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_application_characteristic_id ON applications CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_property_characteristic_id ON properties CASCADE;

-- =====================================================
-- TRIGGERS DE SINCRONIZACIÓN
-- =====================================================

-- Triggers de sincronización
DROP TRIGGER IF EXISTS sync_property_type_trigger ON properties CASCADE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    remaining_triggers integer;
    remaining_functions integer;
BEGIN
    SELECT COUNT(*) INTO remaining_triggers
    FROM pg_trigger
    WHERE tgname NOT LIKE 'pg_%'
    AND tgisinternal = false;

    SELECT COUNT(*) INTO remaining_functions
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'pg_%';

    RAISE NOTICE '✅ Rollback de triggers y funciones completado';
    RAISE NOTICE '   - Triggers restantes: %', remaining_triggers;
    RAISE NOTICE '   - Funciones restantes: %', remaining_functions;

    IF remaining_triggers > 0 OR remaining_functions > 0 THEN
        RAISE WARNING '⚠️  Aún quedan triggers (%1) o funciones (%2). Verifica si todos fueron eliminados.', remaining_triggers, remaining_functions;
    ELSE
        RAISE NOTICE '🎉 Todos los triggers y funciones han sido eliminados exitosamente.';
    END IF;
END $$;
