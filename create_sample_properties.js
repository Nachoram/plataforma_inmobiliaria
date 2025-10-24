// Crear propiedades de muestra para probar el fix de tipo_propiedad
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function createSampleProperties() {
  console.log('🏗️ Creando propiedades de muestra con diferentes tipos...');

  try {
    // Primero verificar si hay usuarios, si no, crear uno
    let ownerId = null;

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name')
      .limit(1);

    if (!usersError && users && users.length > 0) {
      ownerId = users[0].id;
      console.log('✅ Usando usuario existente:', users[0].first_name, '-', ownerId);
    } else {
      // Crear usuario de prueba
      console.log('👤 Creando usuario de prueba...');

      const testEmail = `test${Date.now()}@example.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456'
      });

      if (authError || !authData.user) {
        console.log('❌ Error creando usuario:', authError?.message);
        return;
      }

      ownerId = authData.user.id;
      console.log('✅ Usuario creado:', ownerId);

      // Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: ownerId,
          first_name: 'Usuario',
          paternal_last_name: 'Prueba',
          rut: `test${Date.now()}`,
          email: testEmail
        });

      if (profileError) {
        console.log('❌ Error creando perfil:', profileError.message);
      } else {
        console.log('✅ Perfil creado');
      }

      // Esperar un poco para que se cree el perfil
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Crear propiedades con diferentes tipos_propiedad
    const sampleProperties = [
      {
        id: 'sample-prop-001',
        owner_id: ownerId,
        status: 'disponible',
        listing_type: 'venta',
        tipo_propiedad: 'Casa',
        property_type: 'Casa', // también poblar este por compatibilidad
        address_street: 'Avenida Providencia',
        address_number: '1234',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 250000000,
        bedrooms: 3,
        bathrooms: 2,
        surface_m2: 150,
        description: 'Hermosa casa familiar de 3 dormitorios en Providencia'
      },
      {
        id: 'sample-prop-002',
        owner_id: ownerId,
        status: 'disponible',
        listing_type: 'arriendo',
        tipo_propiedad: 'Departamento',
        property_type: 'Departamento',
        address_street: 'Calle Las Condes',
        address_number: '567',
        address_commune: 'Las Condes',
        address_region: 'Metropolitana',
        price_clp: 650000,
        bedrooms: 2,
        bathrooms: 1,
        surface_m2: 75,
        description: 'Moderno departamento de 2 dormitorios con vista'
      },
      {
        id: 'sample-prop-003',
        owner_id: ownerId,
        status: 'disponible',
        listing_type: 'venta',
        tipo_propiedad: 'Oficina',
        property_type: 'Oficina',
        address_street: 'Centro Empresarial',
        address_number: '890',
        address_commune: 'Santiago',
        address_region: 'Metropolitana',
        price_clp: 180000000,
        bedrooms: 0,
        bathrooms: 2,
        surface_m2: 120,
        description: 'Oficina premium en edificio corporativo del centro'
      },
      {
        id: 'sample-prop-004',
        owner_id: ownerId,
        status: 'disponible',
        listing_type: 'arriendo',
        tipo_propiedad: 'Estacionamiento',
        property_type: 'Estacionamiento',
        address_street: 'Edificio Torre Norte',
        address_number: '111',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 120000,
        bedrooms: 0,
        bathrooms: 0,
        surface_m2: 20,
        description: 'Estacionamiento techado en edificio residencial'
      }
    ];

    console.log('📝 Creando 4 propiedades de muestra...');

    for (const prop of sampleProperties) {
      const { error } = await supabase
        .from('properties')
        .upsert(prop, { onConflict: 'id' });

      if (error) {
        console.log(`❌ Error creando ${prop.tipo_propiedad}:`, error.message);
      } else {
        console.log(`✅ ${prop.tipo_propiedad} creada: ${prop.address_street}`);
      }
    }

    // Verificar que se crearon correctamente
    const { data: createdProps, error: checkError } = await supabase
      .from('properties')
      .select('id, tipo_propiedad, property_type, address_street')
      .eq('owner_id', ownerId);

    if (!checkError && createdProps) {
      console.log('\n📋 Propiedades creadas:');
      createdProps.forEach((p, i) => {
        console.log(`${i+1}. ${p.address_street} - tipo_propiedad: "${p.tipo_propiedad}"`);
      });
    }

    // Probar la función RPC
    console.log('\n🔍 Probando función RPC...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_portfolio_with_postulations', { user_id_param: ownerId });

    if (rpcError) {
      console.log('❌ Error en RPC:', rpcError.message);
    } else {
      console.log('✅ RPC exitosa. Propiedades:', rpcData?.length || 0);
      if (rpcData && rpcData.length > 0) {
        console.log('Tipos encontrados:');
        const tipos = rpcData.map(p => p.tipo_propiedad).filter(Boolean);
        console.log('Tipos únicos:', [...new Set(tipos)]);
      }
    }

    console.log('\n🎉 ¡Listo! Ahora ve a http://localhost:5174/portfolio para ver los tipos de propiedad');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSampleProperties();
