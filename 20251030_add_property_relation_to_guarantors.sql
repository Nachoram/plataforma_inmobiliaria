-- Migración: Agregar relación directa entre guarantors y properties
-- Fecha: 2025-10-30
-- Descripción: Los guarantors ahora se ligan directamente con properties y mantienen relación con applications

-- =====================================================
-- STEP 1: AGREGAR COLUMNA PROPERTY_ID A GUARANTORS
-- =====================================================

-- Agregar columna property_id a la tabla guarantors
ALTER TABLE guarantors
ADD COLUMN property_id uuid REFERENCES properties(id) ON DELETE CASCADE;

-- Agregar comentario a la nueva columna
COMMENT ON COLUMN guarantors.property_id IS 'ID de la propiedad que este garante respalda directamente';

-- =====================================================
-- STEP 2: ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Para los guarantors que ya existen en applications, asignarles la property_id correspondiente
UPDATE guarantors
SET property_id = applications.property_id
FROM applications
WHERE guarantors.id = applications.guarantor_id
AND guarantors.property_id IS NULL;

-- =====================================================
-- STEP 3: CREAR ÍNDICES PARA LA NUEVA RELACIÓN
-- =====================================================

-- Índice para búsquedas por property_id
CREATE INDEX IF NOT EXISTS idx_guarantors_property_id ON guarantors(property_id);

-- Índice compuesto para property_id y created_at (útil para listados)
CREATE INDEX IF NOT EXISTS idx_guarantors_property_created ON guarantors(property_id, created_at);

-- =====================================================
-- STEP 4: ACTUALIZAR POLÍTICAS RLS
-- =====================================================

-- Eliminar la política anterior de guarantors que era demasiado restrictiva
DROP POLICY IF EXISTS "Users can view guarantors for their applications" ON guarantors;
DROP POLICY IF EXISTS "Users can update guarantors for their applications" ON guarantors;

-- Nueva política: Los propietarios pueden ver guarantors de sus propiedades
CREATE POLICY "Property owners can view guarantors for their properties"
  ON guarantors FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Nueva política: Los postulantes pueden ver guarantors de sus postulaciones
CREATE POLICY "Applicants can view guarantors for their applications"
  ON guarantors FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications
      WHERE applicant_id = auth.uid()
    )
  );

-- Política para insertar guarantors (cualquier usuario autenticado puede crear)
CREATE POLICY "Users can insert guarantors"
  ON guarantors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Nueva política: Los propietarios pueden actualizar guarantors de sus propiedades
CREATE POLICY "Property owners can update guarantors for their properties"
  ON guarantors FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Nueva política: Los postulantes pueden actualizar guarantors de sus postulaciones
CREATE POLICY "Applicants can update guarantors for their applications"
  ON guarantors FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications
      WHERE applicant_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 5: CREAR FUNCIÓN HELPER PARA OBTENER GUARANTORS POR PROPIEDAD
-- =====================================================

CREATE OR REPLACE FUNCTION get_guarantors_for_property(property_uuid uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  paternal_last_name text,
  maternal_last_name text,
  rut varchar(12),
  profession text,
  monthly_income_clp bigint,
  address_street text,
  address_number varchar(10),
  address_department varchar(10),
  address_commune text,
  address_region text,
  created_at timestamptz,
  applications_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.first_name,
    g.paternal_last_name,
    g.maternal_last_name,
    g.rut,
    g.profession,
    g.monthly_income_clp,
    g.address_street,
    g.address_number,
    g.address_department,
    g.address_commune,
    g.address_region,
    g.created_at,
    COUNT(a.id)::bigint as applications_count
  FROM guarantors g
  LEFT JOIN applications a ON g.id = a.guarantor_id
  WHERE g.property_id = property_uuid
  GROUP BY g.id, g.first_name, g.paternal_last_name, g.maternal_last_name, g.rut,
           g.profession, g.monthly_income_clp, g.address_street, g.address_number,
           g.address_department, g.address_commune, g.address_region, g.created_at
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para la nueva función
GRANT EXECUTE ON FUNCTION get_guarantors_for_property(uuid) TO authenticated;

-- =====================================================
-- STEP 6: ACTUALIZAR VISTA APPLICATIONS_COMPLETE_VIEW
-- =====================================================

-- Recrear la vista para incluir información de property_id de guarantors
DROP VIEW IF EXISTS applications_complete_view;
CREATE OR REPLACE VIEW applications_complete_view AS
SELECT
  a.id,
  a.property_id,
  a.applicant_id,
  a.guarantor_id,
  a.status,
  a.message,
  a.created_at,
  -- Property information
  CONCAT(p.address_street, ' ', p.address_number, ', ', p.address_commune) as property_address,
  p.price_clp as property_price,
  p.listing_type,
  -- Applicant information
  CONCAT(prof.first_name, ' ', prof.paternal_last_name) as applicant_name,
  prof.email as applicant_email,
  prof.phone as applicant_phone,
  a.snapshot_applicant_profession,
  a.snapshot_applicant_monthly_income_clp,
  -- Guarantor information (ahora con property_id directo)
  g.first_name as guarantor_first_name,
  g.paternal_last_name as guarantor_last_name,
  g.rut as guarantor_rut,
  g.profession as guarantor_profession,
  g.monthly_income_clp as guarantor_income,
  g.property_id as guarantor_property_id
FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
LEFT JOIN profiles prof ON a.applicant_id = prof.id
LEFT JOIN guarantors g ON a.guarantor_id = g.id;

-- =====================================================
-- STEP 7: AGREGAR VALIDACIÓN PARA ASEGURAR CONSISTENCIA
-- =====================================================

-- Crear función para validar que el guarantor pertenezca a la propiedad correcta
CREATE OR REPLACE FUNCTION validate_guarantor_property_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está insertando/actualizando una application con guarantor_id
  IF NEW.guarantor_id IS NOT NULL THEN
    -- Verificar que el guarantor pertenezca a la misma propiedad
    IF NOT EXISTS (
      SELECT 1 FROM guarantors
      WHERE id = NEW.guarantor_id
      AND property_id = NEW.property_id
    ) THEN
      RAISE EXCEPTION 'El garante debe pertenecer a la misma propiedad de la postulación';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validar consistencia
CREATE OR REPLACE TRIGGER validate_guarantor_application_consistency
  BEFORE INSERT OR UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION validate_guarantor_property_consistency();

-- =====================================================
-- STEP 8: COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE guarantors IS 'Garante/co-signer information linked directly to properties and applications';
COMMENT ON COLUMN guarantors.property_id IS 'Direct reference to the property this guarantor supports';
COMMENT ON FUNCTION get_guarantors_for_property(uuid) IS 'Obtiene todos los garantes asociados a una propiedad específica junto con el conteo de postulaciones';

-- =====================================================
-- MIGRACIÓN COMPLETA
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Relación directa guarantors-properties agregada';
  RAISE NOTICE 'Nueva columna: guarantors.property_id';
  RAISE NOTICE 'Nueva función: get_guarantors_for_property(uuid)';
  RAISE NOTICE 'Políticas RLS actualizadas para nueva estructura';
  RAISE NOTICE 'Validación de consistencia implementada';
END $$;











