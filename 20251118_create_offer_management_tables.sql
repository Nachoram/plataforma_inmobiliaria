-- ========================================================================
-- MIGRACIÓN: SISTEMA COMPLETO DE GESTIÓN DE OFERTAS DE COMPRAVENTA
-- Fecha: 18 de noviembre de 2025
-- Descripción: Crea todas las tablas necesarias para la gestión completa de ofertas
-- ========================================================================

-- ========================================================================
-- TABLA DE TAREAS/SOLICITUDES
-- ========================================================================

CREATE TABLE IF NOT EXISTS offer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    task_type VARCHAR NOT NULL CHECK (task_type IN ('evaluó_comercial', 'estudio_titulo', 'promesa_compraventa', 'inspección_precompra', 'documentación', 'modificación_título')),
    status VARCHAR NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'completada', 'rechazada')),
    description TEXT,
    priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('baja', 'normal', 'alta', 'urgente')),
    assigned_to UUID REFERENCES auth.users(id),
    assigned_by UUID REFERENCES auth.users(id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- TABLA DE DOCUMENTOS DE OFERTA
-- ========================================================================

CREATE TABLE IF NOT EXISTS offer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    document_name VARCHAR NOT NULL,
    document_type VARCHAR NOT NULL CHECK (document_type IN ('cedula', 'comprobante_ingresos', 'certificado_dominio', 'boleta_agua', 'boleta_luz', 'boleta_gas', 'contrato_arriendo', 'declaracion_renta', 'certificado_matrimonio', 'poder_notarial', 'otro')),
    file_url VARCHAR NOT NULL,
    file_size INTEGER,
    file_type VARCHAR,
    status VARCHAR DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'recibido', 'validado', 'rechazado')),
    notes TEXT,
    validated_by UUID REFERENCES auth.users(id),
    requested_by UUID REFERENCES auth.users(id),
    is_required BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    expires_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- TABLA DE TIMELINE/HISTORIAL
-- ========================================================================

CREATE TABLE IF NOT EXISTS offer_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    event_type VARCHAR NOT NULL,
    event_title VARCHAR NOT NULL,
    event_description TEXT,
    triggered_by UUID NOT NULL REFERENCES auth.users(id),
    triggered_by_name VARCHAR,
    triggered_by_role VARCHAR CHECK (triggered_by_role IN ('seller', 'buyer', 'admin')),
    related_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- TABLA DE SOLICITUDES FORMALES
-- ========================================================================

CREATE TABLE IF NOT EXISTS offer_formal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    request_type VARCHAR NOT NULL CHECK (request_type IN ('promesa_compraventa', 'modificación_título', 'inspección_precompra', 'información_adicional')),
    request_title VARCHAR NOT NULL,
    request_description TEXT,
    required_documents TEXT[],
    status VARCHAR NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'recibida', 'en_proceso', 'completada', 'rechazada')),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    requested_to UUID NOT NULL REFERENCES auth.users(id),
    response_text TEXT,
    response_documents UUID[],
    responded_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- TABLA DE COMUNICACIÓN/NOTAS
-- ========================================================================

CREATE TABLE IF NOT EXISTS offer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR CHECK (message_type IN ('nota_interna', 'comunicación', 'seguimiento')),
    author_id UUID NOT NULL REFERENCES auth.users(id),
    author_name VARCHAR,
    author_role VARCHAR CHECK (author_role IN ('seller', 'buyer', 'admin')),
    is_private BOOLEAN DEFAULT FALSE,
    visible_to_buyer BOOLEAN DEFAULT TRUE,
    attachment_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- ========================================================================

