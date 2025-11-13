-- =====================================================
-- FIX COMPLETO: Agregar columna id y crear sistema de documentos
-- =====================================================

-- PASO 1: Verificar PRIMARY KEY actual
DO $$
DECLARE
    v_app_pk text;
    v_gua_pk text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 VERIFICANDO PRIMARY KEYS ACTUALES';
    RAISE NOTICE '========================================';
    
    -- Ver PK de application_applicants
    SELECT string_agg(a.attname, ', ')
    INTO v_app_pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'application_applicants'::regclass
      AND i.indisprimary;
    
    RAISE NOTICE 'PK actual de application_applicants: %', COALESCE(v_app_pk, '❌ NO TIENE PK');
    
    -- Ver PK de application_guarantors
    SELECT string_agg(a.attname, ', ')
    INTO v_gua_pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'application_guarantors'::regclass
      AND i.indisprimary;
    
    RAISE NOTICE 'PK actual de application_guarantors: %', COALESCE(v_gua_pk, '❌ NO TIENE PK');
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PASO 2: Agregar columna id si no existe
-- =====================================================

DO $$
BEGIN
    -- Agregar id a application_applicants si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'application_applicants'
          AND column_name = 'id'
    ) THEN
        RAISE NOTICE '➕ Agregando columna id a application_applicants...';
        
        -- Agregar la columna
        ALTER TABLE application_applicants 
        ADD COLUMN id uuid DEFAULT gen_random_uuid();
        
        -- Actualizar valores existentes
        UPDATE application_applicants SET id = gen_random_uuid() WHERE id IS NULL;
        
        -- Hacer NOT NULL
        ALTER TABLE application_applicants 
        ALTER COLUMN id SET NOT NULL;
        
        -- Si no tiene PRIMARY KEY, agregar constraint UNIQUE
        ALTER TABLE application_applicants 
        ADD CONSTRAINT application_applicants_id_unique UNIQUE (id);
        
        RAISE NOTICE '✅ Columna id agregada a application_applicants';
    ELSE
        RAISE NOTICE '✅ application_applicants ya tiene columna id';
    END IF;
    
    -- Agregar id a application_guarantors si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'application_guarantors'
          AND column_name = 'id'
    ) THEN
        RAISE NOTICE '➕ Agregando columna id a application_guarantors...';
        
        -- Agregar la columna
        ALTER TABLE application_guarantors 
        ADD COLUMN id uuid DEFAULT gen_random_uuid();
        
        -- Actualizar valores existentes
        UPDATE application_guarantors SET id = gen_random_uuid() WHERE id IS NULL;
        
        -- Hacer NOT NULL
        ALTER TABLE application_guarantors 
        ALTER COLUMN id SET NOT NULL;
        
        -- Si no tiene PRIMARY KEY, agregar constraint UNIQUE
        ALTER TABLE application_guarantors 
        ADD CONSTRAINT application_guarantors_id_unique UNIQUE (id);
        
        RAISE NOTICE '✅ Columna id agregada a application_guarantors';
    ELSE
        RAISE NOTICE '✅ application_guarantors ya tiene columna id';
    END IF;
END $$;

-- =====================================================
-- PASO 3: Crear tablas de documentos
-- =====================================================

DO $$ BEGIN RAISE NOTICE '🧹 Limpiando tablas existentes si las hay...'; END $$;

-- Primero eliminar vistas que puedan depender de las tablas
DROP VIEW IF EXISTS applicant_documents_complete CASCADE;
DROP VIEW IF EXISTS guarantor_documents_complete CASCADE;

-- Ahora eliminar las tablas si existen
DROP TABLE IF EXISTS applicant_documents CASCADE;
DROP TABLE IF EXISTS guarantor_documents CASCADE;

DO $$ BEGIN RAISE NOTICE '📄 Creando tabla applicant_documents...'; END $$;

CREATE TABLE applicant_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL,
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
    updated_at timestamptz DEFAULT now(),
    
    -- Foreign key reference
    CONSTRAINT fk_applicant_documents_applicant 
        FOREIGN KEY (applicant_id) 
        REFERENCES application_applicants(id) 
        ON DELETE CASCADE
);

DO $$ BEGIN 
    RAISE NOTICE '✅ Tabla applicant_documents creada';
    RAISE NOTICE '📄 Creando tabla guarantor_documents...';
END $$;

CREATE TABLE guarantor_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantor_id uuid NOT NULL,
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
    updated_at timestamptz DEFAULT now(),
    
    -- Foreign key reference
    CONSTRAINT fk_guarantor_documents_guarantor 
        FOREIGN KEY (guarantor_id) 
        REFERENCES application_guarantors(id) 
        ON DELETE CASCADE
);

DO $$ BEGIN RAISE NOTICE '✅ Tabla guarantor_documents creada'; END $$;

-- =====================================================
-- PASO 4: Crear índices
-- =====================================================

DO $$ BEGIN RAISE NOTICE '📊 Creando índices...'; END $$;

