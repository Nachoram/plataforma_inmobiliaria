-- Create calendar_events table and add availability_data column for property availability management
-- This allows storing detailed time slot information for property visits

-- Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    type TEXT DEFAULT 'meeting' CHECK (type IN ('meeting', 'deadline', 'reminder', 'visit', 'negotiation', 'closing', 'inspection', 'availability')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    location TEXT,
    attendees UUID[] DEFAULT '{}',
    reminders JSONB DEFAULT '[]',
    related_offer_id UUID,
    related_task_id UUID,
    color TEXT,
    recurrence JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Property availability specific fields
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    availability_data JSONB -- Will be added below
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (
        created_by = auth.uid() OR
        attendees @> ARRAY[auth.uid()] OR
        (property_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM properties WHERE id = calendar_events.property_id AND owner_id = auth.uid()
        ))
    );

CREATE POLICY "Users can create calendar events" ON calendar_events
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (created_by = auth.uid());

-- Add the availability_data JSONB column to store time slot configurations
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS availability_data JSONB;

-- Add a comment explaining the column purpose
COMMENT ON COLUMN calendar_events.availability_data IS 'JSON object containing availability time slots configuration for property visits. Structure: {"timeSlots": ["9-10", "10-11", ...], "customTimes": [{"start": "HH:MM", "end": "HH:MM"}]}';

-- Create an index on availability_data for better query performance when filtering by availability
CREATE INDEX IF NOT EXISTS idx_calendar_events_availability_data
ON calendar_events USING GIN (availability_data);

-- Create a partial index for events with availability data (property availability events)
CREATE INDEX IF NOT EXISTS idx_calendar_events_property_availability
ON calendar_events (property_id, start_date)
WHERE availability_data IS NOT NULL AND type = 'availability';

-- Update existing availability events to have default time slots if they don't have availability_data
-- This ensures backward compatibility with existing data
UPDATE calendar_events
SET availability_data = '{"timeSlots": ["10-11", "11-12", "14-15", "15-16"], "customTimes": []}'::jsonb
WHERE type = 'availability'
AND availability_data IS NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_events_updated_at();

-- Add a check constraint to ensure availability_data has the correct structure when present
ALTER TABLE calendar_events
ADD CONSTRAINT check_availability_data_structure
CHECK (
  availability_data IS NULL OR
  (
    jsonb_typeof(availability_data) = 'object' AND
    availability_data ? 'timeSlots' AND
    jsonb_typeof(availability_data->'timeSlots') = 'array' AND
    availability_data ? 'customTimes' AND
    jsonb_typeof(availability_data->'customTimes') = 'array'
  )
);
