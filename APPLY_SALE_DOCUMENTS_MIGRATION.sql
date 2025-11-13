-- =====================================================
-- MIGRACIÓN COMPLETA: SISTEMA DE PROPIEDADES MULTIPROPIETARIO
-- Incluye: Propietarios múltiples, documentos y RLS completo
-- Fecha: 2025-11-13
-- =====================================================

-- Verificar si la columna 'role' existe en profiles, si no, agregarla

-- =====================================================
-- PREREQUISITOS: Agregar columna role si no existe
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'manager', 'user'));
        RAISE NOTICE 'Columna role agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna role ya existe en profiles';
    END IF;
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
-- ÍNDICES PARA DOCUMENTOS DE PROPIETARIOS
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
-- POLÍTICAS RLS PARA DOCUMENTOS DE PROPIETARIOS
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
-- TRIGGER PARA UPDATED_AT EN DOCUMENTOS DE PROPIETARIOS
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
-- COMENTARIOS EN LA TABLA DE DOCUMENTOS DE PROPIETARIOS
-- =====================================================

COMMENT ON TABLE sale_owner_documents IS 'Documentos específicos de cada propietario en ventas de propiedades';
COMMENT ON COLUMN sale_owner_documents.doc_type IS 'Tipo de documento requerido según el tipo de propietario';
COMMENT ON COLUMN sale_owner_documents.sale_owner_id IS 'Referencia al propietario específico';

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

DO $$
BEGIN
    -- Verificar que la columna role existe en profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        RAISE EXCEPTION 'La columna role no se agregó correctamente a la tabla profiles';
    END IF;

    -- Verificar que las tablas se crearon correctamente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'property_sale_documents'
    ) THEN
        RAISE EXCEPTION 'La tabla property_sale_documents no se creó correctamente';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sale_owner_documents'
    ) THEN
        RAISE EXCEPTION 'La tabla sale_owner_documents no se creó correctamente';
    END IF;

    -- Verificar que las políticas RLS están activas para property_sale_documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'property_sale_documents'
        AND policyname = 'Users can view sale documents for accessible properties'
    ) THEN
        RAISE EXCEPTION 'Las políticas RLS para property_sale_documents no se configuraron correctamente';
    END IF;

    -- Verificar que las políticas RLS están activas para sale_owner_documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sale_owner_documents'
        AND policyname = 'Users can view sale owner documents for their properties'
    ) THEN
        RAISE EXCEPTION 'Las políticas RLS para sale_owner_documents no se configuraron correctamente';
    END IF;

    RAISE NOTICE '✅ Migración completada exitosamente!';
    RAISE NOTICE '📋 Tabla property_sale_documents creada con políticas RLS';
    RAISE NOTICE '👥 Tabla sale_owner_documents creada con políticas RLS';
    RAISE NOTICE '👤 Columna role agregada a profiles si no existía';
    RAISE NOTICE '📄 Formulario de venta actualizado con multipropietario y documentos';
END $$;
