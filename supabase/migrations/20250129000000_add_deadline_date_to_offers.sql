-- Migration: Add deadline_date field to property_sale_offers table
-- Date: 2025-01-29
-- Description: Adds deadline_date field to track offer expiration dates for calendar integration

-- =====================================================
-- VERIFICATION: Check if deadline_date column already exists
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'property_sale_offers'
        AND column_name = 'deadline_date'
    ) THEN
        RAISE NOTICE '⚠️ Column deadline_date already exists in property_sale_offers table';
        RAISE NOTICE 'Skipping migration...';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Column deadline_date does not exist, proceeding with migration';
END $$;

-- =====================================================
-- ADD DEADLINE_DATE COLUMN
-- =====================================================

ALTER TABLE property_sale_offers
ADD COLUMN IF NOT EXISTS deadline_date DATE;

-- =====================================================
-- ADD COMMENT AND CONSTRAINTS
-- =====================================================

COMMENT ON COLUMN property_sale_offers.deadline_date IS
'Fecha límite para que la oferta sea válida. Si no se especifica, la oferta no tiene plazo definido.';

-- Add check constraint to ensure deadline_date is in the future (optional)
-- ALTER TABLE property_sale_offers
-- ADD CONSTRAINT check_deadline_date_future
-- CHECK (deadline_date IS NULL OR deadline_date >= CURRENT_DATE);

-- =====================================================
-- UPDATE EXISTING RECORDS (if needed)
-- =====================================================

-- For existing offers without deadline_date, you might want to set a default
-- This is commented out as it's better to handle this in application logic

-- UPDATE property_sale_offers
-- SET deadline_date = created_at::DATE + INTERVAL '30 days'
-- WHERE deadline_date IS NULL
-- AND status IN ('pendiente', 'en_revision');

-- =====================================================
-- ADD INDEX FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_property_sale_offers_deadline_date
ON property_sale_offers(deadline_date)
WHERE deadline_date IS NOT NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📅 Added deadline_date column to property_sale_offers table';
    RAISE NOTICE '📊 Created index for deadline_date queries';
    RAISE NOTICE '💡 Offers can now have expiration dates for calendar integration';
END $$;

