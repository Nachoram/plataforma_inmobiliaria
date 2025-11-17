-- Migration: 20251010 - Sistemización completa del sistema documental para postulantes de arriendo
-- Esta migración crea una estructura ordenada para manejar documentos de postulantes
-- y facilitar la extracción de contenido desde n8n

-- =====================================================
-- TABLA 1: TIPOS DE DOCUMENTOS PARA POSTULANTES
-- =====================================================

CREATE TABLE IF NOT EXISTS applicant_document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general', -- 'identification', 'financial', 'employment', 'other'
  is_required boolean DEFAULT false,
  max_files integer DEFAULT 1,
  allowed_mime_types text[] DEFAULT ARRAY['application/pdf', 'image/jpeg', 'image/png'],
  max_file_size_mb integer DEFAULT 10,
  processing_priority integer DEFAULT 0, -- Para ordenar procesamiento en n8n
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar tipos de documentos estandarizados para postulantes
INSERT INTO applicant_document_types (code, name, description, category, is_required, max_files, processing_priority) VALUES
  ('cedula_identidad', 'Cédula de Identidad', 'Documento de identidad oficial', 'identification', true, 2, 1),
  ('pasaporte', 'Pasaporte', 'Documento de identidad internacional', 'identification', false, 1, 2),
  ('informe_comercial', 'Informe Comercial', 'Reporte de comportamiento comercial', 'financial', true, 1, 3),
  ('liquidacion_sueldo', 'Liquidación de Sueldo', 'Comprobante de ingresos mensuales', 'employment', true, 3, 4),
  ('contrato_trabajo', 'Contrato de Trabajo', 'Contrato laboral actual', 'employment', false, 1, 5),
  ('certificado_antiguidad', 'Certificado de Antigüedad', 'Certificado de tiempo en el empleo actual', 'employment', false, 1, 6),
  ('extracto_bancario', 'Extracto Bancario', 'Estado de cuenta bancaria', 'financial', false, 3, 7),
  ('certificado_afp', 'Certificado AFP', 'Estado de cotizaciones previsionales', 'financial', false, 1, 8),
  ('declaracion_renta', 'Declaración de Renta', 'Declaración de impuestos anual', 'financial', false, 1, 9),
  ('certificado_matrimonio', 'Certificado de Matrimonio', 'Documento civil de estado civil', 'identification', false, 1, 10),
  ('certificado_nacimiento', 'Certificado de Nacimiento', 'Documento civil de hijos', 'identification', false, 5, 11),
  ('referencia_laboral', 'Referencia Laboral', 'Carta de referencia del empleador', 'employment', false, 2, 12),
  ('otro', 'Otro Documento', 'Documento adicional no categorizado', 'other', false, 10, 99)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- TABLA 2: CONTENIDO EXTRAÍDO DE DOCUMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS applicant_document_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE,
  document_type_code text NOT NULL REFERENCES applicant_document_types(code),

  -- Metadatos de extracción
  extracted_at timestamptz DEFAULT now(),
  extraction_method text DEFAULT 'manual', -- 'ocr', 'manual', 'api', 'ai'
  confidence_score decimal(3,2), -- 0.00 to 1.00
  processing_status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

  -- Contenido estructurado extraído
  extracted_data jsonb DEFAULT '{}',

  -- Campos específicos comunes
  full_name text,
  rut text,
  document_number text,
  issue_date date,
  expiry_date date,
  issuing_authority text,

  -- Campos financieros
  monthly_income numeric,
  employer_name text,
  employment_start_date date,

  -- Notas y observaciones
  notes text,
  validation_errors text[],

  -- Control de versiones
  version integer DEFAULT 1,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA 3: MEJORA DE LA TABLA DOCUMENTS
-- =====================================================

