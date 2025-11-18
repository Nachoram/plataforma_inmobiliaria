-- Migration: Extend property_sale_offers to support persona natural/juridica and bank executives
-- Date: 2025-11-15
-- Description: Adds fields to distinguish between natural and juridical persons, and creates table for bank executives
-- Version: FIXED - Handles existing policies

-- =====================================================
-- ENUM: TIPO DE OFERTANTE
-- =====================================================

DO $$ BEGIN
    CREATE TYPE offer_entity_type AS ENUM ('natural', 'juridica');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- EXTEND: property_sale_offers - Agregar campos para persona natural/jurídica
-- =====================================================

DO $$
BEGIN
    -- Tipo de persona
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN entity_type offer_entity_type DEFAULT 'natural';
    END IF;

    -- Persona Natural - Apellidos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'buyer_lastname'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN buyer_lastname text;
    END IF;

    -- RUT o Documento de Identidad
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'buyer_rut'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN buyer_rut text;
    END IF;

    -- Persona Jurídica - Razón social
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'company_name'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN company_name text;
    END IF;

    -- Persona Jurídica - RUT empresa
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'company_rut'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN company_rut text;
    END IF;

    -- Persona Jurídica - Nombre representante legal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'legal_representative_name'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN legal_representative_name text;
    END IF;

    -- Persona Jurídica - RUT representante legal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'legal_representative_rut'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN legal_representative_rut text;
    END IF;

    -- Financiamiento - ¿Tiene crédito preaprobado?
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'has_preapproved_credit'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN has_preapproved_credit boolean DEFAULT false;
    END IF;

    -- Financiamiento - URL comprobante crédito
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'credit_proof_url'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN credit_proof_url text;
    END IF;

    -- ¿Tiene ejecutivo bancario?
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_sale_offers' AND column_name = 'has_bank_executive'
    ) THEN
        ALTER TABLE property_sale_offers ADD COLUMN has_bank_executive boolean DEFAULT false;
    END IF;

    RAISE NOTICE '✅ Columnas agregadas a property_sale_offers';
END $$;

-- =====================================================
-- TABLA: EJECUTIVOS BANCARIOS ASOCIADOS A OFERTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS offer_bank_executives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id uuid NOT NULL REFERENCES property_sale_offers(id) ON DELETE CASCADE,
    
    -- Datos del ejecutivo
    name text NOT NULL,
    email text NOT NULL,
    banco text NOT NULL,
    phone text,
    
    -- Auditoría
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Restricciones
    CONSTRAINT valid_executive_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_offer_bank_executives_offer_id
    ON offer_bank_executives(offer_id);

CREATE INDEX IF NOT EXISTS idx_offer_bank_executives_banco
    ON offer_bank_executives(banco);

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

ALTER TABLE offer_bank_executives ENABLE ROW LEVEL SECURITY;

-- ELIMINAR POLÍTICAS EXISTENTES SI EXISTEN
DROP POLICY IF EXISTS "Buyers can view executives of their offers" ON offer_bank_executives;
DROP POLICY IF EXISTS "Sellers can view executives of offers on their properties" ON offer_bank_executives;
DROP POLICY IF EXISTS "Buyers can insert executives in their offers" ON offer_bank_executives;
DROP POLICY IF EXISTS "Buyers can update executives of their offers" ON offer_bank_executives;
DROP POLICY IF EXISTS "Buyers can delete executives of their offers" ON offer_bank_executives;

-- CREAR POLÍTICAS
-- Los compradores pueden ver los ejecutivos de sus ofertas
CREATE POLICY "Buyers can view executives of their offers" ON offer_bank_executives
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = offer_bank_executives.offer_id
            AND o.buyer_id = auth.uid()
        )
    );

-- Los vendedores pueden ver ejecutivos de ofertas en sus propiedades
CREATE POLICY "Sellers can view executives of offers on their properties" ON offer_bank_executives
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            JOIN properties p ON o.property_id = p.id
            WHERE o.id = offer_bank_executives.offer_id
            AND p.owner_id = auth.uid()
        )
    );

-- Los compradores pueden insertar ejecutivos en sus ofertas
CREATE POLICY "Buyers can insert executives in their offers" ON offer_bank_executives
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = offer_bank_executives.offer_id
            AND o.buyer_id = auth.uid()
        )
    );

-- Los compradores pueden actualizar ejecutivos de sus ofertas
CREATE POLICY "Buyers can update executives of their offers" ON offer_bank_executives
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = offer_bank_executives.offer_id
            AND o.buyer_id = auth.uid()
        )
    );

-- Los compradores pueden eliminar ejecutivos de sus ofertas
CREATE POLICY "Buyers can delete executives of their offers" ON offer_bank_executives
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM property_sale_offers o
            WHERE o.id = offer_bank_executives.offer_id
            AND o.buyer_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_offer_bank_executives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_offer_bank_executives_updated_at ON offer_bank_executives;

CREATE TRIGGER trigger_offer_bank_executives_updated_at
    BEFORE UPDATE ON offer_bank_executives
    FOR EACH ROW
    EXECUTE FUNCTION update_offer_bank_executives_updated_at();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE offer_bank_executives IS 'Ejecutivos bancarios asociados a ofertas de compra';
COMMENT ON COLUMN offer_bank_executives.offer_id IS 'Referencia a la oferta de compra';
COMMENT ON COLUMN offer_bank_executives.banco IS 'Nombre del banco del ejecutivo';

-- =====================================================
-- FUNCIÓN: Obtener ofertas con ejecutivos
-- =====================================================

CREATE OR REPLACE FUNCTION get_offer_with_executives(p_offer_id uuid)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'offer', row_to_json(o.*),
        'executives', COALESCE(
            (
                SELECT json_agg(row_to_json(e.*))
                FROM offer_bank_executives e
                WHERE e.offer_id = p_offer_id
            ),
            '[]'::json
        )
    )
    INTO result
    FROM property_sale_offers o
    WHERE o.id = p_offer_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completada: Sistema de ofertas extendido con tipos de persona y ejecutivos bancarios';
    RAISE NOTICE '📋 Tabla creada: offer_bank_executives';
    RAISE NOTICE '📝 Campos agregados a property_sale_offers para persona natural/jurídica';
    RAISE NOTICE '🔒 Políticas RLS configuradas correctamente';
END $$;




