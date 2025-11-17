-- =====================================================
-- ROLLBACK 00_SCHEMA - Eliminar todas las tablas del esquema
-- =====================================================
-- Este script elimina todas las tablas en orden inverso a sus dependencias
-- IMPORTANTE: Usar CASCADE para eliminar dependencias automáticamente

DO $$
BEGIN
    RAISE NOTICE '🗑️ Iniciando rollback del esquema...';
END $$;

-- =====================================================
-- TABLAS RECIENTES (creadas en migraciones posteriores)
-- =====================================================

-- Tablas de venta de propiedades (más recientes)
DROP TABLE IF EXISTS property_sale_offer_documents CASCADE;
DROP TABLE IF EXISTS sale_owner_documents CASCADE;
DROP TABLE IF EXISTS property_sale_documents CASCADE;
DROP TABLE IF EXISTS property_sale_offers CASCADE;
DROP TABLE IF EXISTS sale_owners CASCADE;

-- Tablas de contratos y firmas
DROP TABLE IF EXISTS contract_signatures CASCADE;
DROP TABLE IF EXISTS contract_clauses CASCADE;
DROP TABLE IF EXISTS rental_contracts CASCADE;

-- Tablas de auditoría y modificaciones
DROP TABLE IF EXISTS application_audit_log CASCADE;
DROP TABLE IF EXISTS application_modifications CASCADE;

-- Tablas de mensajes y solicitudes
DROP TABLE IF EXISTS application_requests CASCADE;
DROP TABLE IF EXISTS application_messages CASCADE;

-- Tablas de usuarios y documentos
DROP TABLE IF EXISTS user_guarantor_documents CASCADE;
DROP TABLE IF EXISTS user_documents CASCADE;

-- Tablas de documentos y procesamiento
DROP TABLE IF EXISTS applicant_document_content CASCADE;
DROP TABLE IF EXISTS applicant_document_types CASCADE;
DROP TABLE IF EXISTS applicant_documents CASCADE;
DROP TABLE IF EXISTS guarantor_documents CASCADE;
DROP TABLE IF EXISTS rental_owner_documents CASCADE;

-- Tablas de características y tipos
DROP TABLE IF EXISTS property_type_characteristics CASCADE;
DROP TABLE IF EXISTS rental_owner_characteristics CASCADE;

-- Tablas de postulantes y avales (sistema nuevo)
DROP TABLE IF EXISTS application_guarantors CASCADE;
DROP TABLE IF EXISTS application_applicants CASCADE;

-- =====================================================
-- TABLAS DEL ESQUEMA PRINCIPAL (orden inverso a dependencias)
-- =====================================================

-- Tablas que dependen de otras (eliminar primero)
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Tablas base (eliminar después)
DROP TABLE IF EXISTS guarantors CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- ENUMS Y TIPOS PERSONALIZADOS
-- =====================================================

-- Enums creados en migraciones recientes
DROP TYPE IF EXISTS constitution_type_enum CASCADE;
DROP TYPE IF EXISTS entity_type_enum CASCADE;

-- Enums del esquema principal
DROP TYPE IF EXISTS document_entity_type_enum CASCADE;
DROP TYPE IF EXISTS offer_status_enum CASCADE;
DROP TYPE IF EXISTS application_status_enum CASCADE;
DROP TYPE IF EXISTS listing_type_enum CASCADE;
DROP TYPE IF EXISTS property_status_enum CASCADE;
DROP TYPE IF EXISTS property_regime_enum CASCADE;
DROP TYPE IF EXISTS marital_status_enum CASCADE;

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Extensiones creadas en el esquema principal
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    remaining_tables integer;
BEGIN
    SELECT COUNT(*) INTO remaining_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%';

    RAISE NOTICE '✅ Rollback del esquema completado';
    RAISE NOTICE '   - Tablas restantes en public schema: %', remaining_tables;

    IF remaining_tables > 0 THEN
        RAISE WARNING '⚠️  Aún quedan % tablas en el esquema. Verifica si todas las tablas fueron eliminadas.', remaining_tables;
    ELSE
        RAISE NOTICE '🎉 Todas las tablas del esquema han sido eliminadas exitosamente.';
    END IF;
END $$;
