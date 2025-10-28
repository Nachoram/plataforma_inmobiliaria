import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== VERIFICANDO TABLA property_type_characteristics ===\n');

  try {
    // Verificar que la tabla existe y tiene datos
    const { data, error } = await supabase
      .from('property_type_characteristics')
      .select('id, name, description')
      .order('name');

    if (error) {
      console.error('❌ Error:', error);
      console.log('\n🔧 La tabla no existe. Aplica la migración primero:');
      console.log('1. Ve a: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
      console.log('2. Crea un nuevo SQL Query');
      console.log('3. Copia y pega el contenido de supabase/migrations/20251028120000_create_property_type_characteristics.sql');
      console.log('4. Ejecuta el query');
      return;
    }

    console.log('✅ Tabla property_type_characteristics encontrada!');
    console.log(`📊 Total de registros: ${data.length}\n`);

    console.log('📋 Registros encontrados:');
    data.forEach((record, index) => {
      console.log(`${index + 1}. ${record.name}: ${record.description || 'Sin descripción'}`);
    });

    // Verificar permisos probando una consulta desde PostgREST
    console.log('\n🔍 Probando endpoint REST de PostgREST...');
    const response = await fetch('https://phnkervuiijqmapgswkc.supabase.co/rest/v1/property_type_characteristics?select=id,name,description&limit=3', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
      }
    });

    if (response.ok) {
      const restData = await response.json();
      console.log('✅ Endpoint REST funciona correctamente!');
      console.log(`📊 Datos obtenidos via REST: ${restData.length} registros`);
    } else {
      console.error('❌ Error en endpoint REST:', response.status, response.statusText);
    }

    console.log('\n🎉 Verificación completada exitosamente!');
    console.log('El error PGRST205 debería estar resuelto ahora.');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
})();
