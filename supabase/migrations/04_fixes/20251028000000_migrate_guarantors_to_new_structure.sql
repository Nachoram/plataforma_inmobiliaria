-- ========================================================================
-- Migración: Actualizar estructura de tabla guarantors
-- Fecha: 2025-10-28
-- Descripción: Migrar de estructura antigua (first_name, email, phone) 
--              a nueva estructura (full_name, contact_email, contact_phone)
-- ========================================================================

-- PASO 1: Agregar nuevas columnas si no existen
ALTER TABLE guarantors 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS monthly_income numeric,
ADD COLUMN IF NOT EXISTS work_seniority_years integer,
ADD COLUMN IF NOT EXISTS address_id uuid,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- PASO 2: Migrar datos de columnas antiguas a nuevas (si existen columnas antiguas)
DO $$
BEGIN
    -- Verificar si existen las columnas antiguas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'guarantors' AND column_name = 'first_name'
    ) THEN
        -- Migrar full_name desde first_name + paternal_last_name + maternal_last_name
        UPDATE guarantors
        SET full_name = TRIM(
            COALESCE(first_name, '') || ' ' || 
            COALESCE(paternal_last_name, '') || ' ' || 
            COALESCE(maternal_last_name, '')
        )
        WHERE full_name IS NULL;
    END IF;

    -- Migrar email a contact_email
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'guarantors' AND column_name = 'email'
    ) THEN
        UPDATE guarantors
        SET contact_email = email
        WHERE contact_email IS NULL AND email IS NOT NULL;
    END IF;

    -- Migrar phone a contact_phone
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'guarantors' AND column_name = 'phone'
    ) THEN
        UPDATE guarantors
        SET contact_phone = phone
        WHERE contact_phone IS NULL AND phone IS NOT NULL;
    END IF;

    -- Migrar monthly_income_clp a monthly_income
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'guarantors' AND column_name = 'monthly_income_clp'
    ) THEN
        UPDATE guarantors
        SET monthly_income = monthly_income_clp
        WHERE monthly_income IS NULL AND monthly_income_clp IS NOT NULL;
    END IF;
END $$;

-- PASO 3: Establecer valores por defecto para columnas críticas antes de hacerlas NOT NULL
UPDATE guarantors
SET full_name = COALESCE(full_name, 'Nombre no especificado')
WHERE full_name IS NULL;

UPDATE guarantors
SET contact_email = COALESCE(contact_email, 'email@no-especificado.com')
WHERE contact_email IS NULL;

-- PASO 4: Hacer NOT NULL las columnas críticas después de asegurar que no hay NULLs
ALTER TABLE guarantors
ALTER COLUMN full_name SET NOT NULL,
ALTER COLUMN contact_email SET NOT NULL;

-- PASO 5: Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_guarantors_contact_email ON guarantors(contact_email);
CREATE INDEX IF NOT EXISTS idx_guarantors_rut ON guarantors(rut);

-- PASO 6: Agregar trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_guarantors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guarantors_updated_at_trigger ON guarantors;
CREATE TRIGGER guarantors_updated_at_trigger
    BEFORE UPDATE ON guarantors
    FOR EACH ROW
    EXECUTE FUNCTION update_guarantors_updated_at();

-- PASO 7: Agregar comentarios a las columnas
COMMENT ON COLUMN guarantors.full_name IS 'Nombre completo del garante';
COMMENT ON COLUMN guarantors.contact_email IS 'Email de contacto del garante';
COMMENT ON COLUMN guarantors.contact_phone IS 'Teléfono de contacto del garante';
COMMENT ON COLUMN guarantors.company IS 'Empresa donde trabaja el garante';
COMMENT ON COLUMN guarantors.monthly_income IS 'Ingreso mensual del garante';
COMMENT ON COLUMN guarantors.work_seniority_years IS 'Años de antigüedad laboral';

-- PASO 8: Verificación final
DO $$
DECLARE
    v_count integer;
BEGIN
    -- Contar registros con datos migrados correctamente
    SELECT COUNT(*) INTO v_count
    FROM guarantors
    WHERE full_name IS NOT NULL AND contact_email IS NOT NULL;

    RAISE NOTICE '✅ Migración completada: % registros de garantes migrados', v_count;
