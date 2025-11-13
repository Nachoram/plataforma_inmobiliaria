-- Migration: Add applicant_documents and guarantor_documents tables
-- Date: 2025-11-13
-- Description: Creates dedicated tables for storing documents for applicants and guarantors
--              allowing multiple files per type and flexible document type definition
-- PREREQUISITE: Requires 20251104_create_application_applicants_guarantors_tables.sql to be executed first

-- =====================================================
-- VERIFICACIÓN DE PREREQUISITOS
-- =====================================================

DO $$
BEGIN
    -- Verificar que exista la tabla application_applicants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'application_applicants'
    ) THEN
        RAISE EXCEPTION 'La tabla application_applicants no existe. Por favor, ejecuta primero la migración 20251104_create_application_applicants_guarantors_tables.sql';
    END IF;

    -- Verificar que exista la tabla application_guarantors
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'application_guarantors'
    ) THEN
        RAISE EXCEPTION 'La tabla application_guarantors no existe. Por favor, ejecuta primero la migración 20251104_create_application_applicants_guarantors_tables.sql';
    END IF;

    RAISE NOTICE 'Prerequisitos verificados correctamente ✓';
END $$;

-- =====================================================
-- TABLA 1: DOCUMENTOS DE POSTULANTES
-- =====================================================

CREATE TABLE IF NOT EXISTS applicant_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES application_applicants(id) ON DELETE CASCADE,
    doc_type text NOT NULL,                        -- Tipo de documento: 'informe_comercial', 'cedula_identidad', 'liquidaciones_sueldo', etc.
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
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA 2: DOCUMENTOS DE AVALES
-- =====================================================

CREATE TABLE IF NOT EXISTS guarantor_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantor_id uuid NOT NULL REFERENCES application_guarantors(id) ON DELETE CASCADE,
    doc_type text NOT NULL,                        -- Tipo de documento: 'informe_comercial', 'boleta_honorario', 'carpeta_tributaria', etc.
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
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para applicant_documents
CREATE INDEX IF NOT EXISTS idx_applicant_documents_applicant_id 
    ON applicant_documents(applicant_id);

CREATE INDEX IF NOT EXISTS idx_applicant_documents_doc_type 
    ON applicant_documents(doc_type);

CREATE INDEX IF NOT EXISTS idx_applicant_documents_uploaded_at 
    ON applicant_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_applicant_documents_uploaded_by 
    ON applicant_documents(uploaded_by);

-- Índices para guarantor_documents
CREATE INDEX IF NOT EXISTS idx_guarantor_documents_guarantor_id 
    ON guarantor_documents(guarantor_id);

CREATE INDEX IF NOT EXISTS idx_guarantor_documents_doc_type 
    ON guarantor_documents(doc_type);

CREATE INDEX IF NOT EXISTS idx_guarantor_documents_uploaded_at 
    ON guarantor_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_guarantor_documents_uploaded_by 
    ON guarantor_documents(uploaded_by);

-- =====================================================
-- FUNCIONES TRIGGER PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para applicant_documents
DROP TRIGGER IF EXISTS update_applicant_documents_updated_at ON applicant_documents;
CREATE TRIGGER update_applicant_documents_updated_at
    BEFORE UPDATE ON applicant_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para guarantor_documents
DROP TRIGGER IF EXISTS update_guarantor_documents_updated_at ON guarantor_documents;
CREATE TRIGGER update_guarantor_documents_updated_at
    BEFORE UPDATE ON guarantor_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE applicant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantor_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para applicant_documents
