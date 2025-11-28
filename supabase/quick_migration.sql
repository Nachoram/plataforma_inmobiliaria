-- Migración rápida: Crear tabla calendar_events y columna availability_data

-- 1. Crear tabla calendar_events si no existe
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
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    property_id UUID,
    availability_data JSONB
);

-- 2. Agregar columna availability_data si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'calendar_events' AND column_name = 'availability_data'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN availability_data JSONB;
    END IF;
END $$;

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_calendar_events_availability_data
ON calendar_events USING GIN (availability_data);

CREATE INDEX IF NOT EXISTS idx_calendar_events_property_availability
ON calendar_events (property_id, start_date)
WHERE availability_data IS NOT NULL AND type = 'availability';

-- 4. Verificar que todo esté correcto
SELECT 'Tabla calendar_events creada/verificada exitosamente' as status;


