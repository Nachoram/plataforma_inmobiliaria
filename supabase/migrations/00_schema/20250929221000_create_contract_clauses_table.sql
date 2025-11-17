-- Crear tabla para almacenar cláusulas individuales de contratos
-- Esta tabla permite que N8N guarde cláusulas directamente en la base de datos
-- El canvas las lee y las agrupa en el formato JSONB del contract_content

CREATE TABLE IF NOT EXISTS contract_clauses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,

    -- Información de la cláusula
    clause_number VARCHAR(50) NOT NULL, -- "PRIMERA", "SEGUNDA", etc.
    clause_title TEXT NOT NULL, -- "COMPARECIENCIA", "OBJETO", etc.
    clause_content TEXT NOT NULL, -- Contenido completo de la cláusula

    -- Tipo de sección en el canvas (para mapeo automático)
    canvas_section VARCHAR(50) DEFAULT 'obligations', -- 'header', 'conditions', 'obligations', 'termination', 'signatures'

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_system VARCHAR(100) DEFAULT 'n8n', -- Sistema que creó la cláusula

    -- Orden de las cláusulas
    sort_order INTEGER DEFAULT 0,

    -- Constraints
    CONSTRAINT valid_canvas_section CHECK (
        canvas_section IN ('header', 'conditions', 'obligations', 'termination', 'signatures')
    )
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_contract_clauses_contract_id ON contract_clauses(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_canvas_section ON contract_clauses(canvas_section);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_clause_number ON contract_clauses(clause_number);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_sort_order ON contract_clauses(sort_order);

-- Políticas RLS (Row Level Security)
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;

-- Política para propietarios: pueden ver cláusulas de sus contratos
CREATE POLICY "Owners can view contract clauses" ON contract_clauses
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        JOIN properties p ON a.property_id = p.id
        WHERE rc.id = contract_clauses.contract_id
        AND p.owner_id = auth.uid()
    )
);

-- Política para postulantes: pueden ver cláusulas de sus contratos
CREATE POLICY "Applicants can view contract clauses" ON contract_clauses
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        WHERE rc.id = contract_clauses.contract_id
        AND a.applicant_id = auth.uid()
    )
);

-- Política para aval: pueden ver cláusulas de contratos donde son aval
CREATE POLICY "Guarantors can view contract clauses" ON contract_clauses
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        WHERE rc.id = contract_clauses.contract_id
        AND a.guarantor_id = auth.uid()
    )
);

-- Política para insertar: sistemas externos (como N8N) pueden insertar cláusulas
-- Nota: Esta política es más permisiva para automatización
CREATE POLICY "Systems can insert contract clauses" ON contract_clauses
FOR INSERT WITH CHECK (true);

-- Política para actualizar: propietarios pueden actualizar cláusulas de sus contratos
CREATE POLICY "Owners can update contract clauses" ON contract_clauses
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        JOIN properties p ON a.property_id = p.id
        WHERE rc.id = contract_clauses.contract_id
        AND p.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rental_contracts rc
        JOIN applications a ON rc.application_id = a.id
        JOIN properties p ON a.property_id = p.id
        WHERE rc.id = contract_clauses.contract_id
        AND p.owner_id = auth.uid()
    )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_clauses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_clauses_updated_at
    BEFORE UPDATE ON contract_clauses
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_clauses_updated_at();

-- Función para convertir cláusulas a formato JSONB del canvas
CREATE OR REPLACE FUNCTION get_contract_canvas_content(contract_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{
        "header": {"title": "Encabezado del Contrato", "content": ""},
        "conditions": {"title": "Condiciones del Arriendo", "content": ""},
        "obligations": {"title": "Obligaciones de las Partes", "content": ""},
        "termination": {"title": "Terminación del Contrato", "content": ""},
        "signatures": {"title": "Firmas Digitales", "content": ""}
    }';
    clause_record RECORD;
BEGIN
    -- Recorrer todas las cláusulas del contrato
    FOR clause_record IN
        SELECT clause_number, clause_title, clause_content, canvas_section
        FROM contract_clauses
        WHERE contract_id = contract_uuid
        ORDER BY sort_order, created_at
    LOOP
        -- Agregar la cláusula a la sección correspondiente
        result := jsonb_set(
            result,
            ARRAY[clause_record.canvas_section, 'content'],
            (result->clause_record.canvas_section->>'content' ||
             E'\n\n## CLÁUSULA ' || clause_record.clause_number || ': ' || clause_record.clause_title ||
             E'\n' || clause_record.clause_content)::jsonb
        );
    END LOOP;

    -- Limpiar contenido vacío
    result := jsonb_set(result, ARRAY['header', 'content'],
        trim(both E'\n' from (result->'header'->>'content'))::jsonb);
    result := jsonb_set(result, ARRAY['conditions', 'content'],
        trim(both E'\n' from (result->'conditions'->>'content'))::jsonb);
    result := jsonb_set(result, ARRAY['obligations', 'content'],
        trim(both E'\n' from (result->'obligations'->>'content'))::jsonb);
    result := jsonb_set(result, ARRAY['termination', 'content'],
        trim(both E'\n' from (result->'termination'->>'content'))::jsonb);
    result := jsonb_set(result, ARRAY['signatures', 'content'],
        trim(both E'\n' from (result->'signatures'->>'content'))::jsonb);

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para sincronizar cláusulas con contract_content JSONB
CREATE OR REPLACE FUNCTION sync_contract_canvas_content(contract_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE rental_contracts
    SET contract_content = get_contract_canvas_content(contract_uuid),
        updated_at = NOW(),
        version = version + 1
    WHERE id = contract_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE contract_clauses IS 'Cláusulas individuales de contratos almacenadas por N8N';
COMMENT ON COLUMN contract_clauses.contract_id IS 'Referencia al contrato padre';
COMMENT ON COLUMN contract_clauses.clause_number IS 'Número de la cláusula (PRIMERA, SEGUNDA, etc.)';
COMMENT ON COLUMN contract_clauses.clause_title IS 'Título descriptivo de la cláusula';
COMMENT ON COLUMN contract_clauses.canvas_section IS 'Sección del canvas donde se muestra (header, conditions, obligations, termination, signatures)';
COMMENT ON COLUMN contract_clauses.created_by_system IS 'Sistema que creó la cláusula (n8n, manual, etc.)';
COMMENT ON FUNCTION get_contract_canvas_content(UUID) IS 'Convierte cláusulas individuales al formato JSONB del canvas';
COMMENT ON FUNCTION sync_contract_canvas_content(UUID) IS 'Sincroniza las cláusulas con el contract_content JSONB';