-- Agregar campos específicos para postulantes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS applicant_document_type_code text REFERENCES applicant_document_types(code);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_attempts integer DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_processed_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_text text; -- Texto extraído por OCR
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_applicant_document_types_category ON applicant_document_types(category);
CREATE INDEX IF NOT EXISTS idx_applicant_document_types_active ON applicant_document_types(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_applicant_document_content_applicant ON applicant_document_content(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_document ON applicant_document_content(document_id);
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_type ON applicant_document_content(document_type_code);
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_status ON applicant_document_content(processing_status);

CREATE INDEX IF NOT EXISTS idx_documents_applicant_type ON documents(applicant_document_type_code);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_last_processed ON documents(last_processed_at);

-- Índice GIN para búsqueda en JSON
CREATE INDEX IF NOT EXISTS idx_applicant_document_content_data ON applicant_document_content USING gin(extracted_data);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE applicant_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_document_content ENABLE ROW LEVEL SECURITY;

-- Políticas para tipos de documentos (solo lectura para usuarios autenticados)
CREATE POLICY "Authenticated users can read document types" ON applicant_document_types
  FOR SELECT TO authenticated USING (is_active = true);

-- Políticas para contenido de documentos
CREATE POLICY "Users can read document content for their applications" ON applicant_document_content
  FOR SELECT TO authenticated USING (
    applicant_id IN (
      SELECT a.id FROM applicants a
      WHERE a.user_id = auth.uid()
    ) OR
    document_id IN (
      SELECT d.id FROM documents d
      WHERE d.uploader_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document content for their applications" ON applicant_document_content
  FOR INSERT TO authenticated WITH CHECK (
    applicant_id IN (
      SELECT a.id FROM applicants a
      WHERE a.user_id = auth.uid()
    ) OR
    document_id IN (
      SELECT d.id FROM documents d
      WHERE d.uploader_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update document content for their applications" ON applicant_document_content
  FOR UPDATE TO authenticated USING (
    applicant_id IN (
      SELECT a.id FROM applicants a
      WHERE a.user_id = auth.uid()
    ) OR
    document_id IN (
      SELECT d.id FROM documents d
      WHERE d.uploader_user_id = auth.uid()
    )
  );

-- =====================================================
-- VISTAS PARA ACCESO DESDE N8N
-- =====================================================

-- Vista completa de documentos de postulantes con contenido extraído
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

  -- Información del tipo de documento
  adt.name as document_type_name,
  adt.category as document_type_category,
  adt.is_required as document_type_required,
  adt.processing_priority,

  -- Información del postulante
  a.id as applicant_id,
  a.full_name as applicant_name,
  a.rut as applicant_rut,
  a.contact_email,
  a.contact_phone,

  -- Contenido extraído
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

  -- Aplicación relacionada
  app.id as application_id,
  app.status as application_status,
  p.title as property_title

FROM documents d
LEFT JOIN applicant_document_types adt ON d.applicant_document_type_code = adt.code
LEFT JOIN applicants a ON d.applicant_id = a.id
LEFT JOIN applicant_document_content adc ON d.id = adc.document_id
LEFT JOIN applications app ON d.application_id = app.id
LEFT JOIN properties p ON app.property_id = p.id
WHERE d.applicant_id IS NOT NULL
ORDER BY d.uploaded_at DESC;

-- Vista de documentos pendientes de procesamiento
CREATE OR REPLACE VIEW applicant_documents_pending_processing AS
SELECT
  d.id,
  d.file_url,
  d.applicant_document_type_code,
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

-- =====================================================
-- FUNCIONES PARA N8N
-- =====================================================

-- Función para obtener documentos pendientes de un postulante específico
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

-- Función para actualizar estado de procesamiento de documento
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
  -- Validar status
  IF new_status NOT IN ('uploaded', 'processing', 'processed', 'failed') THEN
    RAISE EXCEPTION 'Invalid processing status: %', new_status;
  END IF;

  -- Obtener intentos actuales
  SELECT processing_attempts INTO current_attempts
  FROM documents WHERE id = document_uuid;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Actualizar documento
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

-- Función para insertar contenido extraído de documento
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

-- =====================================================
-- PERMISOS PARA N8N
-- =====================================================

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_pending_applicant_documents(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_processing_status(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_document_content(uuid, jsonb, text, decimal, jsonb) TO authenticated;

-- Otorgar permisos de lectura en vistas
GRANT SELECT ON applicant_documents_complete TO authenticated;
GRANT SELECT ON applicant_documents_pending_processing TO authenticated;

-- =====================================================
-- COMENTARIOS EN TABLAS
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
-- DATOS DE EJEMPLO PARA TESTING
-- =====================================================

-- Insertar algunos tipos de documentos adicionales específicos de Chile
INSERT INTO applicant_document_types (code, name, description, category, is_required, processing_priority) VALUES
  ('boleta_garantia', 'Boleta de Garantía', 'Boleta bancaria como garantía de arriendo', 'financial', false, 13),
  ('certificado_civil', 'Certificado Civil', 'Certificado de antecedentes civiles', 'identification', false, 14),
  ('pacto_comisorio', 'Pacto Comisorio', 'Acuerdo especial en contrato de arriendo', 'other', false, 15)
ON CONFLICT (code) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema documental para postulantes sistematizado exitosamente';
  RAISE NOTICE '📋 Tablas creadas: applicant_document_types, applicant_document_content';
  RAISE NOTICE '🔧 Funciones disponibles: get_pending_applicant_documents, update_document_processing_status, insert_document_content';
  RAISE NOTICE '👁️  Vistas disponibles: applicant_documents_complete, applicant_documents_pending_processing';
END $$;
