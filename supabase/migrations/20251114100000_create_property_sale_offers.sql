-- Migration: Create property_sale_offers table for managing sale offers
-- Date: 2025-11-14
-- Description: Creates a comprehensive system for managing offers on properties for sale

-- =====================================================
-- VERIFICACIÓN DE PREREQUISITOS
-- =====================================================

DO $$
BEGIN
    -- Verificar que exista la tabla properties
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'properties'
    ) THEN
        RAISE EXCEPTION 'La tabla properties no existe. Verifica que las migraciones básicas estén aplicadas.';
    END IF;

    RAISE NOTICE 'Prerequisitos verificados correctamente ✓';
END $$;

-- =====================================================
-- ENUM: ESTADO DE OFERTAS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM (
        'pendiente',           -- Oferta recibida, en revisión
        'en_revision',         -- Vendedor está revisando la oferta
        'info_solicitada',     -- Vendedor solicitó más información
        'aceptada',            -- Oferta aceptada por el vendedor
        'rechazada',           -- Oferta rechazada
        'contraoferta',        -- Vendedor hizo una contraoferta
        'estudio_titulo',      -- Iniciando estudio de título
        'finalizada'           -- Proceso completado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLA: OFERTAS DE COMPRA PARA PROPIEDADES EN VENTA
-- =====================================================

CREATE TABLE IF NOT EXISTS property_sale_offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencias
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información del ofertante
    buyer_name text NOT NULL,
    buyer_email text NOT NULL,
    buyer_phone text,
    
    -- Detalles de la oferta
    offer_amount bigint NOT NULL,                    -- Monto ofertado en CLP
    offer_amount_currency text DEFAULT 'CLP' CHECK (offer_amount_currency IN ('CLP', 'UF')),
    financing_type text,                             -- Tipo de financiamiento (contado, crédito hipotecario, mixto)
    message text,                                    -- Mensaje del comprador
    
    -- Solicitudes especiales
    requests_title_study boolean DEFAULT false,      -- ¿Solicita estudio de título?
    requests_property_inspection boolean DEFAULT false, -- ¿Solicita inspección?
    
    -- Estado y seguimiento
    status offer_status DEFAULT 'pendiente',
    seller_response text,                            -- Respuesta del vendedor
    seller_notes text,                               -- Notas internas del vendedor
    
    -- Contraofertas
    counter_offer_amount bigint,                     -- Monto de contraoferta del vendedor
    counter_offer_terms text,                        -- Términos de la contraoferta
    
    -- Auditoría
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    responded_at timestamptz,                        -- Fecha de respuesta del vendedor
    
    -- Restricciones
    CONSTRAINT valid_offer_amount CHECK (offer_amount > 0),
    CONSTRAINT valid_counter_offer CHECK (counter_offer_amount IS NULL OR counter_offer_amount > 0)
);

-- =====================================================
-- TABLA: DOCUMENTOS ADJUNTOS A OFERTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS property_sale_offer_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id uuid NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    
    -- Información del documento
    doc_type text NOT NULL,                          -- Tipo de documento
    file_name text NOT NULL,
    file_url text NOT NULL,
    storage_path text NOT NULL,
    file_size_bytes bigint,
    mime_type text,
    
    -- Metadata
    uploaded_by uuid REFERENCES auth.users(id),
    uploaded_at timestamptz DEFAULT now(),
    notes text,
    
    -- Auditoría
    created_at timestamptz DEFAULT now(),
    
    -- Restricciones
    CONSTRAINT valid_offer_doc_type CHECK (doc_type IN (
        'promesa_compra',                -- Promesa de compra
        'carta_intencion',               -- Carta de intención
        'respaldo_bancario',             -- Certificado bancario o respaldo financiero
        'pre_aprobacion_credito',        -- Pre-aprobación de crédito hipotecario
        'cedula_identidad',              -- Cédula de identidad del comprador
        'declaracion_impuestos',         -- Declaración de impuestos
        'certificado_laboral',           -- Certificado laboral
        'otro'                           -- Otro tipo de documento
    ))
);

