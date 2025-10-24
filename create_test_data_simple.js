// Crear datos de prueba usando service role para evitar restricciones
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
// Usar service role para poder crear datos sin restricciones RLS
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestData() {
  console.log('🏗️ Creando datos de prueba con service role...');

  try {
    // Crear un usuario de prueba directamente
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    const testEmail = 'testuser@example.com';

    // Primero verificar si ya existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', testUserId)
      .single();

    if (!existingUser) {
      console.log('👤 Creando usuario de prueba...');

      // Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: testUserId,
          first_name: 'Usuario',
          paternal_last_name: 'Prueba',
          rut: '12345678-9',
          email: testEmail,
          phone: '+56912345678'
        });

      if (profileError) {
        console.log('❌ Error creando perfil:', profileError.message);
        return;
      }
      console.log('✅ Perfil creado');
    } else {
      console.log('✅ Usuario ya existe');
    }

    // Crear propiedades de prueba
    const testProperties = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        owner_id: testUserId,
        status: 'disponible',
        listing_type: 'venta',
        property_type: 'Casa',
        tipo_propiedad: 'Casa',
        address_street: 'Calle Principal',
        address_number: '123',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 150000000,
        bedrooms: 3,
        bathrooms: 2,
        surface_m2: 120,
        description: 'Hermosa casa familiar en Providencia'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        owner_id: testUserId,
        status: 'disponible',
        listing_type: 'arriendo',
        property_type: 'Departamento',
        tipo_propiedad: 'Departamento',
        address_street: 'Avenida Las Condes',
        address_number: '456',
        address_commune: 'Las Condes',
        address_region: 'Metropolitana',
        price_clp: 800000,
        bedrooms: 2,
        bathrooms: 1,
        surface_m2: 80,
        description: 'Moderno departamento en Las Condes'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        owner_id: testUserId,
        status: 'disponible',
        listing_type: 'venta',
        property_type: 'Oficina',
        tipo_propiedad: 'Oficina',
        address_street: 'Centro Empresarial',
        address_number: '789',
        address_commune: 'Santiago',
        address_region: 'Metropolitana',
        price_clp: 300000000,
        bedrooms: 0,
        bathrooms: 2,
        surface_m2: 150,
        description: 'Oficina premium en el centro de Santiago'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        owner_id: testUserId,
        status: 'disponible',
        listing_type: 'arriendo',
        property_type: 'Estacionamiento',
        tipo_propiedad: 'Estacionamiento',
        address_street: 'Edificio Corporativo',
        address_number: '321',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 150000,
        bedrooms: 0,
        bathrooms: 0,
        surface_m2: 25,
        description: 'Estacionamiento privado en edificio corporativo'
      }
    ];

    console.log('📝 Creando propiedades de prueba...');

    for (const prop of testProperties) {
      const { error } = await supabase
        .from('properties')
        .upsert(prop, { onConflict: 'id' });

      if (error) {
        console.log(`❌ Error creando ${prop.tipo_propiedad}:`, error.message);
      } else {
        console.log(`✅ ${prop.tipo_propiedad} creada`);
      }
    }

    // Verificar las propiedades creadas
    const { data: properties, error: checkError } = await supabase
      .from('properties')
      .select('id, property_type, tipo_propiedad, address_street')
      .eq('owner_id', testUserId);

    if (!checkError && properties) {
      console.log('\n📋 Propiedades creadas:');
      properties.forEach((p, i) => {
        console.log(`${i+1}. ${p.address_street} - property_type: "${p.property_type}" - tipo_propiedad: "${p.tipo_propiedad}"`);
      });
    }

    // Probar la función RPC
    console.log('\n🔍 Probando función RPC...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_portfolio_with_postulations', { user_id_param: testUserId });

    if (rpcError) {
      console.log('❌ Error en RPC:', rpcError.message);
    } else {
      console.log('✅ RPC funciona correctamente');
      console.log('📊 Propiedades encontradas:', rpcData?.length || 0);

      if (rpcData && rpcData.length > 0) {
        console.log('🎯 Tipos encontrados:');
        const tipos = rpcData.map(p => p.property_type);
        console.log('Tipos únicos:', [...new Set(tipos)]);
      }
    }

    console.log('\n🎉 ¡Datos de prueba creados exitosamente!');
    console.log('📋 Para probar:');
    console.log('   1. Ve a http://localhost:5174');
    console.log('   2. Inicia sesión con cualquier usuario existente');
    console.log('   3. Ve al portfolio y deberías ver propiedades con diferentes tipos');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestData();
