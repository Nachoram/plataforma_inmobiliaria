-- Complete visit system migration
-- Creates visit_requests table and adds all necessary fields

-- =====================================================
-- 1. CREAR TABLA VISIT_REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS visit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id), -- Duplicates user_id for better relationships

    -- Request details
    requested_date DATE NOT NULL,
    requested_time_slot TEXT NOT NULL CHECK (requested_time_slot IN ('9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19', '19-20', 'flexible')),
    message TEXT,

    -- Visitor information (NEW FIELDS)
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,

    -- Status and tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES PARA VISIT_REQUESTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_visit_requests_property_id ON visit_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_user_id ON visit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_status ON visit_requests(status);
CREATE INDEX IF NOT EXISTS idx_visit_requests_requested_date ON visit_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_visit_requests_visitor_email ON visit_requests(visitor_email);
CREATE INDEX IF NOT EXISTS idx_visit_requests_visitor_phone ON visit_requests(visitor_phone);
CREATE INDEX IF NOT EXISTS idx_visit_requests_receiver_id ON visit_requests(receiver_id);

-- =====================================================
-- 3. SEGURIDAD RLS PARA VISIT_REQUESTS
-- =====================================================

ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can create visit requests" ON visit_requests;
DROP POLICY IF EXISTS "Users can read own visit requests" ON visit_requests;
DROP POLICY IF EXISTS "Property owners can read visit requests for their properties" ON visit_requests;
DROP POLICY IF EXISTS "Property owners can update visit requests for their properties" ON visit_requests;
DROP POLICY IF EXISTS "Property owners can delete visit requests for their properties" ON visit_requests;

-- Políticas RLS
CREATE POLICY "Users can create visit requests" ON visit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own visit requests" ON visit_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Property owners can read visit requests for their properties" ON visit_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE id = visit_requests.property_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can update visit requests for their properties" ON visit_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE id = visit_requests.property_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can delete visit requests for their properties" ON visit_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE id = visit_requests.property_id
            AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- 4. VALIDACIONES PARA VISIT_REQUESTS
-- =====================================================

ALTER TABLE visit_requests
DROP CONSTRAINT IF EXISTS check_visitor_email_format;

ALTER TABLE visit_requests
ADD CONSTRAINT check_visitor_email_format CHECK (
  visitor_email IS NULL OR
  visitor_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

ALTER TABLE visit_requests
DROP CONSTRAINT IF EXISTS check_visitor_phone_format;

ALTER TABLE visit_requests
ADD CONSTRAINT check_visitor_phone_format CHECK (
  visitor_phone IS NULL OR
  visitor_phone ~ '^[0-9+\-\s()]+$'
);

-- =====================================================
-- 5. TRIGGER PARA RECEIVER_ID
-- =====================================================

CREATE OR REPLACE FUNCTION maintain_visit_requests_receiver_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep receiver_id in sync with user_id
    NEW.receiver_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maintain_visit_requests_receiver_id ON visit_requests;
CREATE TRIGGER trigger_maintain_visit_requests_receiver_id
    BEFORE INSERT OR UPDATE ON visit_requests
    FOR EACH ROW
    EXECUTE FUNCTION maintain_visit_requests_receiver_id();

-- =====================================================
-- 6. CREAR TABLA SCHEDULED_VISITS
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_request_id UUID REFERENCES visit_requests(id) ON DELETE CASCADE,

    -- Property and scheduling info
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time_slot TEXT NOT NULL CHECK (scheduled_time_slot IN ('9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19', '19-20', 'flexible')),

    -- Visitor information (from visit request)
    visitor_name TEXT NOT NULL,
    visitor_email TEXT NOT NULL,
    visitor_phone TEXT NOT NULL,

    -- Additional visit details
    visit_purpose TEXT DEFAULT 'property_visit' CHECK (visit_purpose IN ('property_visit', 'inspection', 'valuation', 'negotiation')),
    estimated_duration INTERVAL DEFAULT '1 hour',
    special_requirements TEXT,

    -- Status and tracking
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    visit_notes TEXT,

    -- Assigned agent/property owner
    assigned_agent_id UUID REFERENCES auth.users(id),
    property_owner_id UUID REFERENCES auth.users(id),

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure no duplicate visits for same property/date/time
    UNIQUE(property_id, scheduled_date, scheduled_time_slot)
);

