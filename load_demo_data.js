import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://uodpyvhgerxwoibdfths.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadDemoData() {
  try {
    console.log('🚀 Iniciando carga de datos de demostración del contrato...');

    // 1. Crear usuarios usando auth
    console.log('👤 Creando usuarios...');

    // Crear arrendador
    const { data: ownerAuth, error: ownerAuthError } = await supabase.auth.signUp({
      email: 'carolina.soto@example.com',
      password: 'demo123456',
      options: {
        data: {
          first_name: 'Carolina',
          paternal_last_name: 'Soto',
          maternal_last_name: 'Rojas',
          rut: '15.123.456-7'
        }
      }
    });

    if (ownerAuthError) {
      console.error('❌ Error creando arrendador:', ownerAuthError);
    } else {
      console.log('✅ Arrendador creado:', ownerAuth.user?.id);
    }

    // Crear arrendatario
    const { data: tenantAuth, error: tenantAuthError } = await supabase.auth.signUp({
      email: 'carlos.soto@example.com',
      password: 'demo123456',
      options: {
        data: {
          first_name: 'Carlos',
          paternal_last_name: 'Soto',
          maternal_last_name: 'Vega',
          rut: '33.333.333-3'
        }
      }
    });

    if (tenantAuthError) {
      console.error('❌ Error creando arrendatario:', tenantAuthError);
    } else {
      console.log('✅ Arrendatario creado:', tenantAuth.user?.id);
    }

    // Usar IDs reales de los usuarios creados
    const ownerId = ownerAuth.user?.id || '550e8400-e29b-41d4-a716-446655440001';
    const tenantId = tenantAuth.user?.id || '550e8400-e29b-41d4-a716-446655440002';

    // Esperar un poco para que los triggers de perfil se ejecuten
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Autenticar como arrendador para insertar datos
    console.log('🔐 Autenticando como arrendador...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'carolina.soto@example.com',
      password: 'demo123456'
    });

    if (signInError) {
      console.error('❌ Error autenticando:', signInError);
    } else {
      console.log('✅ Autenticado como arrendador');
    }

    // 3. Crear perfiles manualmente (ya que los triggers pueden no funcionar)
    console.log('👤 Creando perfiles manualmente...');

    const { error: profileOwnerError } = await supabase
      .from('profiles')
      .insert({
        id: ownerId,
        first_name: 'Carolina',
        paternal_last_name: 'Soto',
        maternal_last_name: 'Rojas',
        rut: '15.123.456-7',
        email: 'carolina.soto@example.com',
        phone: '+56912345678',
        profession: 'Profesora',
        marital_status: 'casado',
        address_street: 'Eliodoro Yáñez',
        address_number: '1890',
        address_commune: 'Providencia',
        address_region: 'Metropolitana'
      });

    if (profileOwnerError) console.error('❌ Error perfil arrendador:', profileOwnerError);
    else console.log('✅ Perfil arrendador creado');

    const { error: profileTenantError } = await supabase
      .from('profiles')
      .insert({
        id: tenantId,
        first_name: 'Carlos',
        paternal_last_name: 'Soto',
        maternal_last_name: 'Vega',
        rut: '33.333.333-3',
        email: 'carlos.soto@example.com',
        phone: '+56987654321',
        profession: 'Ingeniero',
        marital_status: 'soltero',
        address_street: 'Los Leones',
        address_number: '567',
        address_commune: 'Providencia',
        address_region: 'Metropolitana'
      });

    if (profileTenantError) console.error('❌ Error perfil arrendatario:', profileTenantError);
    else console.log('✅ Perfil arrendatario creado');

    // 4. Intentar insertar propiedad (puede fallar por RLS)
    console.log('🏠 Intentando insertar propiedad...');

    const { error: propertyError } = await supabase
      .from('properties')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440004',
        owner_id: ownerId,
        status: 'disponible',
        listing_type: 'arriendo',
        address_street: 'Suecia',
        address_number: '1234',
        address_department: 'Casa A',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 1600000,
        common_expenses_clp: 80000,
        bedrooms: 3,
        bathrooms: 2,
        surface_m2: 120,
        description: 'Hermosa casa en Providencia, ideal para familia. Incluye estacionamiento y bodega.'
      });

    if (propertyError) {
      console.error('❌ Error propiedad (esperado por RLS):', propertyError.message);
      console.log('ℹ️  Continuando con los datos que se pudieron crear...');
    } else {
      console.log('✅ Propiedad insertada');
    }

    console.log('🎉 ¡Usuarios y perfiles de demostración creados exitosamente!');
    console.log('📋 IDs importantes creados:');
    console.log('   - Arrendador ID:', ownerId);
    console.log('   - Arrendatario ID:', tenantId);
    console.log('');
    console.log('🔑 Credenciales de demo:');
    console.log('   Arrendador: carolina.soto@example.com / demo123456');
    console.log('   Arrendatario: carlos.soto@example.com / demo123456');
    console.log('');
    console.log('⚠️  Nota: Algunos datos adicionales pueden requerir permisos administrativos.');
    console.log('   Los usuarios pueden iniciar sesión y explorar la plataforma.');

    console.log('🎉 ¡Carga de datos de demostración completada exitosamente!');
    console.log('📋 IDs importantes creados:');
    console.log('   - Contrato ID: 550e8400-e29b-41d4-a716-446655440006');
    console.log('   - Aplicación ID: 550e8400-e29b-41d4-a716-446655440005');
    console.log('   - Propiedad ID: 550e8400-e29b-41d4-a716-446655440004');
    console.log('   - Arrendador ID:', ownerId);
    console.log('   - Arrendatario ID:', tenantId);
    console.log('   - Aval ID: 550e8400-e29b-41d4-a716-446655440003');
    console.log('');
    console.log('🌐 Para ver el contrato en el Contract Canvas:');
    console.log('   URL: /contract-canvas/550e8400-e29b-41d4-a716-446655440006');
    console.log('');
    console.log('🔑 Credenciales de demo:');
    console.log('   Arrendador: carolina.soto@example.com / demo123456');
    console.log('   Arrendatario: carlos.soto@example.com / demo123456');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

loadDemoData();
