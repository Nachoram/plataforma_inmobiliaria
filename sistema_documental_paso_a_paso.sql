-- SISTEMATIZACIÓN DOCUMENTAL PARA POSTULANTES - VERSIÓN PASO A PASO
-- Ejecutar cada sección por separado en el SQL Editor de Supabase
-- Leer los comentarios y verificar los resultados antes de continuar

-- =====================================================
-- PASO 1: CREAR TABLA DE TIPOS DE DOCUMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS applicant_document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('identification', 'financial', 'employment', 'other')),
  is_required boolean DEFAULT false,
  max_files integer DEFAULT 1,
  allowed_mime_types text[] DEFAULT ARRAY['application/pdf', 'image/jpeg', 'image/png'],
  max_file_size_mb integer DEFAULT 10,
  processing_priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar tipos de documentos
INSERT INTO applicant_document_types (code, name, description, category, is_required, max_files, processing_priority) VALUES
  ('cedula_identidad', 'Cédula de Identidad', 'Documento de identidad oficial', 'identification', true, 2, 1),
  ('informe_comercial', 'Informe Comercial', 'Reporte de comportamiento comercial', 'financial', true, 1, 3),
  ('liquidacion_sueldo', 'Liquidación de Sueldo', 'Comprobante de ingresos mensuales', 'employment', true, 3, 4),
  ('certificado_antiguidad', 'Certificado de Antigüedad', 'Certificado de tiempo en el empleo actual', 'employment', false, 1, 6),
  ('extracto_bancario', 'Extracto Bancario', 'Estado de cuenta bancaria', 'financial', false, 3, 7),
  ('otro', 'Otro Documento', 'Documento adicional no categorizado', 'other', false, 10, 99)
ON CONFLICT (code) DO NOTHING;

-- Verificar que se creó correctamente
SELECT 'Tipos de documentos creados:' as status, COUNT(*) as cantidad FROM applicant_document_types;

-- =====================================================
-- PASO 2: CREAR TABLA DE CONTENIDO EXTRAÍDO
-- =====================================================