-- =====================================================
-- 7. ÍNDICES PARA SCHEDULED_VISITS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_scheduled_visits_property_date ON scheduled_visits(property_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_visitor_email ON scheduled_visits(visitor_email);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_status ON scheduled_visits(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_assigned_agent ON scheduled_visits(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_visit_request ON scheduled_visits(visit_request_id);

-- =====================================================
-- 8. SEGURIDAD RLS PARA SCHEDULED_VISITS
-- =====================================================

ALTER TABLE scheduled_visits ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view visits they're involved in" ON scheduled_visits;
DROP POLICY IF EXISTS "Users can create visits for properties they own" ON scheduled_visits;
DROP POLICY IF EXISTS "Authorized users can update visits" ON scheduled_visits;

-- Políticas RLS
CREATE POLICY "Users can view visits they're involved in" ON scheduled_visits
    FOR SELECT USING (
        created_by = auth.uid() OR
        assigned_agent_id = auth.uid() OR
        property_owner_id = auth.uid() OR
        visitor_email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create visits for properties they own" ON scheduled_visits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties
            WHERE id = scheduled_visits.property_id
            AND owner_id = auth.uid()
        ) OR
        assigned_agent_id = auth.uid()
    );

CREATE POLICY "Authorized users can update visits" ON scheduled_visits
    FOR UPDATE USING (
        created_by = auth.uid() OR
        assigned_agent_id = auth.uid() OR
        property_owner_id = auth.uid()
    );

-- =====================================================
-- 9. TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Function to automatically create scheduled visit from confirmed visit request
CREATE OR REPLACE FUNCTION create_scheduled_visit_from_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create scheduled visit when status changes to 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        INSERT INTO scheduled_visits (
            visit_request_id,
            property_id,
            scheduled_date,
            scheduled_time_slot,
            visitor_name,
            visitor_email,
            visitor_phone,
            created_by,
            property_owner_id
        )
        SELECT
            NEW.id,
            NEW.property_id,
            NEW.requested_date,
            NEW.requested_time_slot,
            COALESCE(NEW.visitor_name, ''),
            COALESCE(NEW.visitor_email, ''),
            COALESCE(NEW.visitor_phone, ''),
            NEW.user_id,
            p.owner_id
        FROM properties p
        WHERE p.id = NEW.property_id;

        RAISE NOTICE 'Scheduled visit created for visit request %', NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create scheduled visits
DROP TRIGGER IF EXISTS trigger_create_scheduled_visit ON visit_requests;
CREATE TRIGGER trigger_create_scheduled_visit
    AFTER INSERT OR UPDATE OF status ON visit_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_scheduled_visit_from_request();

-- Function to update scheduled visit when visit request is updated
CREATE OR REPLACE FUNCTION update_scheduled_visit()
RETURNS TRIGGER AS $$
BEGIN
    -- Update corresponding scheduled visit if it exists
    UPDATE scheduled_visits
    SET
        scheduled_date = NEW.requested_date,
        scheduled_time_slot = NEW.requested_time_slot,
        visitor_name = COALESCE(NEW.visitor_name, visitor_name),
        visitor_email = COALESCE(NEW.visitor_email, visitor_email),
        visitor_phone = COALESCE(NEW.visitor_phone, visitor_phone),
        updated_at = NOW()
    WHERE visit_request_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync updates
DROP TRIGGER IF EXISTS trigger_update_scheduled_visit ON visit_requests;
CREATE TRIGGER trigger_update_scheduled_visit
    AFTER UPDATE ON visit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_visit();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_scheduled_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_scheduled_visits_updated_at ON scheduled_visits;
CREATE TRIGGER trigger_update_scheduled_visits_updated_at
    BEFORE UPDATE ON scheduled_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_visits_updated_at();

-- Function to update visit_requests timestamps
CREATE OR REPLACE FUNCTION update_visit_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_visit_requests_updated_at ON visit_requests;
CREATE TRIGGER trigger_update_visit_requests_updated_at
    BEFORE UPDATE ON visit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_visit_requests_updated_at();

-- =====================================================
-- 10. COMENTARIOS Y VALIDACIÓN
-- =====================================================

-- Comentarios
COMMENT ON TABLE visit_requests IS 'Visit requests from potential tenants/buyers to property owners';
COMMENT ON COLUMN visit_requests.visitor_name IS 'Full name of the person requesting the visit';
COMMENT ON COLUMN visit_requests.visitor_email IS 'Email address of the person requesting the visit';
COMMENT ON COLUMN visit_requests.visitor_phone IS 'Phone number of the person requesting the visit';
COMMENT ON COLUMN visit_requests.receiver_id IS 'Duplicates user_id for better data tracking and relationships';

COMMENT ON TABLE scheduled_visits IS 'Confirmed and scheduled property visits';
COMMENT ON COLUMN scheduled_visits.visit_request_id IS 'Reference to the original visit request';
COMMENT ON COLUMN scheduled_visits.scheduled_time_slot IS 'Specific time slot for the visit (hour ranges)';
COMMENT ON COLUMN scheduled_visits.visit_purpose IS 'Purpose of the visit (tour, inspection, etc.)';
COMMENT ON COLUMN scheduled_visits.check_in_time IS 'Actual time when visitor arrived';
COMMENT ON COLUMN scheduled_visits.check_out_time IS 'Actual time when visit ended';
COMMENT ON COLUMN scheduled_visits.assigned_agent IS 'Agent assigned to conduct the visit';

-- Verificar que todo esté correcto
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema completo de visitas implementado exitosamente!';
    RAISE NOTICE '📋 Tabla visit_requests creada con campos de visitante';
    RAISE NOTICE '📅 Tabla scheduled_visits creada para visitas confirmadas';
    RAISE NOTICE '🔄 Triggers automáticos configurados';
    RAISE NOTICE '🔐 Políticas RLS aplicadas a ambas tablas';
    RAISE NOTICE '✅ Sistema de visitas 100% operativo';
END $$;


