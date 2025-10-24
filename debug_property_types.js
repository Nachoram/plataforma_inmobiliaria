// Debug para verificar por qué no aparecen los tipos de propiedad
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function debugPropertyTypes() {
  console.log('🔍 Debug: Verificando por qué no aparecen tipos de propiedad...');

  try {
    // 1. Verificar propiedades existentes
    console.log('\n1. 📊 Verificando propiedades en tabla...');
    const { data: props, error: propsError } = await supabase
      .from('properties')
      .select('id, tipo_propiedad, property_type, address_street, owner_id')
      .limit(5);

    if (propsError) {
      console.log('❌ Error obteniendo propiedades:', propsError);
      return;
    }

    console.log('Propiedades encontradas:', props?.length || 0);

    if (props && props.length > 0) {
      props.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p.id}`);
        console.log(`   tipo_propiedad: "${p.tipo_propiedad}" (${typeof p.tipo_propiedad})`);
        console.log(`   property_type: "${p.property_type}" (${typeof p.property_type})`);
        console.log(`   owner_id: ${p.owner_id}`);
        console.log('');
      });

      // 2. Probar función RPC
      console.log('2. 🔍 Probando función RPC...');
      const ownerId = props[0].owner_id;

      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_portfolio_with_postulations', { user_id_param: ownerId });

      if (rpcError) {
        console.log('❌ Error en función RPC:', rpcError.message);
        console.log('Código de error:', rpcError.code);
        console.log('Detalles:', rpcError.details);
      } else {
        console.log('✅ Función RPC ejecutada correctamente');
        console.log('Propiedades devueltas:', rpcData?.length || 0);

        if (rpcData && rpcData.length > 0) {
          console.log('\n📋 Resultados de la función RPC:');
          rpcData.forEach((p, i) => {
            console.log(`${i+1}. ID: ${p.id}`);
            console.log(`   tipo_propiedad: "${p.tipo_propiedad}" (${typeof p.tipo_propiedad})`);
            console.log(`   address_street: ${p.address_street}`);
            console.log('');
          });

          // Verificar si el problema está en el COALESCE
          console.log('3. 🔧 Verificando lógica COALESCE...');
          const testProp = props[0];
          const coalesceResult = testProp.tipo_propiedad || testProp.property_type;
          console.log(`COALESCE(${testProp.tipo_propiedad}, ${testProp.property_type}) = "${coalesceResult}"`);

        } else {
          console.log('⚠️  La función RPC no devolvió propiedades para este owner_id');
          console.log('Owner ID usado:', ownerId);
        }
      }
    } else {
      console.log('⚠️  No hay propiedades en la base de datos');
      console.log('💡 Necesitas crear propiedades de prueba');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

debugPropertyTypes();