CREATE TABLE IF NOT EXISTS applicant_document_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE,
  document_type_code text NOT NULL REFERENCES applicant_document_types(code),
  extracted_at timestamptz DEFAULT now(),
  extraction_method text DEFAULT 'manual' CHECK (extraction_method IN ('ocr', 'manual', 'api', 'ai')),
  confidence_score decimal(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data jsonb DEFAULT '{}',
  full_name text,
  rut text,
  document_number text,
  issue_date date,
  expiry_date date,
  issuing_authority text,
  monthly_income numeric,
  employer_name text,
  employment_start_date date,
  notes text,
  validation_errors text[],
  version integer DEFAULT 1,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Verificar que se creó correctamente
SELECT 'Tabla applicant_document_content creada' as status;

-- =====================================================
-- PASO 3: AGREGAR COLUMNAS A TABLA DOCUMENTS
-- =====================================================

-- Agregar columnas una por una verificando que no existan
DO $$
BEGIN
  -- Verificar y agregar columnas BÁSICAS que deberían existir (de migraciones anteriores)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'document_type') THEN
    ALTER TABLE documents ADD COLUMN document_type text NOT NULL DEFAULT 'general';
    RAISE NOTICE '✅ Agregada columna document_type (requerida)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_url') THEN
    ALTER TABLE documents ADD COLUMN file_url text NOT NULL DEFAULT '';
    RAISE NOTICE '✅ Agregada columna file_url (requerida)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_at') THEN
    ALTER TABLE documents ADD COLUMN uploaded_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Agregada columna uploaded_at (requerida)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'storage_path') THEN
    ALTER TABLE documents ADD COLUMN storage_path text;
    RAISE NOTICE '✅ Agregada columna storage_path';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_size_bytes') THEN
    ALTER TABLE documents ADD COLUMN file_size_bytes integer DEFAULT 0;
    RAISE NOTICE '✅ Agregada columna file_size_bytes';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'mime_type') THEN
    ALTER TABLE documents ADD COLUMN mime_type text;
    RAISE NOTICE '✅ Agregada columna mime_type';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'property_id') THEN
    ALTER TABLE documents ADD COLUMN property_id uuid REFERENCES properties(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Agregada columna property_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'guarantor_id') THEN
    ALTER TABLE documents ADD COLUMN guarantor_id uuid REFERENCES guarantors(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Agregada columna guarantor_id';
  END IF;

  -- Verificar y agregar application_id si no existe (debería existir de migraciones anteriores)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'application_id') THEN
    ALTER TABLE documents ADD COLUMN application_id uuid REFERENCES applications(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Agregada columna application_id (era requerida)';
  ELSE
    RAISE NOTICE '✅ Columna application_id ya existe';
  END IF;

  -- Verificar y agregar applicant_id si no existe (debería existir de migraciones anteriores)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_id') THEN
    ALTER TABLE documents ADD COLUMN applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Agregada columna applicant_id (era requerida)';
  ELSE
    RAISE NOTICE '✅ Columna applicant_id ya existe';
  END IF;

  -- Verificar y agregar uploader_user_id si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploader_user_id') THEN
    -- Agregar como nullable primero para evitar error con registros existentes
    ALTER TABLE documents ADD COLUMN uploader_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

    -- Intentar llenar con applicant_id si existe
    UPDATE documents SET uploader_user_id = applicant_id WHERE uploader_user_id IS NULL AND applicant_id IS NOT NULL;

    -- Verificar si hay valores NULL y dar instrucciones
    IF EXISTS (SELECT 1 FROM documents WHERE uploader_user_id IS NULL LIMIT 1) THEN
      RAISE NOTICE '⚠️ ADVERTENCIA: Algunos documentos tienen uploader_user_id NULL';
      RAISE NOTICE '   Actualiza manualmente o ejecuta un script adicional para asignar valores';
    ELSE
      -- Si todos tienen valores, hacer NOT NULL
      ALTER TABLE documents ALTER COLUMN uploader_user_id SET NOT NULL;
      RAISE NOTICE '✅ Agregada columna uploader_user_id (NOT NULL)';
    END IF;
  ELSE
    RAISE NOTICE '✅ Columna uploader_user_id ya existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_document_type_code') THEN
    ALTER TABLE documents ADD COLUMN applicant_document_type_code text REFERENCES applicant_document_types(code);
    RAISE NOTICE '✅ Agregada columna applicant_document_type_code';
  ELSE
    RAISE NOTICE '⚠️ Columna applicant_document_type_code ya existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_status') THEN
    ALTER TABLE documents ADD COLUMN processing_status text DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed'));
    RAISE NOTICE '✅ Agregada columna processing_status';
  ELSE
    RAISE NOTICE '⚠️ Columna processing_status ya existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_attempts') THEN
    ALTER TABLE documents ADD COLUMN processing_attempts integer DEFAULT 0;
    RAISE NOTICE '✅ Agregada columna processing_attempts';
  ELSE
    RAISE NOTICE '⚠️ Columna processing_attempts ya existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'last_processed_at') THEN
    ALTER TABLE documents ADD COLUMN last_processed_at timestamptz;
    RAISE NOTICE '✅ Agregada columna last_processed_at';
  ELSE
    RAISE NOTICE '⚠️ Columna last_processed_at ya existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'ocr_text') THEN
    ALTER TABLE documents ADD COLUMN ocr_text text;
    RAISE NOTICE '✅ Agregada columna ocr_text';
  ELSE
    RAISE NOTICE '⚠️ Columna ocr_text ya existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'metadata') THEN
    ALTER TABLE documents ADD COLUMN metadata jsonb DEFAULT '{}';
    RAISE NOTICE '✅ Agregada columna metadata';
  ELSE
    RAISE NOTICE '⚠️ Columna metadata ya existe';
  END IF;
END $$;

-- Verificar columnas agregadas
SELECT
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('id', 'document_type', 'file_url', 'uploaded_at', 'application_id', 'applicant_id', 'uploader_user_id') THEN 'basica'
    WHEN column_name IN ('property_id', 'guarantor_id', 'storage_path', 'file_size_bytes', 'mime_type') THEN 'basica-opcional'
    ELSE 'sistematizacion'
  END as categoria
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('id', 'document_type', 'file_url', 'uploaded_at', 'application_id', 'applicant_id', 'uploader_user_id', 'property_id', 'guarantor_id', 'storage_path', 'file_size_bytes', 'mime_type', 'applicant_document_type_code', 'processing_status', 'processing_attempts', 'last_processed_at', 'ocr_text', 'metadata')
ORDER BY
  CASE
    WHEN column_name IN ('id', 'document_type', 'file_url', 'uploaded_at', 'application_id', 'applicant_id', 'uploader_user_id') THEN 1
    WHEN column_name IN ('property_id', 'guarantor_id', 'storage_path', 'file_size_bytes', 'mime_type') THEN 2
    ELSE 3
  END,
  column_name;

