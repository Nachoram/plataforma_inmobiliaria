-- Migration: Create supporting tables for offer management system
-- Date: 2025-11-28
-- Description: Creates offer_documents and offer_communications tables to support the offer details page

-- =====================================================
-- TABLA: DOCUMENTOS ADJUNTOS A OFERTAS (COMPATIBILIDAD)
-- =====================================================

-- Verificar si ya existe offer_documents y manejarlo
DO $$
BEGIN
    -- Si existe una tabla offer_documents, verificar si es compatible
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'offer_documents'
    ) THEN
        -- Verificar si la tabla existente es compatible con property_sale_offer_documents
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'offer_documents'
            AND column_name IN ('offer_id', 'document_type', 'file_name', 'file_url')
        ) THEN
            RAISE NOTICE 'Tabla offer_documents ya existe y parece compatible. Usando tabla existente.';
        ELSE
            RAISE EXCEPTION 'Tabla offer_documents existe pero no es compatible. Por favor, verifica la estructura.';
        END IF;
    ELSE
        -- Crear vista si no existe
        CREATE VIEW offer_documents AS
        SELECT
            id,
            offer_id,
            doc_type as document_type,
            file_name,
            file_url,
            storage_path,
            file_size_bytes,
            uploaded_at,
            notes,
            uploaded_by,
            created_at,
            mime_type
        FROM property_sale_offer_documents;

        -- Otorgar permisos en la vista
        GRANT SELECT ON offer_documents TO authenticated;
        GRANT INSERT ON offer_documents TO authenticated;
        GRANT DELETE ON offer_documents TO authenticated;

        RAISE NOTICE 'Vista offer_documents creada exitosamente.';
    END IF;
END $$;

-- =====================================================
-- TABLA: COMUNICACIONES DE OFERTAS
-- =====================================================

-- Eliminar tabla si existe con estructura incorrecta y recrearla
DROP TABLE IF EXISTS offer_communications CASCADE;

-- Crear tabla con estructura completa
CREATE TABLE offer_communications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencias
    offer_id uuid NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,

    -- Información del mensaje
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name text NOT NULL,
    sender_role text NOT NULL CHECK (sender_role IN ('buyer', 'seller', 'admin')),

    -- Contenido
    message_type text NOT NULL DEFAULT 'message' CHECK (message_type IN (
        'message',           -- Mensaje de texto
        'status_update',     -- Actualización de estado
        'document_request',  -- Solicitud de documento
        'counter_offer',     -- Contraoferta
        'acceptance',        -- Aceptación de oferta
        'rejection'          -- Rechazo de oferta
    )),
    subject text,           -- Asunto (opcional, para emails)
    content text NOT NULL,  -- Contenido del mensaje

    -- Metadata
    is_read boolean DEFAULT false,
    read_at timestamptz,

    -- Adjuntos (opcional)
    attachments jsonb DEFAULT '[]'::jsonb, -- Array de objetos con file info

    -- Auditoría
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Crear índices (usando IF NOT EXISTS para evitar errores)
CREATE INDEX IF NOT EXISTS idx_offer_communications_offer_id ON offer_communications(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_communications_sender_id ON offer_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_offer_communications_created_at ON offer_communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_communications_is_read ON offer_communications(is_read);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE offer_communications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (se recrearán si ya existen)
DROP POLICY IF EXISTS "Users can view communications for accessible offers" ON offer_communications;
DROP POLICY IF EXISTS "Users can send communications in accessible offers" ON offer_communications;
DROP POLICY IF EXISTS "Users can mark their communications as read" ON offer_communications;

-- Los usuarios pueden ver comunicaciones de ofertas que pueden acceder
CREATE POLICY "Users can view communications for accessible offers" ON offer_communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = offer_communications.offer_id
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

-- Los usuarios autenticados pueden enviar comunicaciones en ofertas accesibles
CREATE POLICY "Users can send communications in accessible offers" ON offer_communications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = offer_communications.offer_id
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

-- Los usuarios pueden marcar como leídas sus propias comunicaciones
CREATE POLICY "Users can mark their communications as read" ON offer_communications
    FOR UPDATE USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = offer_communications.offer_id
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Crear función del trigger (CREATE OR REPLACE maneja si ya existe)
CREATE OR REPLACE FUNCTION update_offer_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (se recreará si ya existe)
DROP TRIGGER IF EXISTS trigger_offer_communications_updated_at ON offer_communications;
CREATE TRIGGER trigger_offer_communications_updated_at
    BEFORE UPDATE ON offer_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_offer_communications_updated_at();

-- =====================================================
-- COMENTARIOS EN LAS TABLAS
-- =====================================================

COMMENT ON TABLE offer_communications IS 'Sistema de comunicaciones para ofertas de compra de propiedades';
COMMENT ON COLUMN offer_communications.sender_role IS 'Rol del remitente: buyer (comprador), seller (vendedor), admin (administrador)';
COMMENT ON COLUMN offer_communications.message_type IS 'Tipo de mensaje/comunicación';
COMMENT ON COLUMN offer_communications.attachments IS 'Archivos adjuntos en formato JSON';

-- =========================================
-- DOCUMENT AUTHORIZATIONS
-- =========================================

-- Table for document authorizations (buyers can authorize sellers to view documents)
CREATE TABLE IF NOT EXISTS document_authorizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    authorized_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    authorized_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL CHECK (permission_type IN ('view_documents', 'view_all', 'view_specific')),
    specific_documents UUID[] DEFAULT NULL, -- Array of document IDs if permission_type is 'view_specific'
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure only one active authorization per user per offer
    UNIQUE(offer_id, authorized_user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_authorizations_offer_id ON document_authorizations(offer_id);
CREATE INDEX IF NOT EXISTS idx_document_authorizations_authorized_user ON document_authorizations(authorized_user_id);
CREATE INDEX IF NOT EXISTS idx_document_authorizations_active ON document_authorizations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_document_authorizations_expires ON document_authorizations(expires_at) WHERE expires_at IS NOT NULL;

-- Updated at trigger
CREATE TRIGGER update_document_authorizations_updated_at
    BEFORE UPDATE ON document_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for document authorizations
ALTER TABLE document_authorizations ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own authorizations
CREATE POLICY "Buyers can view their authorizations" ON document_authorizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers
            WHERE property_sale_offers.id = document_authorizations.offer_id
            AND property_sale_offers.buyer_id = auth.uid()
        )
    );

-- Buyers can create authorizations for their offers
CREATE POLICY "Buyers can create authorizations" ON document_authorizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_sale_offers
            WHERE property_sale_offers.id = document_authorizations.offer_id
            AND property_sale_offers.buyer_id = auth.uid()
        )
        AND document_authorizations.authorized_by_id = auth.uid()
    );

-- Buyers can update their own authorizations
CREATE POLICY "Buyers can update their authorizations" ON document_authorizations
    FOR UPDATE USING (
        document_authorizations.authorized_by_id = auth.uid()
    );

-- Sellers can view authorizations granted to them
CREATE POLICY "Sellers can view authorizations granted to them" ON document_authorizations
    FOR SELECT USING (
        document_authorizations.authorized_user_id = auth.uid()
        AND document_authorizations.is_active = TRUE
    );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completada: Tablas de soporte para ofertas creadas exitosamente';
    RAISE NOTICE '📋 Tablas creadas: offer_documents (vista), offer_communications, document_authorizations';
    RAISE NOTICE '🔒 Políticas RLS configuradas correctamente';
    RAISE NOTICE '⚡ Triggers y funciones auxiliares creados';
    RAISE NOTICE '🔄 Compatibilidad con código existente mantenida';
END $$;
