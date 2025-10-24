// Test para verificar la función RPC get_portfolio_with_postulations
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function testRPC() {
  console.log('🔍 Probando función RPC get_portfolio_with_postulations...');

  try {
    // Primero buscar un usuario existente
    console.log('👤 Buscando usuarios existentes...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, email')
      .limit(3);

    if (usersError) {
      console.log('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos');
      return;
    }

    const testUserId = users[0].id;
    console.log('✅ Usando usuario:', users[0].first_name, '-', testUserId);

    // Probar la función RPC
    console.log('🔍 Llamando función RPC...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_portfolio_with_postulations', {
        user_id_param: testUserId
      });

    if (rpcError) {
      console.log('❌ Error en función RPC:', rpcError);
      console.log('Detalle del error:', {
        message: rpcError.message,
        code: rpcError.code,
        details: rpcError.details,
        hint: rpcError.hint
      });
    } else {
      console.log('✅ Función RPC exitosa');
      console.log('📊 Número de propiedades:', rpcData ? rpcData.length : 0);

      if (rpcData && rpcData.length > 0) {
        console.log('📋 Propiedades encontradas:');
        rpcData.forEach((prop, index) => {
          console.log(`${index + 1}. ID: ${prop.id}`);
          console.log(`   Tipo: "${prop.property_type}"`);
          console.log(`   Dirección: ${prop.address_street} ${prop.address_number}`);
          console.log(`   Estado: ${prop.status}`);
          console.log('');
        });

        // Verificar si hay variedad en los tipos
        const tipos = rpcData.map(p => p.property_type).filter(Boolean);
        const tiposUnicos = [...new Set(tipos)];
        console.log('🎯 Tipos únicos encontrados:', tiposUnicos);

        if (tiposUnicos.length === 1 && tiposUnicos[0] === 'Casa') {
          console.log('⚠️  ¡PROBLEMA! Todas las propiedades tienen tipo "Casa"');
        } else if (tiposUnicos.length > 1) {
          console.log('✅ Los tipos de propiedad son variados');
        } else {
          console.log('⚠️  Solo hay un tipo de propiedad o algunos son null');
        }
      } else {
        console.log('⚠️  No hay propiedades para este usuario');

        // Verificar si hay propiedades en general
        console.log('🔍 Verificando propiedades en la tabla...');
        const { data: allProps, error: allPropsError } = await supabase
          .from('properties')
          .select('id, property_type, tipo_propiedad, owner_id, address_street')
          .limit(5);

        if (allPropsError) {
          console.log('❌ Error obteniendo propiedades:', allPropsError);
        } else {
          console.log('📊 Propiedades en tabla:', allProps ? allProps.length : 0);
          if (allProps && allProps.length > 0) {
            console.log('📋 Muestra de propiedades en tabla:');
            allProps.forEach((prop, index) => {
            console.log(`${index + 1}. ID: ${prop.id}`);
            console.log(`   tipo_propiedad: "${prop.tipo_propiedad}"`);
            console.log(`   property_type: "${prop.property_type}"`);
            console.log(`   owner_id: ${prop.owner_id}`);
            console.log(`   Dirección: ${prop.address_street}`);
              console.log('');
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testRPC();