-- =====================================================
-- PASO 4: CREAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_applicant_document_types_category ON applicant_document_types(category);
CREATE INDEX IF NOT EXISTS idx_applicant_document_types_active ON applicant_document_types(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_applicant_document_content_applicant ON applicant_document_content(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_document ON applicant_document_content(document_id);
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_type ON applicant_document_content(document_type_code);
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_status ON applicant_document_content(processing_status);

CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant_id ON documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_user_id ON documents(uploader_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_guarantor_id ON documents(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_documents_applicant_type ON documents(applicant_document_type_code);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_last_processed ON documents(last_processed_at);

-- Índices GIN para JSON
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_data ON applicant_document_content USING gin(extracted_data);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);

SELECT 'Índices creados correctamente' as status;

-- =====================================================
-- PASO 5: HABILITAR RLS Y CREAR POLÍTICAS
-- =====================================================

ALTER TABLE applicant_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_document_content ENABLE ROW LEVEL SECURITY;

-- Política simple para tipos de documentos
DROP POLICY IF EXISTS "authenticated_read_document_types" ON applicant_document_types;
CREATE POLICY "authenticated_read_document_types" ON applicant_document_types
  FOR SELECT TO authenticated USING (is_active = true);

-- Políticas permisivas (la seguridad se maneja en las funciones)
DROP POLICY IF EXISTS "authenticated_access_document_content" ON applicant_document_content;
CREATE POLICY "authenticated_access_document_content" ON applicant_document_content
  FOR ALL TO authenticated USING (true);

SELECT 'Políticas RLS configuradas' as status;

-- =====================================================
-- PASO 6: CREAR FUNCIONES PARA N8N
-- =====================================================

-- Verificar que las columnas requeridas existan antes de crear las funciones
DO $$
BEGIN
  -- Verificar columnas básicas requeridas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'id') THEN
    RAISE EXCEPTION '❌ ERROR: La columna id no existe en documents.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'document_type') THEN
    RAISE EXCEPTION '❌ ERROR: La columna document_type no existe en documents.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_url') THEN
    RAISE EXCEPTION '❌ ERROR: La columna file_url no existe en documents.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_at') THEN
    RAISE EXCEPTION '❌ ERROR: La columna uploaded_at no existe en documents.';
  END IF;

  -- Verificar columnas de relaciones
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'application_id') THEN
    RAISE EXCEPTION '❌ ERROR: La columna application_id no existe en documents. Debe ejecutar el PASO 3 primero.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'applicant_id') THEN
    RAISE EXCEPTION '❌ ERROR: La columna applicant_id no existe en documents. Debe ejecutar el PASO 3 primero.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploader_user_id') THEN
    RAISE EXCEPTION '❌ ERROR: La columna uploader_user_id no existe en documents. Debe ejecutar el PASO 3 primero.';
  END IF;

  -- Verificar columnas de sistematización
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_status') THEN
    RAISE EXCEPTION '❌ ERROR: La columna processing_status no existe en documents. Debe ejecutar el PASO 3 primero.';
  END IF;

  RAISE NOTICE '✅ Verificación de columnas completada. Procediendo con la creación de funciones...';
END $$;

