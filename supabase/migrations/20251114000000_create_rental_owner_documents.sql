-- Migration: Create rental_owner_documents table for rental owner-specific documents
-- Date: 2025-11-14
-- Description: Creates a dedicated table for storing documents specific to each rental owner
-- PREREQUISITE: Requires rental_owners table to exist

-- =====================================================
-- VERIFICACIÓN DE PREREQUISITOS
-- =====================================================

DO $$
BEGIN
    -- Verificar que exista la tabla rental_owners
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'rental_owners'
    ) THEN
        RAISE EXCEPTION 'La tabla rental_owners no existe. Verifica que las migraciones de propietarios de alquiler estén aplicadas.';
    END IF;

    RAISE NOTICE 'Prerequisitos verificados correctamente ✓';
END $$;

-- =====================================================
-- TABLA: DOCUMENTOS DE PROPIETARIOS DE ALQUILER
-- =====================================================

CREATE TABLE IF NOT EXISTS rental_owner_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_owner_id uuid NOT NULL REFERENCES rental_owners(id) ON DELETE CASCADE,
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
    CONSTRAINT valid_rental_owner_doc_type CHECK (doc_type IN (
        'cedula_identidad',           -- Cédula de identidad (persona natural)
        'constitucion_sociedad',      -- Escritura de constitución de la sociedad
        'poder_representante',        -- Poder del representante legal
        'cedula_representante'        -- Cédula del representante legal
    ))
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rental_owner_documents_rental_owner_id
    ON rental_owner_documents(rental_owner_id);

CREATE INDEX IF NOT EXISTS idx_rental_owner_documents_doc_type
    ON rental_owner_documents(doc_type);

CREATE INDEX IF NOT EXISTS idx_rental_owner_documents_uploaded_at
    ON rental_owner_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_rental_owner_documents_uploaded_by
    ON rental_owner_documents(uploaded_by);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE rental_owner_documents ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver documentos de propietarios de sus propiedades
CREATE POLICY "Users can view rental owner documents for their properties" ON rental_owner_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rental_owners ro
            JOIN property_rental_owners pro ON ro.id = pro.rental_owner_id
            JOIN properties p ON pro.property_id = p.id
            WHERE rental_owner_documents.rental_owner_id = ro.id
            AND (
                p.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
            )
        )
    );

-- Política para que los usuarios puedan insertar documentos en propietarios de sus propiedades
CREATE POLICY "Users can insert rental owner documents for their properties" ON rental_owner_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM rental_owners ro
            JOIN property_rental_owners pro ON ro.id = pro.rental_owner_id
            JOIN properties p ON pro.property_id = p.id
            WHERE rental_owner_documents.rental_owner_id = ro.id
            AND (
                p.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
            )
        )
    );

-- Política para que los usuarios puedan actualizar documentos que han subido
CREATE POLICY "Users can update their own rental owner documents" ON rental_owner_documents
    FOR UPDATE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Política para que los usuarios puedan eliminar documentos que han subido
CREATE POLICY "Users can delete their own rental owner documents" ON rental_owner_documents
    FOR DELETE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_rental_owner_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rental_owner_documents_updated_at
    BEFORE UPDATE ON rental_owner_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_rental_owner_documents_updated_at();

-- =====================================================
-- COMENTARIOS EN LA TABLA
-- =====================================================

COMMENT ON TABLE rental_owner_documents IS 'Documentos específicos de cada propietario en alquileres de propiedades';
COMMENT ON COLUMN rental_owner_documents.doc_type IS 'Tipo de documento requerido según el tipo de propietario';
COMMENT ON COLUMN rental_owner_documents.rental_owner_id IS 'Referencia al propietario específico de alquiler';
COMMENT ON COLUMN rental_owner_documents.file_url IS 'URL pública del documento en Supabase Storage';

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tabla rental_owner_documents creada exitosamente';
    RAISE NOTICE '🔐 RLS habilitado con políticas de seguridad';
    RAISE NOTICE '📊 Índices de optimización agregados';
    RAISE NOTICE '🔄 Trigger updated_at configurado';
END $$;