-- =====================================================
-- TABLA: HISTORIAL DE CAMBIOS EN OFERTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS property_sale_offer_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id uuid NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    
    -- Cambio registrado
    action text NOT NULL,                            -- Acción realizada
    old_status offer_status,
    new_status offer_status,
    changed_by uuid REFERENCES auth.users(id),
    change_notes text,
    
    -- Auditoría
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Ofertas
CREATE INDEX IF NOT EXISTS idx_property_sale_offers_property_id
    ON property_sale_offers(property_id);

CREATE INDEX IF NOT EXISTS idx_property_sale_offers_buyer_id
    ON property_sale_offers(buyer_id);

CREATE INDEX IF NOT EXISTS idx_property_sale_offers_status
    ON property_sale_offers(status);

CREATE INDEX IF NOT EXISTS idx_property_sale_offers_created_at
    ON property_sale_offers(created_at DESC);

-- Documentos de ofertas
CREATE INDEX IF NOT EXISTS idx_sale_offer_documents_offer_id
    ON property_sale_offer_documents(offer_id);

CREATE INDEX IF NOT EXISTS idx_sale_offer_documents_doc_type
    ON property_sale_offer_documents(doc_type);

-- Historial
CREATE INDEX IF NOT EXISTS idx_sale_offer_history_offer_id
    ON property_sale_offer_history(offer_id);

CREATE INDEX IF NOT EXISTS idx_sale_offer_history_created_at
    ON property_sale_offer_history(created_at DESC);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE property_sale_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sale_offer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sale_offer_history ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS PARA property_sale_offers =====

-- Los compradores pueden ver sus propias ofertas
CREATE POLICY "Buyers can view their own offers" ON property_sale_offers
    FOR SELECT USING (buyer_id = auth.uid());

-- Los vendedores pueden ver ofertas en sus propiedades
CREATE POLICY "Sellers can view offers on their properties" ON property_sale_offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_sale_offers.property_id
            AND p.owner_id = auth.uid()
        )
    );

-- Los compradores autenticados pueden crear ofertas
CREATE POLICY "Authenticated users can create offers" ON property_sale_offers
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND buyer_id = auth.uid()
    );

-- Los compradores pueden actualizar sus propias ofertas (solo si están pendientes)
CREATE POLICY "Buyers can update their pending offers" ON property_sale_offers
    FOR UPDATE USING (
        buyer_id = auth.uid()
        AND status = 'pendiente'
    );

-- Los vendedores pueden actualizar ofertas en sus propiedades
CREATE POLICY "Sellers can update offers on their properties" ON property_sale_offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_sale_offers.property_id
            AND p.owner_id = auth.uid()
        )
    );

-- ===== POLÍTICAS PARA property_sale_offer_documents =====

-- Los usuarios pueden ver documentos de ofertas que pueden ver
CREATE POLICY "Users can view documents for accessible offers" ON property_sale_offer_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = property_sale_offer_documents.offer_id
            AND (
                o.buyer_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM properties p
                    WHERE p.id = o.property_id
                    AND p.owner_id = auth.uid()
                )
            )
        )
    );

-- Los compradores pueden insertar documentos en sus ofertas
CREATE POLICY "Buyers can insert documents in their offers" ON property_sale_offer_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = property_sale_offer_documents.offer_id
            AND o.buyer_id = auth.uid()
        )
    );

-- Los vendedores pueden insertar documentos en ofertas de sus propiedades
CREATE POLICY "Sellers can insert documents in property offers" ON property_sale_offer_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            JOIN properties p ON o.property_id = p.id
            WHERE o.id = property_sale_offer_documents.offer_id
            AND p.owner_id = auth.uid()
        )
    );