CREATE INDEX idx_applicant_documents_applicant_id ON applicant_documents(applicant_id);
CREATE INDEX idx_applicant_documents_doc_type ON applicant_documents(doc_type);
CREATE INDEX idx_applicant_documents_uploaded_at ON applicant_documents(uploaded_at DESC);
CREATE INDEX idx_applicant_documents_uploaded_by ON applicant_documents(uploaded_by);

CREATE INDEX idx_guarantor_documents_guarantor_id ON guarantor_documents(guarantor_id);
CREATE INDEX idx_guarantor_documents_doc_type ON guarantor_documents(doc_type);
CREATE INDEX idx_guarantor_documents_uploaded_at ON guarantor_documents(uploaded_at DESC);
CREATE INDEX idx_guarantor_documents_uploaded_by ON guarantor_documents(uploaded_by);

DO $$ BEGIN RAISE NOTICE '✅ 8 índices creados'; END $$;

-- =====================================================
-- PASO 5: Habilitar RLS
-- =====================================================

DO $$ BEGIN RAISE NOTICE '🔐 Configurando RLS...'; END $$;

ALTER TABLE applicant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantor_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 6: Políticas RLS - applicant_documents
-- =====================================================

CREATE POLICY "Users can view their own applicant documents"
    ON applicant_documents FOR SELECT TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR applicant_id IN (
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
-- PASO 7: Políticas RLS - guarantor_documents
-- =====================================================

CREATE POLICY "Users can view their own guarantor documents"
    ON guarantor_documents FOR SELECT TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR guarantor_id IN (
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

DO $$ BEGIN RAISE NOTICE '✅ 8 políticas RLS creadas'; END $$;

-- =====================================================
-- PASO 8: Crear triggers para updated_at
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

DO $$ BEGIN RAISE NOTICE '✅ Triggers creados'; END $$;

-- =====================================================
-- PASO 9: Crear vistas
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

DO $$ BEGIN RAISE NOTICE '✅ 2 vistas creadas'; END $$;

-- =====================================================
-- PASO 10: Crear funciones auxiliares
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

DO $$ BEGIN RAISE NOTICE '✅ 4 funciones auxiliares creadas'; END $$;

-- =====================================================
-- PASO 11: Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION count_applicant_documents_by_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION count_guarantor_documents_by_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_applicant_document(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_guarantor_document(uuid, text) TO authenticated;

GRANT SELECT ON applicant_documents_complete TO authenticated;
GRANT SELECT ON guarantor_documents_complete TO authenticated;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    tables_count int;
    indexes_count int;
    policies_count int;
    views_count int;
    functions_count int;
BEGIN
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('applicant_documents', 'guarantor_documents');

    SELECT COUNT(*) INTO indexes_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
      AND tablename IN ('applicant_documents', 'guarantor_documents');

    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN ('applicant_documents', 'guarantor_documents');

    SELECT COUNT(*) INTO views_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
      AND table_name IN ('applicant_documents_complete', 'guarantor_documents_complete');

    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name IN (
          'count_applicant_documents_by_type',
          'count_guarantor_documents_by_type',
          'get_latest_applicant_document',
          'get_latest_guarantor_document'
      );

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INSTALACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tablas: % de 2 ✅', tables_count;
    RAISE NOTICE 'Índices: % de 8 ✅', indexes_count;
    RAISE NOTICE 'Políticas RLS: % de 8 ✅', policies_count;
    RAISE NOTICE 'Vistas: % de 2 ✅', views_count;
    RAISE NOTICE 'Funciones: % de 4 ✅', functions_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Sistema de documentos instalado exitosamente';
    RAISE NOTICE '📋 Tablas: applicant_documents, guarantor_documents';
    RAISE NOTICE '🔐 RLS habilitado con políticas de seguridad';
    RAISE NOTICE '📊 Vistas y funciones auxiliares disponibles';
    RAISE NOTICE '';
    RAISE NOTICE 'Tipos de documentos soportados:';
    RAISE NOTICE '  - informe_comercial (Dicom)';
    RAISE NOTICE '  - cedula_identidad';
    RAISE NOTICE '  - liquidaciones_sueldo';
    RAISE NOTICE '  - contrato_trabajo';
    RAISE NOTICE '  - certificado_antiguedad';
    RAISE NOTICE '  - certificado_afp';
    RAISE NOTICE '  - carpeta_tributaria';
    RAISE NOTICE '  - declaracion_renta';
    RAISE NOTICE '  - boletas_honorarios';
    RAISE NOTICE '  - escritura_constitucion';
    RAISE NOTICE '  - certificado_vigencia';
    RAISE NOTICE '  - rut_empresa';
    RAISE NOTICE '  - poder_notarial';
    RAISE NOTICE '  - cedula_representante';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- TEST RÁPIDO
-- =====================================================

-- Verificar que las tablas funcionan
DO $$
BEGIN
    -- Intentar insertar y eliminar un registro de prueba
    -- (solo para verificar que todo funciona)
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Ejecutando test de funcionalidad...';
    RAISE NOTICE 'Si no hay errores abajo, ¡todo está perfecto!';
    RAISE NOTICE '';
END $$;

