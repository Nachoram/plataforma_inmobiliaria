-- Migration: Create property_sale_documents table for sale title study documents
-- Date: 2025-11-13
-- Description: Creates a dedicated table for storing title study documents for property sales

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

    -- Agregar columna role a profiles si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager'));
        RAISE NOTICE 'Columna role agregada a profiles';
    END IF;

    RAISE NOTICE 'Prerequisitos verificados correctamente ✓';
END $$;

-- =====================================================
-- TABLA: DOCUMENTOS DE ESTUDIO DE TÍTULO PARA VENTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS property_sale_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    doc_type text NOT NULL,                        -- Tipo de documento según normativa chilena 2025
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
    CONSTRAINT valid_doc_type CHECK (doc_type IN (
        'dominio_vigente',
        'hipotecas_gravamenes',
        'cadena_titulos',
        'avaluo_fiscal',
        'deuda_contribuciones',
        'no_expropiacion_municipal',
        'interdicciones_litigios',
        'escritura_compraventa',
        'planos_propiedad',
        'reglamento_copropiedad',
        'gastos_comunes',
        'cert_numero_municipal',
        'cert_estado_civil',
        'cedula_identidad_vendedor'
    ))
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_property_sale_documents_property_id
    ON property_sale_documents(property_id);

CREATE INDEX IF NOT EXISTS idx_property_sale_documents_doc_type
    ON property_sale_documents(doc_type);

CREATE INDEX IF NOT EXISTS idx_property_sale_documents_uploaded_at
    ON property_sale_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_sale_documents_uploaded_by
    ON property_sale_documents(uploaded_by);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE property_sale_documents ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver documentos de propiedades que pueden acceder
CREATE POLICY "Users can view sale documents for accessible properties" ON property_sale_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_sale_documents.property_id
            AND (
                p.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
            )
        )
    );

-- Política para que los usuarios puedan insertar documentos en propiedades que pueden modificar
CREATE POLICY "Users can insert sale documents for modifiable properties" ON property_sale_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_sale_documents.property_id
            AND (
                p.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
            )
        )
    );

-- Política para que los usuarios puedan actualizar documentos que han subido
CREATE POLICY "Users can update their own sale documents" ON property_sale_documents
    FOR UPDATE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Política para que los usuarios puedan eliminar documentos que han subido
CREATE POLICY "Users can delete their own sale documents" ON property_sale_documents
    FOR DELETE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_property_sale_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_property_sale_documents_updated_at
    BEFORE UPDATE ON property_sale_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_property_sale_documents_updated_at();

-- =====================================================
-- COMENTARIOS EN LA TABLA
-- =====================================================

COMMENT ON TABLE property_sale_documents IS 'Documentos requeridos para estudio de título en ventas de propiedades según normativa chilena 2025';
COMMENT ON COLUMN property_sale_documents.doc_type IS 'Tipo de documento según clasificación oficial para estudio de título';
COMMENT ON COLUMN property_sale_documents.file_url IS 'URL pública del documento en Supabase Storage';
COMMENT ON COLUMN property_sale_documents.storage_path IS 'Ruta completa del archivo en el bucket de storage';