-- Los usuarios pueden eliminar sus propios documentos
CREATE POLICY "Users can delete their own documents" ON property_sale_offer_documents
    FOR DELETE USING (uploaded_by = auth.uid());

-- ===== POLÍTICAS PARA property_sale_offer_history =====

-- Los usuarios pueden ver el historial de ofertas accesibles
CREATE POLICY "Users can view history for accessible offers" ON property_sale_offer_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = property_sale_offer_history.offer_id
            AND (
                o.buyer_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM properties p
                    WHERE p.id = o.property_id
                    AND p.owner_id = auth.uid()
                )
            )
        )
    );

-- El sistema puede insertar en el historial (trigger)
CREATE POLICY "System can insert history" ON property_sale_offer_history
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en ofertas
CREATE OR REPLACE FUNCTION update_property_sale_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_property_sale_offers_updated_at
    BEFORE UPDATE ON property_sale_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_property_sale_offers_updated_at();

-- Trigger para registrar cambios de estado en el historial
CREATE OR REPLACE FUNCTION log_property_sale_offer_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO property_sale_offer_history (
            offer_id,
            action,
            old_status,
            new_status,
            changed_by,
            change_notes
        ) VALUES (
            NEW.id,
            'status_change',
            OLD.status,
            NEW.status,
            auth.uid(),
            COALESCE(NEW.seller_notes, 'Estado actualizado')
        );
        
        -- Actualizar responded_at si es la primera respuesta del vendedor
        IF OLD.status = 'pendiente' AND NEW.status != 'pendiente' THEN
            NEW.responded_at = now();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_sale_offer_status_change
    AFTER UPDATE ON property_sale_offers
    FOR EACH ROW
    EXECUTE FUNCTION log_property_sale_offer_status_change();

-- =====================================================
-- COMENTARIOS EN LAS TABLAS
-- =====================================================

COMMENT ON TABLE property_sale_offers IS 'Ofertas de compra realizadas por interesados en propiedades en venta';
COMMENT ON COLUMN property_sale_offers.offer_amount IS 'Monto ofertado por el comprador en CLP';
COMMENT ON COLUMN property_sale_offers.requests_title_study IS 'Indica si el comprador solicita estudio de título';
COMMENT ON COLUMN property_sale_offers.status IS 'Estado actual de la oferta';

COMMENT ON TABLE property_sale_offer_documents IS 'Documentos adjuntos a las ofertas de compra';
COMMENT ON TABLE property_sale_offer_history IS 'Historial de cambios en ofertas de compra';

-- =====================================================
-- FUNCIÓN AUXILIAR: Obtener ofertas de una propiedad
-- =====================================================

CREATE OR REPLACE FUNCTION get_property_sale_offers(p_property_id uuid)
RETURNS TABLE (
    offer_id uuid,
    buyer_name text,
    buyer_email text,
    buyer_phone text,
    offer_amount bigint,
    offer_amount_currency text,
    status offer_status,
    requests_title_study boolean,
    message text,
    created_at timestamptz,
    document_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.buyer_name,
        o.buyer_email,
        o.buyer_phone,
        o.offer_amount,
        o.offer_amount_currency,
        o.status,
        o.requests_title_study,
        o.message,
        o.created_at,
        COUNT(d.id) as document_count
    FROM property_sale_offers o
    LEFT JOIN property_sale_offer_documents d ON o.id = d.offer_id
    WHERE o.property_id = p_property_id
    GROUP BY o.id, o.buyer_name, o.buyer_email, o.buyer_phone, 
             o.offer_amount, o.offer_amount_currency, o.status, 
             o.requests_title_study, o.message, o.created_at
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completada: Sistema de ofertas para propiedades en venta creado exitosamente';
    RAISE NOTICE '📋 Tablas creadas: property_sale_offers, property_sale_offer_documents, property_sale_offer_history';
    RAISE NOTICE '🔒 Políticas RLS configuradas correctamente';
    RAISE NOTICE '⚡ Triggers y funciones auxiliares creados';
END $$;

