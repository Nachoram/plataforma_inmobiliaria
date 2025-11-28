-- =========================================
-- MANUAL MIGRATION: DOCUMENT AUTHORIZATIONS
-- =========================================
-- Ejecutar este script manualmente en el SQL Editor de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql

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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_authorizations_updated_at
    BEFORE UPDATE ON document_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for document authorizations
ALTER TABLE document_authorizations ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own authorizations
DROP POLICY IF EXISTS "Buyers can view their authorizations" ON document_authorizations;
CREATE POLICY "Buyers can view their authorizations" ON document_authorizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers
            WHERE property_sale_offers.id = document_authorizations.offer_id
            AND property_sale_offers.buyer_id = auth.uid()
        )
    );

-- Buyers can create authorizations for their offers
DROP POLICY IF EXISTS "Buyers can create authorizations" ON document_authorizations;
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
DROP POLICY IF EXISTS "Buyers can update their authorizations" ON document_authorizations;
CREATE POLICY "Buyers can update their authorizations" ON document_authorizations
    FOR UPDATE USING (
        document_authorizations.authorized_by_id = auth.uid()
    );

-- Sellers can view authorizations granted to them
DROP POLICY IF EXISTS "Sellers can view authorizations granted to them" ON document_authorizations;
CREATE POLICY "Sellers can view authorizations granted to them" ON document_authorizations
    FOR SELECT USING (
        document_authorizations.authorized_user_id = auth.uid()
        AND document_authorizations.is_active = TRUE
    );

-- =========================================
-- SUCCESS MESSAGE
-- =========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración manual completada exitosamente';
    RAISE NOTICE '📋 Tabla creada: document_authorizations';
    RAISE NOTICE '🔒 Políticas RLS configuradas correctamente';
    RAISE NOTICE '⚡ Triggers e índices creados';
    RAISE NOTICE '🔄 Sistema de autorizaciones de documentos listo para usar';
END $$;



