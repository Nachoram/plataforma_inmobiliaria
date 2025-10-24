// Script para verificar la conexión con Supabase y probar el fix del property_type
import { createClient } from '@supabase/supabase-js';

// Usar las mismas credenciales que el frontend
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Probando conexión con Supabase...');

  let testOwnerId = null;

  try {
    // Primero buscar usuarios existentes para usar como owner_id
    console.log('👤 Buscando usuarios existentes...');
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, email')
      .limit(5);

    if (!usersError && usersData && usersData.length > 0) {
      testOwnerId = usersData[0].id;
      console.log('✅ Usuario encontrado:', usersData[0].first_name, '-', testOwnerId);
    } else {
      console.log('⚠️  No se encontraron usuarios existentes');
    }

    // Ahora probar una consulta de propiedades
    const { data: testData, error: testError } = await supabase
      .from('properties')
      .select('id, property_type, address_street, owner_id')
      .limit(10);

    if (testError) {
      console.error('❌ Error conectando a Supabase:', testError);
      return;
    }

    console.log('✅ Conexión exitosa!');
    console.log('📊 Propiedades encontradas:', testData?.length || 0);

    // Mostrar los tipos de propiedad encontrados
    if (testData && testData.length > 0) {
      console.log('\n📋 Tipos de propiedad en la base de datos:');
      testData.forEach((prop, index) => {
        console.log(`${index + 1}. ID: ${prop.id}, Tipo: "${prop.property_type}", Dirección: ${prop.address_street}`);
      });

      // Verificar si hay propiedades con tipos diferentes a "Casa"
      const tiposUnicos = [...new Set(testData?.map(p => p.property_type).filter(Boolean))];
      console.log('\n🎯 Tipos únicos encontrados:', tiposUnicos);

      if (tiposUnicos.length === 1 && tiposUnicos[0] === 'Casa') {
        console.log('⚠️  ¡PROBLEMA! Todas las propiedades tienen tipo "Casa"');

        // Intentar actualizar algunas propiedades para probar diferentes tipos
        console.log('\n🔧 Intentando actualizar propiedades con diferentes tipos...');

        const ownerId = testData[0].owner_id;
        console.log('Usando owner_id:', ownerId);

        // Actualizar la primera propiedad a "Departamento"
        const { error: updateError1 } = await supabase
          .from('properties')
          .update({ property_type: 'Departamento' })
          .eq('id', testData[0].id);

        if (updateError1) {
          console.log('❌ Error actualizando propiedad 1:', updateError1);
        } else {
          console.log('✅ Propiedad 1 actualizada a "Departamento"');
        }

        // Actualizar la segunda propiedad a "Oficina" (si existe)
        if (testData.length > 1) {
          const { error: updateError2 } = await supabase
            .from('properties')
            .update({ property_type: 'Oficina' })
            .eq('id', testData[1].id);

          if (updateError2) {
            console.log('❌ Error actualizando propiedad 2:', updateError2);
          } else {
            console.log('✅ Propiedad 2 actualizada a "Oficina"');
          }
        }

        // Verificar los cambios
        console.log('\n🔍 Verificando cambios...');
        const { data: updatedData, error: verifyError } = await supabase
          .from('properties')
          .select('id, property_type, address_street')
          .in('id', testData.map(p => p.id));

        if (!verifyError && updatedData) {
          console.log('📋 Propiedades actualizadas:');
          updatedData.forEach((prop, index) => {
            console.log(`${index + 1}. ID: ${prop.id}, Tipo: "${prop.property_type}", Dirección: ${prop.address_street}`);
          });
        }

      } else {
        console.log('✅ Los tipos de propiedad son variados');
      }
    } else {
      console.log('⚠️  No hay propiedades en la base de datos. Necesitas crear datos de prueba.');

      // Crear propiedades de prueba con diferentes tipos
      if (testOwnerId) {
        console.log('\n🏗️ Creando propiedades de prueba...');

        const testProperties = [
          {
            owner_id: testOwnerId,
            status: 'active',
            listing_type: 'venta',
            property_type: 'Casa',
            address_street: 'Test Street 1',
            address_commune: 'Test Commune',
            address_region: 'Test Region',
            price_clp: 100000000,
            bedrooms: 3,
            bathrooms: 2,
            surface_m2: 100
          },
          {
            owner_id: testOwnerId,
            status: 'active',
            listing_type: 'arriendo',
            property_type: 'Departamento',
            address_street: 'Test Street 2',
            address_commune: 'Test Commune',
            address_region: 'Test Region',
            price_clp: 500000,
            bedrooms: 2,
            bathrooms: 1,
            surface_m2: 60
          },
          {
            owner_id: testOwnerId,
            status: 'active',
            listing_type: 'venta',
            property_type: 'Oficina',
            address_street: 'Test Street 3',
            address_commune: 'Test Commune',
            address_region: 'Test Region',
            price_clp: 200000000,
            bedrooms: 0,
            bathrooms: 2,
            surface_m2: 80
          }
        ];

        for (const prop of testProperties) {
          const { error: insertError } = await supabase
            .from('properties')
            .insert(prop);

          if (insertError) {
            console.log(`❌ Error creando propiedad ${prop.property_type}:`, insertError.message);
          } else {
            console.log(`✅ Propiedad ${prop.property_type} creada`);
          }
        }

        // Esperar un momento y luego verificar las propiedades creadas
        console.log('\n⏳ Esperando creación de propiedades...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: newProperties, error: checkError } = await supabase
          .from('properties')
          .select('id, property_type, address_street')
          .eq('owner_id', testOwnerId);

        if (!checkError && newProperties) {
          console.log('📋 Propiedades creadas:');
          newProperties.forEach((prop, index) => {
            console.log(`${index + 1}. ID: ${prop.id}, Tipo: "${prop.property_type}", Dirección: ${prop.address_street}`);
          });
        }
      } else {
        console.log('⚠️  No se puede crear propiedades de prueba sin un owner_id válido');
      }
    }

    // Probar la función RPC get_portfolio_with_postulations
    console.log('\n🔍 Probando función RPC get_portfolio_with_postulations...');

    // Usar el owner_id encontrado
    const ownerIdForRpc = testOwnerId || (testData && testData.length > 0 ? testData[0].owner_id : null);

    if (ownerIdForRpc) {
      const { data: portfolioData, error: portfolioError } = await supabase
        .rpc('get_portfolio_with_postulations', { user_id_param: ownerIdForRpc });

      if (portfolioError) {
        console.log('❌ Error en función RPC:', portfolioError);
      } else {
        console.log('✅ Función RPC ejecutada exitosamente');
        console.log('📊 Propiedades en portfolio:', portfolioData?.length || 0);

        if (portfolioData && portfolioData.length > 0) {
          console.log('\n📋 Resultados de get_portfolio_with_postulations:');
          portfolioData.forEach((prop, index) => {
            console.log(`${index + 1}. ID: ${prop.id}, Tipo: "${prop.property_type}", Dirección: ${prop.address_street}`);
          });
        }
      }
    } else {
      console.log('⚠️  No hay owner_id disponible para probar la función RPC');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la prueba
testConnection();