-- Función para obtener documentos pendientes
CREATE OR REPLACE FUNCTION get_pending_applicant_documents(
  applicant_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  document_id uuid,
  file_url text,
  document_type_code text,
  document_type_name text,
  processing_priority integer,
  applicant_name text,
  applicant_rut text,
  application_id uuid
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    d.id,
    d.file_url,
    d.applicant_document_type_code,
    adt.name,
    adt.processing_priority,
    a.full_name,
    a.rut,
    app.id
  FROM documents d
  JOIN applicant_document_types adt ON d.applicant_document_type_code = adt.code
  JOIN applicants a ON d.applicant_id = a.id
  LEFT JOIN applications app ON d.application_id = app.id
  WHERE d.processing_status IN ('uploaded', 'failed')
    AND adt.is_active = true
    AND (applicant_uuid IS NULL OR d.applicant_id = applicant_uuid)
  ORDER BY adt.processing_priority ASC, d.uploaded_at ASC
  LIMIT limit_count;
$$;

-- Función para actualizar estado de procesamiento
CREATE OR REPLACE FUNCTION update_document_processing_status(
  document_uuid uuid,
  new_status text,
  ocr_content text DEFAULT NULL,
  metadata_json jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_attempts integer;
BEGIN
  IF new_status NOT IN ('uploaded', 'processing', 'processed', 'failed') THEN
    RAISE EXCEPTION 'Invalid processing status: %', new_status;
  END IF;

  SELECT processing_attempts INTO current_attempts
  FROM documents WHERE id = document_uuid;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE documents SET
    processing_status = new_status,
    last_processed_at = now(),
    processing_attempts = CASE
      WHEN new_status = 'failed' THEN current_attempts + 1
      ELSE current_attempts
    END,
    ocr_text = COALESCE(ocr_content, ocr_text),
    metadata = COALESCE(metadata_json, metadata)
  WHERE id = document_uuid;

  RETURN true;
END;
$$;

-- Función para insertar contenido extraído
CREATE OR REPLACE FUNCTION insert_document_content(
  document_uuid uuid,
  content_data jsonb,
  extraction_method text DEFAULT 'manual',
  confidence decimal DEFAULT NULL,
  extracted_fields jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_record record;
  content_id uuid;
BEGIN
  -- Obtener información del documento
  SELECT d.applicant_id, d.applicant_document_type_code, d.uploader_user_id
  INTO doc_record
  FROM documents d
  WHERE d.id = document_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found: %', document_uuid;
  END IF;

  -- Insertar contenido extraído
  INSERT INTO applicant_document_content (
    document_id,
    applicant_id,
    document_type_code,
    extracted_data,
    extraction_method,
    confidence_score,
    processing_status,
    created_by,
    full_name,
    rut,
    document_number,
    monthly_income,
    employer_name
  ) VALUES (
    document_uuid,
    doc_record.applicant_id,
    doc_record.applicant_document_type_code,
    content_data,
    extraction_method,
    confidence,
    'completed',
    doc_record.uploader_user_id,
    extracted_fields->>'full_name',
    extracted_fields->>'rut',
    extracted_fields->>'document_number',
    (extracted_fields->>'monthly_income')::numeric,
    extracted_fields->>'employer_name'
  )
  RETURNING id INTO content_id;

  -- Actualizar estado del documento
  PERFORM update_document_processing_status(document_uuid, 'processed');

  RETURN content_id;
END;
$$;

SELECT 'Funciones creadas correctamente' as status;

-- =====================================================
-- PASO 7: CREAR VISTAS
-- =====================================================

-- Vista de documentos completos
CREATE OR REPLACE VIEW applicant_documents_complete AS
SELECT
  d.id as document_id,
  d.file_url,
  d.storage_path,
  d.file_size_bytes,
  d.mime_type,
  d.uploaded_at,
  d.processing_status,
  d.ocr_text,
  d.metadata,
  d.applicant_document_type_code,
  adt.name as document_type_name,
  adt.category as document_type_category,
  adt.is_required as document_type_required,
  adt.processing_priority,
  a.id as applicant_id,
  a.full_name as applicant_name,
  a.rut as applicant_rut,
  a.contact_email,
  a.contact_phone,
  adc.id as content_id,
  adc.extracted_data,
  adc.extraction_method,
  adc.confidence_score,
  adc.processing_status as content_status,
  adc.full_name as extracted_full_name,
  adc.rut as extracted_rut,
  adc.document_number,
  adc.monthly_income,
  adc.employer_name,
  adc.notes,
  app.id as application_id,
  app.status as application_status,
  CONCAT_WS(' ', p.address_street, p.address_number, p.address_department, '-', p.address_commune) as property_title
FROM documents d
LEFT JOIN applicant_document_types adt ON d.applicant_document_type_code = adt.code
LEFT JOIN applicants a ON d.applicant_id = a.id
LEFT JOIN applicant_document_content adc ON d.id = adc.document_id
LEFT JOIN applications app ON d.application_id = app.id
LEFT JOIN properties p ON app.property_id = p.id
WHERE d.applicant_id IS NOT NULL
ORDER BY d.uploaded_at DESC;

-- Vista de documentos pendientes
CREATE OR REPLACE VIEW applicant_documents_pending_processing AS
SELECT
  d.id,
  d.file_url,
  adt.name as document_type_name,
  adt.processing_priority,
  d.uploaded_at,
  a.full_name as applicant_name,
  a.rut as applicant_rut,
  app.id as application_id
FROM documents d
JOIN applicant_document_types adt ON d.applicant_document_type_code = adt.code
JOIN applicants a ON d.applicant_id = a.id
LEFT JOIN applications app ON d.application_id = app.id
WHERE d.processing_status IN ('uploaded', 'failed')
  AND adt.is_active = true
ORDER BY adt.processing_priority ASC, d.uploaded_at ASC;

SELECT 'Vistas creadas correctamente' as status;

-- =====================================================
-- PASO 8: OTORGAR PERMISOS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_pending_applicant_documents(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_processing_status(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_document_content(uuid, jsonb, text, decimal, jsonb) TO authenticated;

GRANT SELECT ON applicant_documents_complete TO authenticated;
GRANT SELECT ON applicant_documents_pending_processing TO authenticated;

-- =====================================================
-- PASO 9: AGREGAR COMENTARIOS
-- =====================================================

COMMENT ON TABLE applicant_document_types IS 'Tipos estandarizados de documentos para postulantes de arriendo';
COMMENT ON TABLE applicant_document_content IS 'Contenido estructurado extraído de documentos de postulantes';

COMMENT ON COLUMN documents.applicant_document_type_code IS 'Tipo específico de documento para postulante (referencia a applicant_document_types.code)';
COMMENT ON COLUMN documents.processing_status IS 'Estado del procesamiento del documento (uploaded, processing, processed, failed)';
COMMENT ON COLUMN documents.ocr_text IS 'Texto extraído del documento mediante OCR';
COMMENT ON COLUMN documents.metadata IS 'Metadatos adicionales del documento en formato JSON';

COMMENT ON COLUMN applicant_document_content.extracted_data IS 'Datos estructurados extraídos del documento en formato JSON';
COMMENT ON COLUMN applicant_document_content.confidence_score IS 'Puntuación de confianza de la extracción (0.00-1.00)';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
  tipos_count integer;
  content_count integer;
  docs_count integer;
BEGIN
  SELECT COUNT(*) INTO tipos_count FROM applicant_document_types;
  SELECT COUNT(*) INTO content_count FROM applicant_document_content;
  SELECT COUNT(*) INTO docs_count FROM documents WHERE applicant_id IS NOT NULL;

  RAISE NOTICE '✅ SISTEMATIZACIÓN COMPLETADA EXITOSAMENTE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTADÍSTICAS:';
  RAISE NOTICE '   📋 Tipos de documentos: %', tipos_count;
  RAISE NOTICE '   📄 Contenido extraído: %', content_count;
  RAISE NOTICE '   📁 Documentos de postulantes: %', docs_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 COMPONENTES INSTALADOS:';
  RAISE NOTICE '   ✅ Tabla applicant_document_types';
  RAISE NOTICE '   ✅ Tabla applicant_document_content';
  RAISE NOTICE '   ✅ Columnas requeridas en documents (applicant_id, uploader_user_id)';
  RAISE NOTICE '   ✅ Mejoras en tabla documents (processing_status, ocr_text, metadata)';
  RAISE NOTICE '   ✅ Índices de optimización';
  RAISE NOTICE '   ✅ Políticas RLS de seguridad';
  RAISE NOTICE '   ✅ Funciones para n8n';
  RAISE NOTICE '   ✅ Vistas para consultas';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FUNCIONES DISPONIBLES:';
  RAISE NOTICE '   - get_pending_applicant_documents(applicant_uuid, limit_count)';
  RAISE NOTICE '   - update_document_processing_status(document_uuid, new_status, ocr_content, metadata)';
  RAISE NOTICE '   - insert_document_content(document_uuid, content_data, extraction_method, confidence, extracted_fields)';
  RAISE NOTICE '';
  RAISE NOTICE '👁️ VISTAS DISPONIBLES:';
  RAISE NOTICE '   - applicant_documents_complete';
  RAISE NOTICE '   - applicant_documents_pending_processing';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASOS:';
  RAISE NOTICE '   1. Verificar con: SELECT * FROM applicant_documents_pending_processing LIMIT 5;';
  RAISE NOTICE '   2. Probar funciones con: SELECT get_pending_applicant_documents(NULL, 3);';
  RAISE NOTICE '   3. Configurar n8n para procesar documentos automáticamente';
  RAISE NOTICE '';
  RAISE NOTICE '🛠️ SCRIPTS DE PRUEBA:';
  RAISE NOTICE '   - test_applicant_documents_system.js';
  RAISE NOTICE '   - verificar_columnas_documents.sql';
  RAISE NOTICE '   - diagnostico_estructura_documental.sql';
END $$;
