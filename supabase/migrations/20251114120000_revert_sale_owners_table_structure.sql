-- Migration: Revert sale_owners table structure changes
-- Date: 2025-11-14
-- Description: Removes all columns added in the previous migration to restore original structure

-- =====================================================
-- REVERT SALE_OWNERS TABLE STRUCTURE
-- =====================================================

-- Drop the contract_data_view that depends on sale_owners columns
DROP VIEW IF EXISTS contract_data_view;

-- Remove indexes that were added
DROP INDEX IF EXISTS idx_sale_owners_owner_type;
DROP INDEX IF EXISTS idx_sale_owners_rut;
DROP INDEX IF EXISTS idx_sale_owners_company_rut;
DROP INDEX IF EXISTS idx_sale_owners_representative_rut;

-- Remove legal entity constitution fields
ALTER TABLE sale_owners DROP COLUMN IF EXISTS constitution_type;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS constitution_date;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS cve_code;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS notary_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS repertory_number;

-- Remove legal entity representative fields
ALTER TABLE sale_owners DROP COLUMN IF EXISTS representative_first_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS representative_paternal_last_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS representative_maternal_last_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS representative_rut;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS representative_email;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS representative_phone;

-- Remove legal entity fields
ALTER TABLE sale_owners DROP COLUMN IF EXISTS company_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS company_rut;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS company_business;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS company_email;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS company_phone;

-- Remove natural person fields
ALTER TABLE sale_owners DROP COLUMN IF EXISTS first_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS paternal_last_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS maternal_last_name;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS rut;

-- Remove address fields
ALTER TABLE sale_owners DROP COLUMN IF EXISTS address_street;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS address_number;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS address_department;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS address_commune;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS address_region;
ALTER TABLE sale_owners DROP COLUMN IF EXISTS nationality;

-- Remove owner type column
ALTER TABLE sale_owners DROP COLUMN IF EXISTS owner_type;

-- Revert email and phone columns to original size if needed
-- Note: These ALTER COLUMN statements might not be necessary if the original sizes were the same

-- Recreate the contract_data_view with original structure
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

  -- Sale owner data (simplified - original structure)
  so.id as sale_owner_id,
  so.sale_owner_characteristic_id,
  -- Note: With the reverted structure, we can't construct full names from sale_owners
  -- This will need to be handled in the application layer or updated accordingly
  so.email as sale_owner_email,
  so.phone as sale_owner_phone,

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

-- =====================================================
-- REVERSION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Reversion completada: Estructura de tabla sale_owners revertida a estado original';
    RAISE NOTICE '📋 Columnas removidas: Todas las columnas agregadas en la migración anterior';
    RAISE NOTICE '🔍 Índices removidos';
    RAISE NOTICE '👁️ Vista contract_data_view recreada con estructura simplificada';
END $$;