END $$;

-- ========================================================================
-- PASO 9: CREAR TABLAS DE CARACTERÍSTICAS PARA CONTRATOS
-- ========================================================================
-- Estas tablas son necesarias para el funcionamiento del sistema de generación de contratos

-- Crear tabla property_type_characteristics
CREATE TABLE IF NOT EXISTS property_type_characteristics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla rental_owner_characteristics
CREATE TABLE IF NOT EXISTS rental_owner_characteristics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rut TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_type_characteristics_name ON property_type_characteristics(name);
CREATE INDEX IF NOT EXISTS idx_rental_owner_characteristics_name ON rental_owner_characteristics(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rental_owner_characteristics_rut ON rental_owner_characteristics(rut);

-- Otorgar permisos
GRANT ALL ON property_type_characteristics TO authenticated;
GRANT ALL ON property_type_characteristics TO service_role;
GRANT ALL ON rental_owner_characteristics TO authenticated;
GRANT ALL ON rental_owner_characteristics TO service_role;

-- Agregar comentarios
COMMENT ON TABLE property_type_characteristics IS 'Características de tipos de propiedad para contratos';
COMMENT ON TABLE rental_owner_characteristics IS 'Características de propietarios para contratos';
COMMENT ON COLUMN property_type_characteristics.name IS 'Nombre del tipo de propiedad';
COMMENT ON COLUMN rental_owner_characteristics.name IS 'Nombre completo del propietario';
COMMENT ON COLUMN rental_owner_characteristics.rut IS 'RUT del propietario';

-- Crear triggers para updated_at
CREATE OR REPLACE FUNCTION update_characteristics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS property_type_characteristics_updated_at ON property_type_characteristics;
CREATE TRIGGER property_type_characteristics_updated_at
    BEFORE UPDATE ON property_type_characteristics
    FOR EACH ROW
    EXECUTE FUNCTION update_characteristics_updated_at();

DROP TRIGGER IF EXISTS rental_owner_characteristics_updated_at ON rental_owner_characteristics;
CREATE TRIGGER rental_owner_characteristics_updated_at
    BEFORE UPDATE ON rental_owner_characteristics
    FOR EACH ROW
    EXECUTE FUNCTION update_characteristics_updated_at();

-- ========================================================================
-- PASO 10: POBLAR TABLAS DE CARACTERÍSTICAS CON DATOS BÁSICOS
-- ========================================================================

-- Insertar tipos de propiedad básicos
INSERT INTO property_type_characteristics (name, description) VALUES
    ('Casa', 'Vivienda unifamiliar independiente'),
    ('Departamento', 'Unidad habitacional dentro de un edificio'),
    ('Oficina', 'Espacio destinado a actividades administrativas o comerciales'),
    ('Local Comercial', 'Espacio destinado a actividades comerciales'),
    ('Bodega', 'Espacio destinado al almacenamiento'),
    ('Estacionamiento', 'Espacio destinado al estacionamiento de vehículos')
ON CONFLICT (name) DO NOTHING;

-- Insertar propietarios de ejemplo (esto debería ser poblado con datos reales)
-- Nota: En producción, estos datos vendrían de la tabla rental_owners
INSERT INTO rental_owner_characteristics (name, rut, email, phone) VALUES
    ('Propietario Ejemplo 1', '12.345.678-9', 'propietario1@example.com', '+56912345678'),
    ('Propietario Ejemplo 2', '98.765.432-1', 'propietario2@example.com', '+56987654321')
ON CONFLICT (rut) DO NOTHING;

-- ========================================================================
-- PASO 11: VERIFICACIÓN FINAL DE TABLAS DE CARACTERÍSTICAS
-- ========================================================================
DO $$
DECLARE
    v_property_count integer;
    v_owner_count integer;
BEGIN
    SELECT COUNT(*) INTO v_property_count FROM property_type_characteristics;
    SELECT COUNT(*) INTO v_owner_count FROM rental_owner_characteristics;

    RAISE NOTICE '✅ Tablas de características creadas:';
    RAISE NOTICE '   - property_type_characteristics: % registros', v_property_count;
    RAISE NOTICE '   - rental_owner_characteristics: % registros', v_owner_count;
END $$;

