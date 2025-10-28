import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== APPLYING CHARACTERISTICS TABLES MIGRATION ===');

  // SQL statements to execute
  const sqlStatements = [
    // PASO 9: CREAR TABLAS DE CARACTERÍSTICAS PARA CONTRATOS
    `CREATE TABLE IF NOT EXISTS property_type_characteristics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS rental_owner_characteristics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        rut TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Crear índices
    `CREATE INDEX IF NOT EXISTS idx_property_type_characteristics_name ON property_type_characteristics(name)`,
    `CREATE INDEX IF NOT EXISTS idx_rental_owner_characteristics_name ON rental_owner_characteristics(name)`,
    `CREATE INDEX IF NOT EXISTS idx_rental_owner_characteristics_rut ON rental_owner_characteristics(rut)`,

    // Otorgar permisos
    `GRANT ALL ON property_type_characteristics TO authenticated`,
    `GRANT ALL ON property_type_characteristics TO service_role`,
    `GRANT ALL ON rental_owner_characteristics TO authenticated`,
    `GRANT ALL ON rental_owner_characteristics TO service_role`,

    // Agregar comentarios
    `COMMENT ON TABLE property_type_characteristics IS 'Características de tipos de propiedad para contratos'`,
    `COMMENT ON TABLE rental_owner_characteristics IS 'Características de propietarios para contratos'`,
    `COMMENT ON COLUMN property_type_characteristics.name IS 'Nombre del tipo de propiedad'`,
    `COMMENT ON COLUMN rental_owner_characteristics.name IS 'Nombre completo del propietario'`,
    `COMMENT ON COLUMN rental_owner_characteristics.rut IS 'RUT del propietario'`,

    // Crear función para triggers
    `CREATE OR REPLACE FUNCTION update_characteristics_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`,

    // Crear triggers
    `DROP TRIGGER IF EXISTS property_type_characteristics_updated_at ON property_type_characteristics`,
    `CREATE TRIGGER property_type_characteristics_updated_at
        BEFORE UPDATE ON property_type_characteristics
        FOR EACH ROW
        EXECUTE FUNCTION update_characteristics_updated_at()`,

    `DROP TRIGGER IF EXISTS rental_owner_characteristics_updated_at ON rental_owner_characteristics`,
    `CREATE TRIGGER rental_owner_characteristics_updated_at
        BEFORE UPDATE ON rental_owner_characteristics
        FOR EACH ROW
        EXECUTE FUNCTION update_characteristics_updated_at()`,

    // Insertar tipos de propiedad básicos
    `INSERT INTO property_type_characteristics (name, description) VALUES
        ('Casa', 'Vivienda unifamiliar independiente'),
        ('Departamento', 'Unidad habitacional dentro de un edificio'),
        ('Oficina', 'Espacio destinado a actividades administrativas o comerciales'),
        ('Local Comercial', 'Espacio destinado a actividades comerciales'),
        ('Bodega', 'Espacio destinado al almacenamiento'),
        ('Estacionamiento', 'Espacio destinado al estacionamiento de vehículos')
    ON CONFLICT (name) DO NOTHING`,

    // Insertar propietarios de ejemplo
    `INSERT INTO rental_owner_characteristics (name, rut, email, phone) VALUES
        ('Propietario Ejemplo 1', '12.345.678-9', 'propietario1@example.com', '+56912345678'),
        ('Propietario Ejemplo 2', '98.765.432-1', 'propietario2@example.com', '+56987654321')
    ON CONFLICT (name) DO NOTHING`
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`\n--- Executing statement ${i + 1}/${sqlStatements.length} ---`);
    console.log(sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));

    try {
      // Try to execute via RPC first
      const { data, error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Don't stop on error, continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception executing statement ${i + 1}:`, err);
    }
  }

  // Verify the migration worked
  console.log('\n=== VERIFYING MIGRATION ===');

  // Check property_type_characteristics table
  const { data: propertyData, error: propertyError } = await supabase
    .from('property_type_characteristics')
    .select('id, name, description')
    .limit(5);

  if (propertyError) {
    console.error('❌ Error verifying property_type_characteristics:', propertyError);
  } else {
    console.log('✅ property_type_characteristics table created successfully');
    console.log('Sample data:', propertyData);
  }

  // Check rental_owner_characteristics table
  const { data: ownerData, error: ownerError } = await supabase
    .from('rental_owner_characteristics')
    .select('id, name, rut, email')
    .limit(5);

  if (ownerError) {
    console.error('❌ Error verifying rental_owner_characteristics:', ownerError);
  } else {
    console.log('✅ rental_owner_characteristics table created successfully');
    console.log('Sample data:', ownerData);
  }

  console.log('\n=== MIGRATION COMPLETE ===');
})();