-- Índices para offer_tasks
CREATE INDEX IF NOT EXISTS idx_offer_tasks_offer_id ON offer_tasks(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_tasks_status ON offer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_offer_tasks_assigned_to ON offer_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_offer_tasks_due_date ON offer_tasks(due_date);

-- Índices para offer_documents
CREATE INDEX IF NOT EXISTS idx_offer_documents_offer_id ON offer_documents(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_documents_status ON offer_documents(status);
CREATE INDEX IF NOT EXISTS idx_offer_documents_type ON offer_documents(document_type);

-- Índices para offer_timeline
CREATE INDEX IF NOT EXISTS idx_offer_timeline_offer_id ON offer_timeline(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_timeline_created_at ON offer_timeline(created_at);
CREATE INDEX IF NOT EXISTS idx_offer_timeline_triggered_by ON offer_timeline(triggered_by);

-- Índices para offer_formal_requests
CREATE INDEX IF NOT EXISTS idx_offer_formal_requests_offer_id ON offer_formal_requests(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_formal_requests_status ON offer_formal_requests(status);
CREATE INDEX IF NOT EXISTS idx_offer_formal_requests_requested_by ON offer_formal_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_offer_formal_requests_requested_to ON offer_formal_requests(requested_to);

-- Índices para offer_communications
CREATE INDEX IF NOT EXISTS idx_offer_communications_offer_id ON offer_communications(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_communications_author_id ON offer_communications(author_id);
CREATE INDEX IF NOT EXISTS idx_offer_communications_created_at ON offer_communications(created_at);

-- ========================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE offer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_formal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_communications ENABLE ROW LEVEL SECURITY;

-- Políticas para offer_tasks
-- Los usuarios pueden ver tareas de ofertas donde son compradores o vendedores
CREATE POLICY "Users can view tasks for their offers" ON offer_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_tasks.offer_id
            AND (pso.buyer_id = auth.uid() OR pso.property_id IN (
                SELECT id FROM properties WHERE owner_id = auth.uid()
            ))
        )
    );

-- Solo administradores pueden modificar tareas
CREATE POLICY "Admins can manage tasks" ON offer_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para offer_documents
CREATE POLICY "Users can view documents for their offers" ON offer_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_documents.offer_id
            AND (pso.buyer_id = auth.uid() OR pso.property_id IN (
                SELECT id FROM properties WHERE owner_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can insert their own documents" ON offer_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_documents.offer_id
            AND pso.buyer_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage documents" ON offer_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para offer_timeline
CREATE POLICY "Users can view timeline for their offers" ON offer_timeline
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_timeline.offer_id
            AND (pso.buyer_id = auth.uid() OR pso.property_id IN (
                SELECT id FROM properties WHERE owner_id = auth.uid()
            ))
        )
    );

CREATE POLICY "System can insert timeline events" ON offer_timeline
    FOR INSERT WITH CHECK (true);

-- Políticas para offer_formal_requests
CREATE POLICY "Users can view formal requests for their offers" ON offer_formal_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_formal_requests.offer_id
            AND (pso.buyer_id = auth.uid() OR pso.property_id IN (
                SELECT id FROM properties WHERE owner_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can create formal requests for their offers" ON offer_formal_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_formal_requests.offer_id
            AND (pso.buyer_id = auth.uid() OR pso.property_id IN (
                SELECT id FROM properties WHERE owner_id = auth.uid()
            ))
        )
    );

-- Políticas para offer_communications
CREATE POLICY "Users can view communications for their offers" ON offer_communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_communications.offer_id
            AND (pso.buyer_id = auth.uid() OR pso.property_id IN (
                SELECT id FROM properties WHERE owner_id = auth.uid()
            ))
        ) AND (
            visible_to_buyer = true OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'seller'))
        )
    );

CREATE POLICY "Users can create communications for their offers" ON offer_communications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_sale_offers pso
            WHERE pso.id = offer_communications.offer_id
            AND (pso.buyer_id = auth.uid() OR pso.property_id IN (
                SELECT id FROM properties WHERE owner_id = auth.uid()
            ))
        )
    );

-- ========================================================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_offer_tasks_updated_at BEFORE UPDATE ON offer_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offer_documents_updated_at BEFORE UPDATE ON offer_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offer_formal_requests_updated_at BEFORE UPDATE ON offer_formal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offer_communications_updated_at BEFORE UPDATE ON offer_communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- DATOS INICIALES DE EJEMPLO
-- ========================================================================

-- Insertar algunos tipos de documentos comunes (esto se puede hacer desde la aplicación)
-- Estos son solo ejemplos y pueden ser eliminados en producción

-- Nota: Los datos iniciales se insertarán desde la aplicación cuando sea necesario
