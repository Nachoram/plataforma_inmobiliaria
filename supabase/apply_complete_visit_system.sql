-- Sistema completo de visitas inmobiliarias
-- Ejecutar este script para crear todas las tablas necesarias

-- =====================================================
-- TABLA VISIT_REQUESTS (Solicitudes de visita)
-- =====================================================

CREATE TABLE IF NOT EXISTS visit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id),

    -- Detalles de la solicitud
    requested_date DATE NOT NULL,
    requested_time_slot TEXT NOT NULL CHECK (requested_time_slot IN ('9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19', '19-20', 'flexible')),
    message TEXT,

    -- Información del visitante
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,

    -- Estado
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA SCHEDULED_VISITS (Visitas agendadas)
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_request_id UUID REFERENCES visit_requests(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time_slot TEXT NOT NULL CHECK (scheduled_time_slot IN ('9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19', '19-20', 'flexible')),

    -- Información del visitante
    visitor_name TEXT NOT NULL,
    visitor_email TEXT NOT NULL,
    visitor_phone TEXT NOT NULL,

    -- Detalles adicionales
    visit_purpose TEXT DEFAULT 'property_visit' CHECK (visit_purpose IN ('property_visit', 'inspection', 'valuation', 'negotiation')),
    estimated_duration INTERVAL DEFAULT '1 hour',
    special_requirements TEXT,

    -- Estado y seguimiento
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    visit_notes TEXT,

    -- Asignaciones
    assigned_agent_id UUID REFERENCES auth.users(id),
    property_owner_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(property_id, scheduled_date, scheduled_time_slot)
);

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_visits ENABLE ROW LEVEL SECURITY;

-- Políticas para visit_requests
DROP POLICY IF EXISTS "Users can create visit requests" ON visit_requests;
DROP POLICY IF EXISTS "Users can read own visit requests" ON visit_requests;
DROP POLICY IF EXISTS "Property owners can read visit requests for their properties" ON visit_requests;
DROP POLICY IF EXISTS "Property owners can update visit requests for their properties" ON visit_requests;

CREATE POLICY "Users can create visit requests" ON visit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own visit requests" ON visit_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Property owners can read visit requests for their properties" ON visit_requests
    FOR SELECT USING (EXISTS (SELECT 1 FROM properties WHERE id = visit_requests.property_id AND owner_id = auth.uid()));

CREATE POLICY "Property owners can update visit requests for their properties" ON visit_requests
    FOR UPDATE USING (EXISTS (SELECT 1 FROM properties WHERE id = visit_requests.property_id AND owner_id = auth.uid()));

-- Políticas para scheduled_visits
DROP POLICY IF EXISTS "Users can view visits they're involved in" ON scheduled_visits;
DROP POLICY IF EXISTS "Users can create visits for properties they own" ON scheduled_visits;
DROP POLICY IF EXISTS "Authorized users can update visits" ON scheduled_visits;

CREATE POLICY "Users can view visits they're involved in" ON scheduled_visits
    FOR SELECT USING (
        created_by = auth.uid() OR
        assigned_agent_id = auth.uid() OR
        property_owner_id = auth.uid()
    );

CREATE POLICY "Users can create visits for properties they own" ON scheduled_visits
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE id = scheduled_visits.property_id AND owner_id = auth.uid()));

CREATE POLICY "Authorized users can update visits" ON scheduled_visits
    FOR UPDATE USING (created_by = auth.uid() OR assigned_agent_id = auth.uid() OR property_owner_id = auth.uid());

-- =====================================================
-- ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_visit_requests_property_id ON visit_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_user_id ON visit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_status ON visit_requests(status);
CREATE INDEX IF NOT EXISTS idx_visit_requests_visitor_email ON visit_requests(visitor_email);

CREATE INDEX IF NOT EXISTS idx_scheduled_visits_property_date ON scheduled_visits(property_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_status ON scheduled_visits(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_visit_request ON scheduled_visits(visit_request_id);

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para mantener receiver_id sincronizado
CREATE OR REPLACE FUNCTION maintain_visit_requests_receiver_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.receiver_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maintain_visit_requests_receiver_id ON visit_requests;
CREATE TRIGGER trigger_maintain_visit_requests_receiver_id
    BEFORE INSERT OR UPDATE ON visit_requests
    FOR EACH ROW
    EXECUTE FUNCTION maintain_visit_requests_receiver_id();

-- Trigger para crear visitas agendadas automáticamente
CREATE OR REPLACE FUNCTION create_scheduled_visit_from_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        INSERT INTO scheduled_visits (
            visit_request_id, property_id, scheduled_date, scheduled_time_slot,
            visitor_name, visitor_email, visitor_phone, created_by, property_owner_id
        )
        SELECT
            NEW.id, NEW.property_id, NEW.requested_date, NEW.requested_time_slot,
            COALESCE(NEW.visitor_name, ''), COALESCE(NEW.visitor_email, ''), COALESCE(NEW.visitor_phone, ''),
            NEW.user_id, p.owner_id
        FROM properties p WHERE p.id = NEW.property_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_scheduled_visit ON visit_requests;
CREATE TRIGGER trigger_create_scheduled_visit
    AFTER INSERT OR UPDATE OF status ON visit_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_scheduled_visit_from_request();

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_visit_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_scheduled_visits_updated_at()
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

DROP TRIGGER IF EXISTS trigger_update_scheduled_visits_updated_at ON scheduled_visits;
CREATE TRIGGER trigger_update_scheduled_visits_updated_at
    BEFORE UPDATE ON scheduled_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_visits_updated_at();

-- =====================================================
-- VALIDACIONES
-- =====================================================

ALTER TABLE visit_requests DROP CONSTRAINT IF EXISTS check_visitor_email_format;
ALTER TABLE visit_requests ADD CONSTRAINT check_visitor_email_format
CHECK (visitor_email IS NULL OR visitor_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE visit_requests DROP CONSTRAINT IF EXISTS check_visitor_phone_format;
ALTER TABLE visit_requests ADD CONSTRAINT check_visitor_phone_format
CHECK (visitor_phone IS NULL OR visitor_phone ~ '^[0-9+\-\s()]+$');

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Sistema completo de visitas inmobiliarias implementado!';
    RAISE NOTICE '✅ Tabla visit_requests creada con campos de visitante';
    RAISE NOTICE '✅ Tabla scheduled_visits creada para visitas confirmadas';
    RAISE NOTICE '🔄 Triggers automáticos configurados';
    RAISE NOTICE '🔐 Políticas RLS aplicadas';
    RAISE NOTICE '📊 Índices de performance creados';
END $$;


