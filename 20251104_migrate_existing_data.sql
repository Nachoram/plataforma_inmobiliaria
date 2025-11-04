-- Migración: Migrar datos existentes a las nuevas tablas puente
-- Fecha: 4 de noviembre de 2025
-- Descripción: Esta migración mueve los datos existentes de applications.applicant_id
-- y applications.guarantor_id a las nuevas tablas application_applicants y application_guarantors.
-- EJECUTAR ESTO DESPUÉS de aplicar 20251104_create_tables_only.sql

-- ========================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- ========================================
-- Nota: Esta migración asume que las tablas application_applicants y application_guarantors
-- ya existen y están completamente configuradas.

-- Insertar postulantes existentes en application_applicants
INSERT INTO application_applicants (
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    profession,
    monthly_income_clp,
    age,
    nationality,
    marital_status,
    address_street,
    address_number,
    address_department,
    address_commune,
    address_region,
    phone,
    email,
    created_by
)
SELECT
    a.id as application_id,
    'natural'::entity_type_enum as entity_type,
    p.first_name,
    p.paternal_last_name,
    p.maternal_last_name,
    p.rut,
    a.snapshot_applicant_profession,
    a.snapshot_applicant_monthly_income_clp,
    a.snapshot_applicant_age,
    a.snapshot_applicant_nationality,
    a.snapshot_applicant_marital_status,
    a.snapshot_applicant_address_street,
    a.snapshot_applicant_address_number,
    a.snapshot_applicant_address_department,
    a.snapshot_applicant_address_commune,
    a.snapshot_applicant_address_region,
    a.snapshot_applicant_phone,
    a.snapshot_applicant_email,
    a.applicant_id as created_by
FROM applications a
JOIN profiles p ON a.applicant_id = p.id
WHERE a.applicant_id IS NOT NULL;

-- Insertar avales existentes en application_guarantors
INSERT INTO application_guarantors (
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    full_name,
    rut,
    profession,
    monthly_income,
    contact_email,
    address_street,
    address_number,
    address_department,
    address_commune,
    address_region,
    created_by
)
SELECT
    a.id as application_id,
    'natural'::entity_type_enum as entity_type,
    g.first_name,
    g.paternal_last_name,
    g.maternal_last_name,
    g.full_name,
    g.rut,
    g.profession,
    g.monthly_income,
    g.contact_email,
    g.address_street,
    g.address_number,
    g.address_department,
    g.address_commune,
    g.address_region,
    g.created_by
FROM applications a
JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.guarantor_id IS NOT NULL;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
-- Contar registros migrados
DO $$
DECLARE
    applicant_count integer;
    guarantor_count integer;
BEGIN
    SELECT COUNT(*) INTO applicant_count FROM application_applicants;
    SELECT COUNT(*) INTO guarantor_count FROM application_guarantors;

    RAISE NOTICE 'Migración de datos completada exitosamente:';
    RAISE NOTICE '  - Postulantes migrados: %', applicant_count;
    RAISE NOTICE '  - Avales migrados: %', guarantor_count;
    RAISE NOTICE '  - Tablas puente listas para usar';
END $$;
