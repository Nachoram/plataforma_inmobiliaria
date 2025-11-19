-- =====================================================
-- MIGRACIÓN ALTERNATIVA - Sistema de Documentos
-- Esta versión detecta automáticamente la PRIMARY KEY
-- =====================================================

-- Eliminar tablas si ya existen (para empezar limpio)
DROP TABLE IF EXISTS applicant_documents CASCADE;
DROP TABLE IF EXISTS guarantor_documents CASCADE;

-- =====================================================
-- OPCIÓN A: Si la PRIMARY KEY se llama "id"
-- =====================================================

-- Intenta crear con "id"
DO $$
BEGIN
    -- Verificar que existe la columna id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'application_applicants'
          AND column_name = 'id'
    ) THEN
        -- CREAR CON id
        CREATE TABLE applicant_documents (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            applicant_id uuid NOT NULL REFERENCES application_applicants(id) ON DELETE CASCADE,
            doc_type text NOT NULL,
            file_name text,
            file_url text NOT NULL,
            storage_path text,
            file_size_bytes bigint,
            mime_type text,
            uploaded_by uuid REFERENCES auth.users(id),
            uploaded_at timestamptz NOT NULL DEFAULT now(),
            notes text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );

        CREATE TABLE guarantor_documents (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            guarantor_id uuid NOT NULL REFERENCES application_guarantors(id) ON DELETE CASCADE,
            doc_type text NOT NULL,
            file_name text,
            file_url text NOT NULL,
            storage_path text,
            file_size_bytes bigint,
            mime_type text,
            uploaded_by uuid REFERENCES auth.users(id),
            uploaded_at timestamptz NOT NULL DEFAULT now(),
            notes text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );

        RAISE NOTICE '✅ Tablas creadas con foreign key a "id"';
        
    ELSE
        RAISE EXCEPTION '❌ La columna "id" no existe en application_applicants. Usa la OPCIÓN B más abajo.';
    END IF;
END $$;

