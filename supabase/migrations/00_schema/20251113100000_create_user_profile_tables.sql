-- =====================================================
-- MIGRACION: Sistema de Perfil de Usuario
-- Descripción: Tablas para documentos personales, avales 
--             propios y declaración de perfil de usuario
-- =====================================================

-- 1. Agregar campos de perfil y declaración al usuario en profiles
-- =====================================================

-- Extender la tabla profiles con campos de perfil profesional
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_profile_type TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_type TEXT; -- 'corredor_independiente', 'empresa_corretaje', 'buscar_arriendo', 'buscar_compra'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type TEXT; -- 'dependiente', 'independiente' (solo para persona natural)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_legal_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_rut TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS legal_representative_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS legal_representative_rut TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.user_profile_type IS 'Array de tipos de perfil: corredor_independiente, empresa_corretaje, buscar_arriendo, buscar_compra';
COMMENT ON COLUMN profiles.professional_type IS 'Tipo profesional principal del usuario';
COMMENT ON COLUMN profiles.employment_type IS 'Tipo de empleo para persona natural: dependiente o independiente';
COMMENT ON COLUMN profiles.company_legal_name IS 'Nombre legal de la empresa (si aplica)';
COMMENT ON COLUMN profiles.company_rut IS 'RUT de la empresa (si aplica)';
COMMENT ON COLUMN profiles.legal_representative_name IS 'Nombre del representante legal (si es empresa)';
COMMENT ON COLUMN profiles.legal_representative_rut IS 'RUT del representante legal (si es empresa)';

-- 2. Tabla: user_documents
-- =====================================================
-- Documentos personales del usuario (DICOM, carpeta tributaria, etc)

CREATE TABLE IF NOT EXISTS user_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_doc_type UNIQUE(user_id, doc_type)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_doc_type ON user_documents(doc_type);

COMMENT ON TABLE user_documents IS 'Documentos personales del usuario (DICOM, carpeta tributaria, etc)';
COMMENT ON COLUMN user_documents.doc_type IS 'Tipo de documento: dicom_personal, carpeta_tributaria, rut, escrituras, poderes, etc';

-- 3. Tabla: user_guarantors
-- =====================================================
-- Avales frecuentes/habituales del usuario

CREATE TABLE IF NOT EXISTS user_guarantors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos básicos
  entity_type text NOT NULL DEFAULT 'natural' CHECK (entity_type IN ('natural', 'juridica')),
  
  -- Persona Natural
  first_name text,
  paternal_last_name text,
  maternal_last_name text,
  rut text,
  employment_type text, -- 'dependiente', 'independiente' (solo para entity_type = 'natural')
  
  -- Persona Jurídica
  company_name text,
  company_rut text,
  legal_representative_name text,
  legal_representative_rut text,
  
  -- Datos adicionales
  profession text,
  monthly_income numeric,
  contact_email text,
  contact_phone text,
  
  -- Dirección
  address_street text,
  address_number text,
  address_department text,
  address_commune text,
  address_region text,
  unit_type text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_guarantors_user_id ON user_guarantors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_guarantors_entity_type ON user_guarantors(entity_type);

COMMENT ON TABLE user_guarantors IS 'Avales frecuentes/habituales asociados al usuario';
COMMENT ON COLUMN user_guarantors.entity_type IS 'Tipo de entidad: natural o juridica';

-- 4. Tabla: user_guarantor_documents
-- =====================================================
-- Documentos de los avales del usuario

CREATE TABLE IF NOT EXISTS user_guarantor_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_guarantor_id uuid NOT NULL REFERENCES user_guarantors(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_guarantor_doc_type UNIQUE(user_guarantor_id, doc_type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_guarantor_documents_guarantor_id ON user_guarantor_documents(user_guarantor_id);
CREATE INDEX IF NOT EXISTS idx_user_guarantor_documents_doc_type ON user_guarantor_documents(doc_type);

COMMENT ON TABLE user_guarantor_documents IS 'Documentos de los avales frecuentes del usuario';
COMMENT ON COLUMN user_guarantor_documents.doc_type IS 'Tipo de documento del aval';

-- 5. Triggers para updated_at
-- =====================================================

-- Trigger para user_documents
CREATE OR REPLACE FUNCTION update_user_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_documents_updated_at();

-- Trigger para user_guarantors
CREATE OR REPLACE FUNCTION update_user_guarantors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_guarantors_updated_at
  BEFORE UPDATE ON user_guarantors
  FOR EACH ROW
  EXECUTE FUNCTION update_user_guarantors_updated_at();

-- Trigger para user_guarantor_documents
CREATE OR REPLACE FUNCTION update_user_guarantor_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_guarantor_documents_updated_at
  BEFORE UPDATE ON user_guarantor_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_guarantor_documents_updated_at();

-- 6. Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guarantor_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para user_documents
CREATE POLICY "Users can view their own documents"
  ON user_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON user_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON user_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON user_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_guarantors
CREATE POLICY "Users can view their own guarantors"
  ON user_guarantors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guarantors"
  ON user_guarantors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guarantors"
  ON user_guarantors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guarantors"
  ON user_guarantors FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_guarantor_documents
CREATE POLICY "Users can view documents of their own guarantors"
  ON user_guarantor_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_guarantors
      WHERE user_guarantors.id = user_guarantor_documents.user_guarantor_id
      AND user_guarantors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents for their own guarantors"
  ON user_guarantor_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_guarantors
      WHERE user_guarantors.id = user_guarantor_documents.user_guarantor_id
      AND user_guarantors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents of their own guarantors"
  ON user_guarantor_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_guarantors
      WHERE user_guarantors.id = user_guarantor_documents.user_guarantor_id
      AND user_guarantors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents of their own guarantors"
  ON user_guarantor_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_guarantors
      WHERE user_guarantors.id = user_guarantor_documents.user_guarantor_id
      AND user_guarantors.user_id = auth.uid()
    )
  );

-- 7. Función helper para obtener perfil completo del usuario
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_profile_with_documents(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profile', (
      SELECT row_to_json(p.*)
      FROM profiles p
      WHERE p.id = p_user_id
    ),
    'documents', (
      SELECT COALESCE(jsonb_agg(row_to_json(d.*)), '[]'::jsonb)
      FROM user_documents d
      WHERE d.user_id = p_user_id
    ),
    'guarantors', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'guarantor', row_to_json(g.*),
          'documents', (
            SELECT COALESCE(jsonb_agg(row_to_json(gd.*)), '[]'::jsonb)
            FROM user_guarantor_documents gd
            WHERE gd.user_guarantor_id = g.id
          )
        )
      ), '[]'::jsonb)
      FROM user_guarantors g
      WHERE g.user_id = p_user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_user_profile_with_documents IS 'Obtiene el perfil completo del usuario con documentos y avales';

-- Conceder permisos
GRANT EXECUTE ON FUNCTION get_user_profile_with_documents TO authenticated;

