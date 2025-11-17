-- =====================================================
-- ROLLBACK 02_RLS_POLICIES - Eliminar todas las políticas RLS
-- =====================================================
-- Este script elimina todas las políticas de Row Level Security
-- Se ejecuta después del rollback de índices

DO $$
BEGIN
    RAISE NOTICE '🔒 Iniciando rollback de políticas RLS...';
END $$;

-- =====================================================
-- POLÍTICAS DE TABLAS RECIENTES
-- =====================================================

-- Políticas de property_sale_offers y relacionadas
DROP POLICY IF EXISTS "Users can view history for accessible offers" ON property_sale_offer_history CASCADE;
DROP POLICY IF EXISTS "System can insert history" ON property_sale_offer_history CASCADE;
DROP POLICY IF EXISTS "Users can delete their own documents" ON property_sale_offer_documents CASCADE;
DROP POLICY IF EXISTS "Sellers can insert documents in property offers" ON property_sale_offer_documents CASCADE;
DROP POLICY IF EXISTS "Buyers can insert documents in their offers" ON property_sale_offer_documents CASCADE;
DROP POLICY IF EXISTS "Users can view documents for accessible offers" ON property_sale_offer_documents CASCADE;
DROP POLICY IF EXISTS "Sellers can update offers on their properties" ON property_sale_offers CASCADE;
DROP POLICY IF EXISTS "Buyers can update their pending offers" ON property_sale_offers CASCADE;
DROP POLICY IF EXISTS "Authenticated users can create offers" ON property_sale_offers CASCADE;
DROP POLICY IF EXISTS "Sellers can view offers on their properties" ON property_sale_offers CASCADE;
DROP POLICY IF EXISTS "Buyers can view their own offers" ON property_sale_offers CASCADE;

-- Políticas de offer_bank_executives
DROP POLICY IF EXISTS "Buyers can delete executives of their offers" ON offer_bank_executives CASCADE;
DROP POLICY IF EXISTS "Buyers can update executives of their offers" ON offer_bank_executives CASCADE;
DROP POLICY IF EXISTS "Buyers can insert executives in their offers" ON offer_bank_executives CASCADE;
DROP POLICY IF EXISTS "Sellers can view executives of offers on their properties" ON offer_bank_executives CASCADE;
DROP POLICY IF EXISTS "Buyers can view executives of their offers" ON offer_bank_executives CASCADE;

-- Políticas de documentos de propietarios
DROP POLICY IF EXISTS "Users can delete their own sale owner documents" ON sale_owner_documents CASCADE;
DROP POLICY IF EXISTS "Users can update their own sale owner documents" ON sale_owner_documents CASCADE;
DROP POLICY IF EXISTS "Users can insert sale owner documents for their properties" ON sale_owner_documents CASCADE;
DROP POLICY IF EXISTS "Users can view sale owner documents for their properties" ON sale_owner_documents CASCADE;

DROP POLICY IF EXISTS "Users can delete their own rental owner documents" ON rental_owner_documents CASCADE;
DROP POLICY IF EXISTS "Users can update their own rental owner documents" ON rental_owner_documents CASCADE;
DROP POLICY IF EXISTS "Users can insert rental owner documents for their properties" ON rental_owner_documents CASCADE;
DROP POLICY IF EXISTS "Users can view rental owner documents for their properties" ON rental_owner_documents CASCADE;

-- Políticas de application_applicants y application_guarantors
DROP POLICY IF EXISTS "Applicants can update their own application guarantors" ON application_guarantors CASCADE;
DROP POLICY IF EXISTS "Users can insert guarantors for their applications" ON application_guarantors CASCADE;
DROP POLICY IF EXISTS "Property owners can view guarantors for their properties" ON application_guarantors CASCADE;
DROP POLICY IF EXISTS "Applicants can view their own application guarantors" ON application_guarantors CASCADE;

DROP POLICY IF EXISTS "Applicants can update their own application applicants" ON application_applicants CASCADE;
DROP POLICY IF EXISTS "Users can insert applicants for their applications" ON application_applicants CASCADE;
DROP POLICY IF EXISTS "Property owners can view applicants for their properties" ON application_applicants CASCADE;
DROP POLICY IF EXISTS "Applicants can view their own application applicants" ON application_applicants CASCADE;

-- Políticas de documentos y auditoría
DROP POLICY IF EXISTS "Authenticated users can read document types" ON applicant_document_types CASCADE;
DROP POLICY IF EXISTS "Users can delete their own documents" ON applicant_documents CASCADE;
DROP POLICY IF EXISTS "Users can update their own documents" ON applicant_documents CASCADE;
DROP POLICY IF EXISTS "Users can insert documents for their applications" ON applicant_documents CASCADE;
DROP POLICY IF EXISTS "Users can view documents for their applications" ON applicant_documents CASCADE;

DROP POLICY IF EXISTS "Users can delete their own guarantor documents" ON guarantor_documents CASCADE;
DROP POLICY IF EXISTS "Users can update their own guarantor documents" ON guarantor_documents CASCADE;
DROP POLICY IF EXISTS "Users can insert guarantor documents for their applications" ON guarantor_documents CASCADE;
DROP POLICY IF EXISTS "Users can view guarantor documents for their applications" ON guarantor_documents CASCADE;

