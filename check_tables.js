const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
  console.log('=== Verificando estructura de application_applicants ===');

  try {
    // Verificar si la tabla existe y qué columnas tiene
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'application_applicants')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.log('Error consultando information_schema:', error.message);
    } else {
      console.log('Columnas de application_applicants:');
      data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }
  } catch (error) {
    console.log('Error de conexión:', error.message);
  }

  console.log('\n=== Verificando estructura de application_guarantors ===');

  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'application_guarantors')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.log('Error consultando information_schema:', error.message);
    } else {
      console.log('Columnas de application_guarantors:');
      data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }
  } catch (error) {
    console.log('Error de conexión:', error.message);
  }
}

checkTableStructure();

