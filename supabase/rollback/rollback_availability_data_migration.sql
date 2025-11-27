-- Rollback migration: Remove calendar_events table and all related objects

-- Drop the check constraint
ALTER TABLE calendar_events
DROP CONSTRAINT IF EXISTS check_availability_data_structure;

-- Drop the indexes
DROP INDEX IF EXISTS idx_calendar_events_property_availability;
DROP INDEX IF EXISTS idx_calendar_events_availability_data;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;

-- Remove the comment
COMMENT ON COLUMN calendar_events.availability_data IS NULL;

-- Drop the table (this will also drop the availability_data column)
DROP TABLE IF EXISTS calendar_events;