DROP POLICY IF EXISTS "Users can view their own guarantor documents" ON user_guarantor_documents CASCADE;
DROP POLICY IF EXISTS "Users can insert their own guarantor documents" ON user_guarantor_documents CASCADE;
DROP POLICY IF EXISTS "Users can update their own guarantor documents" ON user_guarantor_documents CASCADE;
DROP POLICY IF EXISTS "Users can delete their own guarantor documents" ON user_guarantor_documents CASCADE;

DROP POLICY IF EXISTS "Users can view their own user documents" ON user_documents CASCADE;
DROP POLICY IF EXISTS "Users can insert their own user documents" ON user_documents CASCADE;
DROP POLICY IF EXISTS "Users can update their own user documents" ON user_documents CASCADE;
DROP POLICY IF EXISTS "Users can delete their own user documents" ON user_documents CASCADE;

-- Políticas de auditoría y modificaciones
DROP POLICY IF EXISTS "Users can view modifications for their applications" ON application_modifications CASCADE;
DROP POLICY IF EXISTS "System can insert modifications" ON application_modifications CASCADE;
DROP POLICY IF EXISTS "Users can view audit log for their applications" ON application_audit_log CASCADE;
DROP POLICY IF EXISTS "System can insert audit log" ON application_audit_log CASCADE;

-- Políticas de contratos y firmas
DROP POLICY IF EXISTS "Users can view signatures for their contracts" ON contract_signatures CASCADE;
DROP POLICY IF EXISTS "Users can insert signatures for their contracts" ON contract_signatures CASCADE;
DROP POLICY IF EXISTS "Users can view clauses for their contracts" ON contract_clauses CASCADE;
DROP POLICY IF EXISTS "Users can insert clauses for their contracts" ON contract_clauses CASCADE;
DROP POLICY IF EXISTS "Users can view their rental contracts" ON rental_contracts CASCADE;
DROP POLICY IF EXISTS "Users can insert rental contracts for their applications" ON rental_contracts CASCADE;

-- Políticas de mensajes y solicitudes
DROP POLICY IF EXISTS "Users can view messages for their applications" ON application_messages CASCADE;
DROP POLICY IF EXISTS "Users can insert messages for their applications" ON application_messages CASCADE;
DROP POLICY IF EXISTS "Users can view requests for their applications" ON application_requests CASCADE;
DROP POLICY IF EXISTS "Users can insert requests for their applications" ON application_requests CASCADE;

-- =====================================================
-- POLÍTICAS DEL ESQUEMA PRINCIPAL
-- =====================================================

-- Políticas de user_favorites
DROP POLICY IF EXISTS "Users can remove properties from favorites" ON user_favorites CASCADE;
DROP POLICY IF EXISTS "Users can add properties to favorites" ON user_favorites CASCADE;
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites CASCADE;

-- Políticas de property_images
DROP POLICY IF EXISTS "Property owners can manage images for their properties" ON property_images CASCADE;
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images CASCADE;

-- Políticas de documents
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents CASCADE;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents CASCADE;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents CASCADE;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents CASCADE;
DROP POLICY IF EXISTS "Property owners can view documents for their properties" ON documents CASCADE;

-- Políticas de offers
DROP POLICY IF EXISTS "Property owners can update offers for their properties" ON offers CASCADE;
DROP POLICY IF EXISTS "Users can create offers" ON offers CASCADE;
DROP POLICY IF EXISTS "Property owners can view offers for their properties" ON offers CASCADE;
DROP POLICY IF EXISTS "Users can view their own offers" ON offers CASCADE;

-- Políticas de applications
DROP POLICY IF EXISTS "Property owners can update applications for their properties" ON applications CASCADE;
DROP POLICY IF EXISTS "Users can create applications" ON applications CASCADE;
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON applications CASCADE;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications CASCADE;

-- Políticas de guarantors
DROP POLICY IF EXISTS "Users can update guarantors for their applications" ON guarantors CASCADE;
DROP POLICY IF EXISTS "Users can insert guarantors" ON guarantors CASCADE;
DROP POLICY IF EXISTS "Users can view guarantors for their applications" ON guarantors CASCADE;

-- Políticas de properties
DROP POLICY IF EXISTS "Users can delete own properties" ON properties CASCADE;
DROP POLICY IF EXISTS "Users can update own properties" ON properties CASCADE;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties CASCADE;
DROP POLICY IF EXISTS "Users can view own properties" ON properties CASCADE;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties CASCADE;

-- Políticas de profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles CASCADE;

-- =====================================================
-- DESHABILITAR RLS EN TABLAS
-- =====================================================

-- Deshabilitar RLS en tablas recientes
ALTER TABLE IF EXISTS property_sale_offer_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS property_sale_offer_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS property_sale_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offer_bank_executives DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_owner_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rental_owner_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_guarantors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_applicants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applicant_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guarantor_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_guarantor_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_modifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_signatures DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_clauses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rental_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_requests DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tablas del esquema principal
ALTER TABLE IF EXISTS user_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS property_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guarantors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    remaining_policies integer;
BEGIN
    SELECT COUNT(*) INTO remaining_policies
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE '✅ Rollback de políticas RLS completado';
    RAISE NOTICE '   - Políticas restantes en public schema: %', remaining_policies;

    IF remaining_policies > 0 THEN
        RAISE WARNING '⚠️  Aún quedan % políticas RLS. Verifica si todas las políticas fueron eliminadas.', remaining_policies;
    ELSE
        RAISE NOTICE '🎉 Todas las políticas RLS han sido eliminadas exitosamente.';
    END IF;
END $$;
