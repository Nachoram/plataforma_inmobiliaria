// Script para crear una propiedad de demo y resolver el error 500
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoProperty() {
  try {
    console.log('🏠 Creando propiedad de demostración...');

    // Primero, crear un usuario demo si no existe
    console.log('👤 Creando usuario demo...');

    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: 'demo@example.com',
      password: 'demo123456',
      options: {
        data: {
          first_name: 'Usuario',
          paternal_last_name: 'Demo',
          maternal_last_name: 'Test',
          rut: '12.345.678-9'
        }
      }
    });

    if (userError && !userError.message.includes('already registered')) {
      console.error('❌ Error creando usuario:', userError);
      return;
    }

    const userId = userData?.user?.id;
    if (!userId) {
      console.log('⚠️ Usuario ya existe, intentando obtener ID existente...');

      // Intentar hacer sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demo123456'
      });

      if (signInError) {
        console.error('❌ Error haciendo sign in:', signInError);
        return;
      }

      console.log('✅ Usuario autenticado');
    } else {
      console.log('✅ Usuario creado con ID:', userId);

      // Crear perfil para el usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: 'Usuario',
          paternal_last_name: 'Demo',
          maternal_last_name: 'Test',
          rut: '12.345.678-9',
          email: 'demo@example.com',
          phone: '+56912345678',
          profession: 'Profesional',
          marital_status: 'soltero',
          address_street: 'Avenida Principal',
          address_number: '123',
          address_commune: 'Santiago',
          address_region: 'Metropolitana'
        });

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError);
      } else {
        console.log('✅ Perfil creado');
      }

      // Hacer sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demo123456'
      });

      if (signInError) {
        console.error('❌ Error haciendo sign in:', signInError);
        return;
      }
    }

    // Obtener el usuario actual autenticado
    const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !currentUser) {
      console.error('❌ Error obteniendo usuario actual:', getUserError);
      return;
    }

    console.log('👤 Usuario actual:', currentUser.id);

    // Crear propiedad de demo
    const demoPropertyId = '550e8400-e29b-41d4-a716-446655440004'; // UUID válido

    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert({
        id: demoPropertyId,
        owner_id: currentUser.id,
        status: 'disponible',
        listing_type: 'arriendo',
        address_street: 'Avenida Providencia',
        address_number: '1234',
        address_department: null,
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 800000,
        common_expenses_clp: 50000,
        bedrooms: 2,
        bathrooms: 1,
        estacionamientos: 1,
        metros_utiles: 65,
        metros_totales: 70,
        ano_construccion: 2018,
        description: 'Hermoso departamento de 2 dormitorios en Providencia. Excelente ubicación, cerca del metro y comercios.'
      })
      .select()
      .single();

    if (propertyError) {
      console.error('❌ Error creando propiedad:', propertyError);
      console.log('💡 Posible causa: Políticas RLS impiden la inserción');
      console.log('💡 Solución: Ejecutar como administrador o modificar políticas RLS temporalmente');
      return;
    }

    console.log('✅ Propiedad creada exitosamente!');
    console.log('🏠 ID de propiedad:', demoPropertyId);
    console.log('👤 Owner ID:', userId);

    // Crear algunas imágenes de demo (opcional)
    const { error: imageError } = await supabase
      .from('property_images')
      .insert([
        {
          property_id: demoPropertyId,
          image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          storage_path: 'demo/image1.jpg'
        },
        {
          property_id: demoPropertyId,
          image_url: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800',
          storage_path: 'demo/image2.jpg'
        }
      ]);

    if (imageError) {
      console.log('⚠️ No se pudieron crear imágenes (puede ser normal):', imageError.message);
    } else {
      console.log('✅ Imágenes de demo creadas');
    }

    console.log('\n🎉 ¡Propiedad de demostración creada exitosamente!');
    console.log('📋 Información importante:');
    console.log('   - Propiedad ID:', demoPropertyId);
    console.log('   - URL para ver propiedad:', `/property/${demoPropertyId}`);
    console.log('   - Email demo: demo@example.com');
    console.log('   - Password demo: demo123456');
    console.log('\n🔧 Ahora puedes probar el AdminPropertyDetailView sin errores 500');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createDemoProperty();