-- =====================================================
-- Crear índices
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_applicant_documents_applicant_id 
    ON applicant_documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_doc_type 
    ON applicant_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_uploaded_at 
    ON applicant_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_uploaded_by 
    ON applicant_documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_guarantor_documents_guarantor_id 
    ON guarantor_documents(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_guarantor_documents_doc_type 
    ON guarantor_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_guarantor_documents_uploaded_at 
    ON guarantor_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_guarantor_documents_uploaded_by 
    ON guarantor_documents(uploaded_by);

-- =====================================================
-- Habilitar RLS
-- =====================================================

ALTER TABLE applicant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantor_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Políticas RLS para applicant_documents
-- =====================================================

CREATE POLICY "Users can view their own applicant documents"
    ON applicant_documents FOR SELECT TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR
        applicant_id IN (
            SELECT aa.id FROM application_applicants aa
            JOIN applications app ON app.id = aa.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own applicant documents"
    ON applicant_documents FOR INSERT TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND applicant_id IN (
            SELECT aa.id FROM application_applicants aa
            JOIN applications app ON app.id = aa.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own applicant documents"
    ON applicant_documents FOR UPDATE TO authenticated
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own applicant documents"
    ON applicant_documents FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid());

-- =====================================================
-- Políticas RLS para guarantor_documents
-- =====================================================

CREATE POLICY "Users can view their own guarantor documents"
    ON guarantor_documents FOR SELECT TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR
        guarantor_id IN (
            SELECT ag.id FROM application_guarantors ag
            JOIN applications app ON app.id = ag.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own guarantor documents"
    ON guarantor_documents FOR INSERT TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND guarantor_id IN (
            SELECT ag.id FROM application_guarantors ag
            JOIN applications app ON app.id = ag.application_id
            WHERE app.applicant_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own guarantor documents"
    ON guarantor_documents FOR UPDATE TO authenticated
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own guarantor documents"
    ON guarantor_documents FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid());

-- =====================================================
-- Triggers para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applicant_documents_updated_at
    BEFORE UPDATE ON applicant_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guarantor_documents_updated_at
    BEFORE UPDATE ON guarantor_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Vistas
-- =====================================================

CREATE OR REPLACE VIEW applicant_documents_complete AS
SELECT 
    ad.id, ad.applicant_id, ad.doc_type, ad.file_name,
    ad.file_url, ad.storage_path, ad.file_size_bytes,
    ad.mime_type, ad.uploaded_by, ad.uploaded_at, ad.notes,
    aa.first_name as applicant_first_name,
    aa.paternal_last_name as applicant_paternal_last_name,
    aa.rut as applicant_rut,
    aa.entity_type as applicant_entity_type,
    app.id as application_id,
    app.property_id,
    app.status as application_status
FROM applicant_documents ad
JOIN application_applicants aa ON ad.applicant_id = aa.id
JOIN applications app ON aa.application_id = app.id;

CREATE OR REPLACE VIEW guarantor_documents_complete AS
SELECT 
    gd.id, gd.guarantor_id, gd.doc_type, gd.file_name,
    gd.file_url, gd.storage_path, gd.file_size_bytes,
    gd.mime_type, gd.uploaded_by, gd.uploaded_at, gd.notes,
    ag.first_name as guarantor_first_name,
    ag.paternal_last_name as guarantor_paternal_last_name,
    ag.rut as guarantor_rut,
    ag.entity_type as guarantor_entity_type,
    app.id as application_id,
    app.property_id,
    app.status as application_status
FROM guarantor_documents gd
JOIN application_guarantors ag ON gd.guarantor_id = ag.id
JOIN applications app ON ag.application_id = app.id;

-- =====================================================
-- Funciones auxiliares
-- =====================================================

CREATE OR REPLACE FUNCTION count_applicant_documents_by_type(p_applicant_id uuid)
RETURNS TABLE (doc_type text, document_count bigint)
LANGUAGE sql STABLE AS $$
    SELECT doc_type, COUNT(*) as document_count
    FROM applicant_documents
    WHERE applicant_id = p_applicant_id
    GROUP BY doc_type
    ORDER BY doc_type;
$$;

CREATE OR REPLACE FUNCTION count_guarantor_documents_by_type(p_guarantor_id uuid)
RETURNS TABLE (doc_type text, document_count bigint)
LANGUAGE sql STABLE AS $$
    SELECT doc_type, COUNT(*) as document_count
    FROM guarantor_documents
    WHERE guarantor_id = p_guarantor_id
    GROUP BY doc_type
    ORDER BY doc_type;
$$;

CREATE OR REPLACE FUNCTION get_latest_applicant_document(
    p_applicant_id uuid,
    p_doc_type text
)
RETURNS applicant_documents
LANGUAGE sql STABLE AS $$
    SELECT * FROM applicant_documents
    WHERE applicant_id = p_applicant_id
      AND doc_type = p_doc_type
    ORDER BY uploaded_at DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_latest_guarantor_document(
    p_guarantor_id uuid,
    p_doc_type text
)
RETURNS guarantor_documents
LANGUAGE sql STABLE AS $$
    SELECT * FROM guarantor_documents
    WHERE guarantor_id = p_guarantor_id
      AND doc_type = p_doc_type
    ORDER BY uploaded_at DESC
    LIMIT 1;
$$;

-- =====================================================
-- Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION count_applicant_documents_by_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION count_guarantor_documents_by_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_applicant_document(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_guarantor_document(uuid, text) TO authenticated;

GRANT SELECT ON applicant_documents_complete TO authenticated;
GRANT SELECT ON guarantor_documents_complete TO authenticated;

-- =====================================================
-- Mensaje final
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INSTALACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 Tablas: applicant_documents, guarantor_documents';
    RAISE NOTICE '🔐 RLS habilitado en ambas tablas';
    RAISE NOTICE '📊 8 índices creados';
    RAISE NOTICE '🔒 8 políticas RLS configuradas';
    RAISE NOTICE '👁️  2 vistas creadas';
    RAISE NOTICE '🔧 4 funciones auxiliares disponibles';
    RAISE NOTICE '========================================';
END $$;








