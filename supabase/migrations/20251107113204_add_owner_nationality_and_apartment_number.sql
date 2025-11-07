-- Add nationality and apartment_number columns to rental_owners table
-- Migration: 20251107113204_add_owner_nationality_and_apartment_number

-- Add nationality column (required for natural persons)
ALTER TABLE rental_owners
ADD COLUMN IF NOT EXISTS nationality varchar(40) NOT NULL DEFAULT 'Chilena';

-- Add apartment_number column (optional, for department/house/office numbers)
ALTER TABLE rental_owners
ADD COLUMN IF NOT EXISTS apartment_number varchar(16) NULL;

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN rental_owners.nationality IS 'Nationality of the property owner (required for natural persons)';
COMMENT ON COLUMN rental_owners.apartment_number IS 'Apartment, house, or office number (optional additional address detail)';

-- Add missing columns to rental_contract_conditions table
-- These columns are used in the contract modal but were not persisted to the database

-- Add landlord_email column for storing the landlord's email address
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS landlord_email text;

-- Add is_furnished column to track if the property is furnished
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS is_furnished boolean DEFAULT false;

-- Add comments for the new columns
COMMENT ON COLUMN rental_contract_conditions.landlord_email IS 'Email address of the property landlord/owner';
COMMENT ON COLUMN rental_contract_conditions.is_furnished IS 'Whether the rental property is furnished';