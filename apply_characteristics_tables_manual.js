import fs from 'fs';

console.log('=== MANUAL APPLICATION OF CHARACTERISTICS TABLES MIGRATION ===');
console.log('');
console.log('The exec_sql RPC function is not available. Please apply the migration manually:');
console.log('');
console.log('1. Go to: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
console.log('2. Create a new SQL query');
console.log('3. Copy and paste the following SQL:');
console.log('');
console.log('================================================================================');

const migrationSQL = `-- ========================================================================
-- CREAR TABLAS DE CARACTERÍSTICAS PARA CONTRATOS
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
-- POBLAR TABLAS DE CARACTERÍSTICAS CON DATOS BÁSICOS
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
-- VERIFICACIÓN FINAL DE TABLAS DE CARACTERÍSTICAS
-- ========================================================================
-- Para verificar que las tablas se crearon correctamente, ejecuta:
-- SELECT 'property_type_characteristics' as table_name, COUNT(*) as record_count FROM property_type_characteristics
-- UNION ALL
-- SELECT 'rental_owner_characteristics' as table_name, COUNT(*) as record_count FROM rental_owner_characteristics;
`;

console.log(migrationSQL);
console.log('================================================================================');
console.log('');
console.log('4. Execute the query');
console.log('5. Verify the tables were created by running:');
console.log('');
console.log('SELECT');
console.log('  \'property_type_characteristics\' as table_name,');
console.log('  COUNT(*) as record_count');
console.log('FROM property_type_characteristics');
console.log('UNION ALL');
console.log('SELECT');
console.log('  \'rental_owner_characteristics\' as table_name,');
console.log('  COUNT(*) as record_count');
console.log('FROM rental_owner_characteristics;');
console.log('');
console.log('Expected result:');
console.log('- property_type_characteristics: 6 records');
console.log('- rental_owner_characteristics: 2 records');
console.log('');
console.log('Once applied, the contract generation should work without the PGRST205 error.');
