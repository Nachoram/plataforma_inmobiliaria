-- Migration: Add owners field to properties table for sale properties
-- Date: 20251117120000
-- Description: Adds owners JSONB field to properties table to store multiple owners data

-- Add owners field to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owners jsonb DEFAULT '[]'::jsonb;

-- Add comment to document the field
COMMENT ON COLUMN properties.owners IS 'Array of property owners with name, email, phone and ownership_percentage';

-- Create index for better performance on owners queries
CREATE INDEX IF NOT EXISTS idx_properties_owners ON properties USING gin(owners);

-- Grant permissions (assuming RLS is enabled)
-- The existing RLS policies should handle this field appropriately

-- =====================================================
-- FIX: Add foreign key relationship between property_sale_offers and profiles
-- =====================================================

-- Add foreign key constraint for buyer_id to reference profiles.id
-- This enables PostgREST automatic joins
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'property_sale_offers_buyer_id_fkey'
        AND table_name = 'property_sale_offers'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE property_sale_offers
        ADD CONSTRAINT property_sale_offers_buyer_id_fkey
        FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;

        RAISE NOTICE '🔗 Foreign key constraint added: property_sale_offers.buyer_id -> profiles.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint already exists: property_sale_offers_buyer_id_fkey';
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completada: Campo owners agregado a tabla properties';
    RAISE NOTICE '📋 Campo: owners (jsonb) - Array de propietarios';
    RAISE NOTICE '🔍 Índice GIN creado para consultas eficientes';
END $$;
