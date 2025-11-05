// Aplicar la migración corregida de múltiples propietarios
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyPropertyOwnersMigration() {
  console.log('🚀 Aplicando migración corregida de múltiples propietarios...');

  // Conexión a Supabase
  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251104000000_create_property_owners_many_to_many_fixed.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración...');

    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      return;
    }

    console.log('✅ Migración aplicada exitosamente!');

    // Verificar que las tablas se crearon
    console.log('\n🔍 Verificando creación de tablas...');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['property_rental_owners', 'property_sale_owners']);

    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError);
    } else {
      console.log('📋 Tablas encontradas:', tables.map(t => t.table_name));
    }

    // Verificar datos migrados
    const { count: rentalCount, error: rentalError } = await supabase
      .from('property_rental_owners')
      .select('*', { count: 'exact', head: true });

    const { count: saleCount, error: saleError } = await supabase
      .from('property_sale_owners')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Registros en property_rental_owners: ${rentalCount || 0}`);
    console.log(`📊 Registros en property_sale_owners: ${saleCount || 0}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyPropertyOwnersMigration();
}

module.exports = { applyPropertyOwnersMigration };



