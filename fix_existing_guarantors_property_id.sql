-- Fix for existing guarantors that don't have property_id assigned
-- This script assigns property_id to guarantors based on their existing applications

-- Update guarantors that are referenced in applications but don't have property_id set
UPDATE guarantors
SET property_id = applications.property_id
FROM applications
WHERE guarantors.id = applications.guarantor_id
AND guarantors.property_id IS NULL;

-- Log the results
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM guarantors
    WHERE property_id IS NOT NULL;

    RAISE NOTICE 'Updated guarantors with property_id. Total guarantors with property_id: %', updated_count;

    -- Check if there are any guarantors still without property_id
    SELECT COUNT(*) INTO updated_count
    FROM guarantors
    WHERE property_id IS NULL;

    IF updated_count > 0 THEN
        RAISE NOTICE 'Warning: % guarantors still have NULL property_id and may cause issues', updated_count;
    END IF;
END $$;
















