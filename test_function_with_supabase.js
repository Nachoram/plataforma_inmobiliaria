// Script para probar la función get_properties_with_postulation_count usando el cliente de Supabase

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (mismas credenciales que el frontend)
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'test-script'
    }
  }
});

async function testFunction() {
  console.log('🚀 === PROBANDO FUNCIÓN get_properties_with_postulation_count ===\n');

  try {
    // Paso 1: Obtener un user_id de prueba
    console.log('📋 Paso 1: Buscando un user_id de prueba...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, paternal_last_name')
      .limit(3);

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No se encontraron perfiles. Necesitas crear algunos usuarios primero.');
      return;
    }

    console.log('✅ Perfiles encontrados:');
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.email} (${profile.first_name} ${profile.paternal_last_name}) - ID: ${profile.id}`);
    });

    // Usar el primer perfil encontrado
    const testUserId = profiles[0].id;
    console.log(`\n🎯 Usando user_id de prueba: ${testUserId}\n`);

    // Paso 2: Ejecutar la función
    console.log('📋 Paso 2: Ejecutando función get_properties_with_postulation_count...');
    const { data: result, error: functionError } = await supabase
      .rpc('get_properties_with_postulation_count', {
        user_id_param: testUserId
      });

    if (functionError) {
      console.error('❌ Error ejecutando función:', functionError);

      // Verificar si la función existe
      console.log('\n🔍 Verificando si la función existe en la base de datos...');
      const { data: functions, error: funcCheckError } = await supabase
        .from('pg_proc')
        .select('proname, pg_get_function_identity_arguments(oid) as parameters, obj_description(oid, \'pg_proc\') as description')
        .eq('proname', 'get_properties_with_postulation_count');

      if (funcCheckError) {
        console.error('❌ Error verificando función:', funcCheckError);
      } else if (functions && functions.length > 0) {
        console.log('✅ La función existe en la base de datos:');
        console.log(functions[0]);
      } else {
        console.log('❌ La función NO existe en la base de datos. Necesitas crearla primero.');
        console.log('💡 Ejecuta el archivo create_get_properties_with_postulation_count_function.sql en tu base de datos.');
      }
      return;
    }

    // Paso 3: Mostrar resultados
    console.log('✅ Función ejecutada exitosamente!\n');

    if (!result || result.length === 0) {
      console.log('📭 El usuario no tiene propiedades registradas.');
      return;
    }

    console.log(`📊 Resultados encontrados: ${result.length} propiedad(es)\n`);

    result.forEach((property, index) => {
      console.log(`🏠 Propiedad ${index + 1}:`);
      console.log(`   📍 Dirección: ${property.address_street} ${property.address_number}`);
      console.log(`   🏙️ Ubicación: ${property.address_commune}, ${property.address_region}`);
      console.log(`   💰 Precio: $${property.price_clp.toLocaleString('es-CL')} CLP`);
      console.log(`   🛏️ Habitaciones: ${property.bedrooms} | 🛁 Baños: ${property.bathrooms}`);
      console.log(`   📝 Estado: ${property.status} | Tipo: ${property.listing_type}`);
      console.log(`   📊 Postulaciones: ${property.postulation_count}`);
      console.log(`   🆔 ID: ${property.id}`);
      console.log('');
    });

    // Paso 4: Estadísticas adicionales
    const totalProperties = result.length;
    const totalPostulations = result.reduce((sum, prop) => sum + parseInt(prop.postulation_count), 0);
    const propertiesWithPostulations = result.filter(prop => prop.postulation_count > 0).length;

    console.log('📈 === ESTADÍSTICAS ===');
    console.log(`🏠 Total de propiedades: ${totalProperties}`);
    console.log(`📧 Total de postulaciones: ${totalPostulations}`);
    console.log(`📊 Propiedades con postulaciones: ${propertiesWithPostulations}`);
    console.log(`📊 Propiedades sin postulaciones: ${totalProperties - propertiesWithPostulations}`);

    if (totalProperties > 0) {
      console.log(`📈 Promedio de postulaciones por propiedad: ${(totalPostulations / totalProperties).toFixed(1)}`);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la prueba
testFunction();
