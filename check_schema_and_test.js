// Script para verificar esquema y probar función

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function checkSchema() {
  console.log('🔍 Verificando esquema de base de datos...\n');

  try {
    // Verificar tablas
    const tables = ['profiles', 'properties', 'applications'];

    for (const table of tables) {
      console.log(`📋 Verificando tabla: ${table}`);

      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Tabla existe (${data ? data.length : 0} registros encontrados)`);
        }
      } catch (err) {
        console.log(`   ❌ Error accediendo: ${err.message}`);
      }
    }

    // Verificar función
    console.log('\n🔧 Verificando función get_properties_with_postulation_count...');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname, pg_get_function_identity_arguments(oid) as parameters')
      .eq('proname', 'get_properties_with_postulation_count');

    if (funcError) {
      console.log(`   ❌ Error verificando función: ${funcError.message}`);
    } else if (functions && functions.length > 0) {
      console.log('   ✅ Función existe:');
      console.log(`      Nombre: ${functions[0].proname}`);
      console.log(`      Parámetros: ${functions[0].parameters}`);
    } else {
      console.log('   ❌ Función NO existe');
      console.log('   💡 Para crearla, ejecuta create_get_properties_with_postulation_count_function.sql');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

async function testWithExistingData() {
  console.log('\n🧪 Intentando probar función con datos existentes...\n');

  try {
    // Obtener algún owner_id existente
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('owner_id')
      .limit(1);

    if (propError || !properties || properties.length === 0) {
      console.log('⚠️ No hay propiedades en la base de datos para probar');
      return;
    }

    const testUserId = properties[0].owner_id;
    console.log(`🎯 Probando con user_id: ${testUserId}`);

    // Intentar ejecutar la función
    const { data: result, error: funcError } = await supabase
      .rpc('get_properties_with_postulation_count', {
        user_id_param: testUserId
      });

    if (funcError) {
      console.log(`❌ Error ejecutando función: ${funcError.message}`);
      console.log('💡 Asegúrate de crear la función primero');
    } else {
      console.log('✅ Función ejecutada exitosamente!');
      console.log(`📊 Resultados: ${result ? result.length : 0} propiedades`);
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar
async function main() {
  await checkSchema();
  await testWithExistingData();

  console.log('\n📋 === RESUMEN ===');
  console.log('1. Si la función no existe, créala ejecutando: create_get_properties_with_postulation_count_function.sql');
  console.log('2. Si no hay datos, la función funcionará pero retornará un array vacío');
  console.log('3. Una vez creada, puedes usarla desde tu aplicación con:');
  console.log(`
const { data, error } = await supabase
  .rpc('get_properties_with_postulation_count', {
    user_id_param: userId
  });
  `);
}

main();
