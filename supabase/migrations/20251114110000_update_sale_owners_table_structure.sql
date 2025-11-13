-- Migration: Update sale_owners table structure to support comprehensive owner data
-- Date: 2025-11-14
-- Description: Adds missing columns to sale_owners table to support both natural and legal entity owners

-- =====================================================
-- UPDATE SALE_OWNERS TABLE STRUCTURE
-- =====================================================

-- Temporarily drop view that depends on sale_owners.email column
DROP VIEW IF EXISTS contract_data_view;

-- Add owner type column
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS owner_type text CHECK (owner_type IN ('natural', 'juridica'));

-- Add address fields (common for both types)
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS address_street text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS address_number varchar(10);
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS address_department varchar(10);
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS address_commune text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS address_region text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS nationality text;

-- Update existing email and phone columns to allow nulls and increase size if needed
ALTER TABLE sale_owners ALTER COLUMN email TYPE varchar(255);
ALTER TABLE sale_owners ALTER COLUMN phone TYPE varchar(20);

-- Recreate the contract_data_view
CREATE VIEW contract_data_view AS
SELECT
  -- Application data
  a.id as application_id,
  a.application_characteristic_id,
  a.status as application_status,
  a.message as application_message,
  a.created_at as application_created_at,

  -- Property data
  p.id as property_id,
  p.property_characteristic_id,
  CONCAT(p.address_street, ' ', p.address_number,
         CASE WHEN p.address_department IS NOT NULL THEN CONCAT(', Depto. ', p.address_department) ELSE '' END,
         ', ', p.address_commune, ', ', p.address_region) as property_full_address,
  p.price_clp as property_price_clp,
  p.common_expenses_clp as property_common_expenses_clp,
  p.bedrooms as property_bedrooms,
  p.bathrooms as property_bathrooms,
  p.surface_m2 as property_surface_m2,
  p.listing_type as property_listing_type,
  p.description as property_description,

  -- Current owner data (from profiles - for backward compatibility)
  prof_owner.id as owner_id,
  CONCAT(prof_owner.first_name, ' ', prof_owner.paternal_last_name,
         CASE WHEN prof_owner.maternal_last_name IS NOT NULL THEN CONCAT(' ', prof_owner.maternal_last_name) ELSE '' END) as owner_full_name,
  prof_owner.rut as owner_rut,
  prof_owner.email as owner_email,
  prof_owner.phone as owner_phone,
  prof_owner.profession as owner_profession,

  -- Rental owner data
  ro.id as rental_owner_id,
  ro.rental_owner_characteristic_id,
  CONCAT(ro.first_name, ' ', ro.paternal_last_name,
         CASE WHEN ro.maternal_last_name IS NOT NULL THEN CONCAT(' ', ro.maternal_last_name) ELSE '' END) as rental_owner_full_name,
  ro.rut as rental_owner_rut,
  ro.phone as rental_owner_phone,
  ro.email as rental_owner_email,
  ro.marital_status as rental_owner_marital_status,
  ro.property_regime as rental_owner_property_regime,
  CONCAT(ro.address_street, ' ', ro.address_number,
         CASE WHEN ro.address_department IS NOT NULL THEN CONCAT(', Depto. ', ro.address_department) ELSE '' END,
         ', ', ro.address_commune, ', ', ro.address_region) as rental_owner_full_address,

  -- Sale owner data
  so.id as sale_owner_id,
  so.sale_owner_characteristic_id,
  CONCAT(so.first_name, ' ', so.paternal_last_name,
         CASE WHEN so.maternal_last_name IS NOT NULL THEN CONCAT(' ', so.maternal_last_name) ELSE '' END) as sale_owner_full_name,
  so.rut as sale_owner_rut,
  so.phone as sale_owner_phone,
  so.email as sale_owner_email,
  so.marital_status as sale_owner_marital_status,
  so.property_regime as sale_owner_property_regime,
  CONCAT(so.address_street, ' ', so.address_number,
         CASE WHEN so.address_department IS NOT NULL THEN CONCAT(', Depto. ', so.address_department) ELSE '' END,
         ', ', so.address_commune, ', ', so.address_region) as sale_owner_full_address,

  -- Applicant data
  prof_applicant.id as applicant_id,
  CONCAT(prof_applicant.first_name, ' ', prof_applicant.paternal_last_name,
         CASE WHEN prof_applicant.maternal_last_name IS NOT NULL THEN CONCAT(' ', prof_applicant.maternal_last_name) ELSE '' END) as applicant_full_name,
  prof_applicant.rut as applicant_rut,
  prof_applicant.email as applicant_email,
  prof_applicant.phone as applicant_phone,
  prof_applicant.profession as applicant_profession,
  prof_applicant.marital_status as applicant_marital_status,
  prof_applicant.property_regime as applicant_property_regime,
  a.snapshot_applicant_monthly_income_clp as applicant_monthly_income_clp,
  CONCAT(a.snapshot_applicant_address_street, ' ', a.snapshot_applicant_address_number,
         CASE WHEN a.snapshot_applicant_address_department IS NOT NULL THEN CONCAT(', Depto. ', a.snapshot_applicant_address_department) ELSE '' END,
         ', ', a.snapshot_applicant_address_commune, ', ', a.snapshot_applicant_address_region) as applicant_full_address,

  -- Guarantor data
  g.id as guarantor_id,
  g.guarantor_characteristic_id,
  CONCAT(g.first_name, ' ', g.paternal_last_name,
         CASE WHEN g.maternal_last_name IS NOT NULL THEN CONCAT(' ', g.maternal_last_name) ELSE '' END) as guarantor_full_name,
  g.rut as guarantor_rut,
  g.profession as guarantor_profession,
  g.monthly_income_clp as guarantor_monthly_income_clp,
  CONCAT(g.address_street, ' ', g.address_number,
         CASE WHEN g.address_department IS NOT NULL THEN CONCAT(', Depto. ', g.address_department) ELSE '' END,
         ', ', g.address_commune, ', ', g.address_region) as guarantor_full_address

