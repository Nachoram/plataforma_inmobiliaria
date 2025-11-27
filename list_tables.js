import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  console.log('📋 Verificando tablas disponibles...\n');

  const tablesToCheck = [
    'properties',
    'property_sale_offers',
    'profiles',
    'tasks',
    'timeline',
    'formal_requests',
    'communications'
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Tabla '${table}': ${error.message}`);
      } else {
        console.log(`✅ Tabla '${table}': Existe (${data?.length || 0} registros encontrados)`);
      }
    } catch (err) {
      console.log(`❌ Tabla '${table}': Error inesperado - ${err.message}`);
    }
  }

  console.log('\n🔍 Intentando listar todas las tablas disponibles...');
  try {
    // Intentar una consulta simple que podría listar tablas
    const { data, error } = await supabase.rpc('get_table_list');

    if (error) {
      console.log('❌ No se puede listar tablas automáticamente:', error.message);
      console.log('💡 Necesitas aplicar las migraciones de Supabase primero.');
      console.log('🔧 Ejecuta: supabase db push');
      console.log('📁 O verifica que las migraciones estén en supabase/migrations/');
    } else {
      console.log('📋 Tablas encontradas:', data);
    }
  } catch (err) {
    console.log('❌ Error listando tablas:', err.message);
  }
}

listTables();
