// Crear propiedades de prueba con diferentes tipos
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function createTestProperties() {
  console.log('🏗️ Creando propiedades de prueba...');

  try {
    // Primero necesitamos crear un usuario de prueba o usar uno existente
    console.log('👤 Verificando usuarios existentes...');

    // Buscar usuarios existentes
    const { data: existingUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, email')
      .limit(1);

    let testUserId = null;

    if (!usersError && existingUsers && existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
      console.log('✅ Usando usuario existente:', existingUsers[0].first_name);
    } else {
      console.log('⚠️  No hay usuarios existentes. Creando usuario de prueba...');

      // Crear usuario de prueba usando auth
      try {
        const testEmail = `test${Date.now()}@example.com`; // Email único
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: testEmail,
          password: 'test123456'
        });

        if (authError) {
          console.log('❌ Error creando usuario:', authError.message);
          return;
        }

        if (authData.user) {
          testUserId = authData.user.id;
          console.log('✅ Usuario creado:', testUserId);

          // Crear perfil con RUT único
          const uniqueRut = `test${Date.now()}`;
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: testUserId,
              first_name: 'Usuario',
              paternal_last_name: 'Test',
              rut: uniqueRut,
              email: testEmail
            });

          if (profileError) {
            console.log('❌ Error creando perfil:', profileError.message);
          } else {
            console.log('✅ Perfil creado');
          }
        }
      } catch (authError) {
        console.log('❌ Error en auth:', authError.message);
        return;
      }
    }

    if (!testUserId) {
      console.log('❌ No se pudo obtener un user_id válido');
      return;
    }

    // Crear propiedades de prueba con diferentes tipos
    const testProperties = [
      {
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
      },
      {
        owner_id: testUserId,
        status: 'disponible',
        listing_type: 'venta',
        property_type: 'Bodega',
        tipo_propiedad: 'Bodega',
        address_street: 'Zona Industrial',
        address_number: '654',
        address_commune: 'Quilicura',
        address_region: 'Metropolitana',
        price_clp: 80000000,
        bedrooms: 0,
        bathrooms: 1,
        surface_m2: 300,
        description: 'Amplia bodega industrial'
      }
    ];

    console.log('📝 Creando 5 propiedades de prueba con diferentes tipos...');

    for (let i = 0; i < testProperties.length; i++) {
      const prop = testProperties[i];

      try {
        const { data, error } = await supabase
          .from('properties')
          .insert(prop)
          .select();

        if (error) {
          console.log(`❌ Error creando propiedad ${i+1} (${prop.property_type}):`, error.message);
        } else {
          console.log(`✅ Propiedad ${i+1} creada: ${prop.property_type} - ${prop.address_street}`);
        }
      } catch (insertError) {
        console.log(`❌ Error insertando propiedad ${i+1}:`, insertError.message);
      }
    }

    console.log('\n🎉 ¡Propiedades de prueba creadas!');
    console.log('📋 Credenciales de prueba:');
    console.log('   Email: [se generó automáticamente]');
    console.log('   Password: test123456');
    console.log('\n🔍 Ahora puedes probar el portfolio y deberías ver propiedades con diferentes tipos');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createTestProperties();