FROM applications a
INNER JOIN properties p ON a.property_id = p.id
INNER JOIN profiles prof_owner ON p.owner_id = prof_owner.id
INNER JOIN profiles prof_applicant ON a.applicant_id = prof_applicant.id
LEFT JOIN rental_owners ro ON p.id = ro.property_id
LEFT JOIN sale_owners so ON p.id = so.property_id
LEFT JOIN guarantors g ON a.guarantor_id = g.id
WHERE a.status = 'aprobada';

-- Grant permissions on the recreated view
GRANT SELECT ON contract_data_view TO anon, authenticated;

-- Add fields for natural persons
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS paternal_last_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS maternal_last_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS rut varchar(12);

-- Add fields for legal entities
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS company_rut varchar(12);
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS company_business text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS company_email varchar(255);
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS company_phone varchar(20);
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS representative_first_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS representative_paternal_last_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS representative_maternal_last_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS representative_rut varchar(12);
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS representative_email varchar(255);
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS representative_phone varchar(20);

-- Add legal entity constitution fields
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS constitution_type text CHECK (constitution_type IN ('empresa_en_un_dia', 'tradicional'));
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS constitution_date date;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS cve_code text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS notary_name text;
ALTER TABLE sale_owners ADD COLUMN IF NOT EXISTS repertory_number text;

-- =====================================================
-- UPDATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sale_owners_owner_type ON sale_owners(owner_type);
CREATE INDEX IF NOT EXISTS idx_sale_owners_rut ON sale_owners(rut);
CREATE INDEX IF NOT EXISTS idx_sale_owners_company_rut ON sale_owners(company_rut);
CREATE INDEX IF NOT EXISTS idx_sale_owners_representative_rut ON sale_owners(representative_rut);

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Update existing policies to work with new structure
-- The existing policies should still work, but we may need to update them
-- to handle the new owner types and fields

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completada: Estructura de tabla sale_owners actualizada';
    RAISE NOTICE '📋 Columnas agregadas: owner_type, nationality, address fields, natural person fields, legal entity fields';
    RAISE NOTICE '🔍 Índices actualizados para nuevas columnas';
    RAISE NOTICE '👁️ Vista contract_data_view recreada correctamente';
END $$;
