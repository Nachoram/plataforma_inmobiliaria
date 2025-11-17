-- Migration: Create sale_owner_documents table for owner-specific documents
-- Date: 2025-11-13
-- Description: Creates a dedicated table for storing documents specific to each sale owner

-- =====================================================
-- VERIFICACIÓN DE PREREQUISITOS
-- =====================================================

DO $$
BEGIN
    -- Verificar que exista la tabla sale_owners
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sale_owners'
    ) THEN
        RAISE EXCEPTION 'La tabla sale_owners no existe. Verifica que las migraciones de propietarios estén aplicadas.';
    END IF;

    RAISE NOTICE 'Prerequisitos verificados correctamente ✓';
END $$;

-- =====================================================
-- TABLA: DOCUMENTOS DE PROPIETARIOS DE VENTA
-- =====================================================

CREATE TABLE IF NOT EXISTS sale_owner_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_owner_id uuid NOT NULL REFERENCES sale_owners(id) ON DELETE CASCADE,
    doc_type text NOT NULL,                        -- Tipo de documento según propietario
    file_name text,                                 -- Nombre original del archivo
    file_url text NOT NULL,                         -- URL pública del archivo en storage
    storage_path text,                              -- Path completo en Supabase Storage
    file_size_bytes bigint,                         -- Tamaño del archivo en bytes
    mime_type text,                                 -- Tipo MIME del archivo (application/pdf, image/jpeg, etc.)
    uploaded_by uuid REFERENCES auth.users(id),     -- Usuario que subió el documento
    uploaded_at timestamptz NOT NULL DEFAULT now(), -- Fecha de subida
    notes text,                                     -- Notas adicionales sobre el documento

    -- Auditoría
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Restricciones
    CONSTRAINT valid_owner_doc_type CHECK (doc_type IN (
        'cedula_identidad',           -- Cédula de identidad (persona natural)
        'constitucion_sociedad',      -- Escritura de constitución de la sociedad
        'poder_representante',        -- Poder del representante legal
        'cedula_representante'        -- Cédula del representante legal
    ))
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sale_owner_documents_sale_owner_id
    ON sale_owner_documents(sale_owner_id);

CREATE INDEX IF NOT EXISTS idx_sale_owner_documents_doc_type
    ON sale_owner_documents(doc_type);

CREATE INDEX IF NOT EXISTS idx_sale_owner_documents_uploaded_at
    ON sale_owner_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_owner_documents_uploaded_by
    ON sale_owner_documents(uploaded_by);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE sale_owner_documents ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver documentos de propietarios de sus propiedades
CREATE POLICY "Users can view sale owner documents for their properties" ON sale_owner_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sale_owners so
            JOIN property_sale_owners pso ON so.id = pso.sale_owner_id
            JOIN properties p ON pso.property_id = p.id
            WHERE sale_owner_documents.sale_owner_id = so.id
            AND (
                p.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
            )
        )
    );

-- Política para que los usuarios puedan insertar documentos en propietarios de sus propiedades
CREATE POLICY "Users can insert sale owner documents for their properties" ON sale_owner_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sale_owners so
            JOIN property_sale_owners pso ON so.id = pso.sale_owner_id
            JOIN properties p ON pso.property_id = p.id
            WHERE sale_owner_documents.sale_owner_id = so.id
            AND (
                p.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
            )
        )
    );

-- Política para que los usuarios puedan actualizar documentos que han subido
CREATE POLICY "Users can update their own sale owner documents" ON sale_owner_documents
    FOR UPDATE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Política para que los usuarios puedan eliminar documentos que han subido
CREATE POLICY "Users can delete their own sale owner documents" ON sale_owner_documents
    FOR DELETE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_sale_owner_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sale_owner_documents_updated_at
    BEFORE UPDATE ON sale_owner_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_sale_owner_documents_updated_at();

-- =====================================================
-- COMENTARIOS EN LA TABLA
-- =====================================================

COMMENT ON TABLE sale_owner_documents IS 'Documentos específicos de cada propietario en ventas de propiedades';
COMMENT ON COLUMN sale_owner_documents.doc_type IS 'Tipo de documento requerido según el tipo de propietario';
COMMENT ON COLUMN sale_owner_documents.sale_owner_id IS 'Referencia al propietario específico';
COMMENT ON COLUMN sale_owner_documents.file_url IS 'URL pública del documento en Supabase Storage';