-- Los usuarios pueden ver documentos de sus propias postulaciones
CREATE POLICY "Users can view their own applicant documents"
    ON applicant_documents
    FOR SELECT
    TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR
        applicant_id IN (
            SELECT aa.id 
            FROM application_applicants aa
            JOIN applications app ON app.id = aa.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

-- Los usuarios pueden insertar documentos para sus propias postulaciones
CREATE POLICY "Users can insert their own applicant documents"
    ON applicant_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND
        applicant_id IN (
            SELECT aa.id 
            FROM application_applicants aa
            JOIN applications app ON app.id = aa.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

-- Los usuarios pueden actualizar documentos que subieron
CREATE POLICY "Users can update their own applicant documents"
    ON applicant_documents
    FOR UPDATE
    TO authenticated
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

-- Los usuarios pueden eliminar documentos que subieron
CREATE POLICY "Users can delete their own applicant documents"
    ON applicant_documents
    FOR DELETE
    TO authenticated
    USING (uploaded_by = auth.uid());

-- Políticas para guarantor_documents
-- Los usuarios pueden ver documentos de avales de sus propias postulaciones
CREATE POLICY "Users can view their own guarantor documents"
    ON guarantor_documents
    FOR SELECT
    TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR
        guarantor_id IN (
            SELECT ag.id 
            FROM application_guarantors ag
            JOIN applications app ON app.id = ag.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

-- Los usuarios pueden insertar documentos de avales para sus propias postulaciones
CREATE POLICY "Users can insert their own guarantor documents"
    ON guarantor_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND
        guarantor_id IN (
            SELECT ag.id 
            FROM application_guarantors ag
            JOIN applications app ON app.id = ag.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

-- Los usuarios pueden actualizar documentos de avales que subieron
CREATE POLICY "Users can update their own guarantor documents"
    ON guarantor_documents
    FOR UPDATE
    TO authenticated
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

-- Los usuarios pueden eliminar documentos de avales que subieron
CREATE POLICY "Users can delete their own guarantor documents"
    ON guarantor_documents
    FOR DELETE
    TO authenticated
    USING (uploaded_by = auth.uid());

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para obtener todos los documentos de un postulante con información adicional
CREATE OR REPLACE VIEW applicant_documents_complete AS
SELECT 
    ad.id,
    ad.applicant_id,
    ad.doc_type,
    ad.file_name,
    ad.file_url,
    ad.storage_path,
    ad.file_size_bytes,
    ad.mime_type,
    ad.uploaded_by,
    ad.uploaded_at,
    ad.notes,
    -- Información del postulante
    aa.first_name as applicant_first_name,
    aa.paternal_last_name as applicant_paternal_last_name,
    aa.rut as applicant_rut,
    aa.entity_type as applicant_entity_type,
    -- Información de la postulación
    app.id as application_id,
    app.property_id,
    app.status as application_status
FROM applicant_documents ad
JOIN application_applicants aa ON ad.applicant_id = aa.id
JOIN applications app ON aa.application_id = app.id;

-- Vista para obtener todos los documentos de un aval con información adicional
CREATE OR REPLACE VIEW guarantor_documents_complete AS
SELECT 
    gd.id,
    gd.guarantor_id,
    gd.doc_type,
    gd.file_name,
    gd.file_url,
    gd.storage_path,
    gd.file_size_bytes,
    gd.mime_type,
    gd.uploaded_by,
    gd.uploaded_at,
    gd.notes,
    -- Información del aval
    ag.first_name as guarantor_first_name,
    ag.paternal_last_name as guarantor_paternal_last_name,
    ag.rut as guarantor_rut,
    ag.entity_type as guarantor_entity_type,
    -- Información de la postulación
    app.id as application_id,
    app.property_id,
    app.status as application_status
FROM guarantor_documents gd
JOIN application_guarantors ag ON gd.guarantor_id = ag.id
JOIN applications app ON ag.application_id = app.id;

-- =====================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- =====================================================

COMMENT ON TABLE applicant_documents IS 'Documentos asociados a postulantes de arriendo';
COMMENT ON TABLE guarantor_documents IS 'Documentos asociados a avales/garantes de arriendo';

COMMENT ON COLUMN applicant_documents.doc_type IS 'Tipo de documento: informe_comercial, cedula_identidad, liquidaciones_sueldo, carpeta_tributaria, etc.';
COMMENT ON COLUMN guarantor_documents.doc_type IS 'Tipo de documento: informe_comercial, cedula_identidad, boleta_honorario, carpeta_tributaria, etc.';

COMMENT ON COLUMN applicant_documents.file_url IS 'URL pública del archivo en Supabase Storage';
COMMENT ON COLUMN guarantor_documents.file_url IS 'URL pública del archivo en Supabase Storage';

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para contar documentos por tipo de un postulante
CREATE OR REPLACE FUNCTION count_applicant_documents_by_type(
    p_applicant_id uuid
)
RETURNS TABLE (
    doc_type text,
    document_count bigint
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        doc_type,
        COUNT(*) as document_count
    FROM applicant_documents
    WHERE applicant_id = p_applicant_id
    GROUP BY doc_type
    ORDER BY doc_type;
$$;

-- Función para contar documentos por tipo de un aval
CREATE OR REPLACE FUNCTION count_guarantor_documents_by_type(
    p_guarantor_id uuid
)
RETURNS TABLE (
    doc_type text,
    document_count bigint
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        doc_type,
        COUNT(*) as document_count
    FROM guarantor_documents
    WHERE guarantor_id = p_guarantor_id
    GROUP BY doc_type
    ORDER BY doc_type;
$$;

-- Función para obtener el documento más reciente de un tipo específico
CREATE OR REPLACE FUNCTION get_latest_applicant_document(
    p_applicant_id uuid,
    p_doc_type text
)
RETURNS applicant_documents
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM applicant_documents
    WHERE applicant_id = p_applicant_id
      AND doc_type = p_doc_type
    ORDER BY uploaded_at DESC
    LIMIT 1;
$$;

-- Función similar para avales
CREATE OR REPLACE FUNCTION get_latest_guarantor_document(
    p_guarantor_id uuid,
    p_doc_type text
)
RETURNS guarantor_documents
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM guarantor_documents
    WHERE guarantor_id = p_guarantor_id
      AND doc_type = p_doc_type
    ORDER BY uploaded_at DESC
    LIMIT 1;
$$;

-- =====================================================
-- GRANTS (PERMISOS)
-- =====================================================

-- Otorgar permisos de ejecución a funciones
GRANT EXECUTE ON FUNCTION count_applicant_documents_by_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION count_guarantor_documents_by_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_applicant_document(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_guarantor_document(uuid, text) TO authenticated;

-- Otorgar permisos de lectura en vistas
GRANT SELECT ON applicant_documents_complete TO authenticated;
GRANT SELECT ON guarantor_documents_complete TO authenticated;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tablas de documentos creadas exitosamente';
    RAISE NOTICE '📋 Tablas: applicant_documents, guarantor_documents';
    RAISE NOTICE '🔐 RLS habilitado en ambas tablas';
    RAISE NOTICE '📊 Vistas: applicant_documents_complete, guarantor_documents_complete';
    RAISE NOTICE '🔧 Funciones: count_*_documents_by_type, get_latest_*_document';
    RAISE NOTICE '💡 Los tipos de documentos (doc_type) son flexibles y se definen en el frontend';
END $$;

