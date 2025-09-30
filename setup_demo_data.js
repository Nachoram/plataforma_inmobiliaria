import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDemoData() {
  try {
    console.log('🚀 Configurando datos de demostración del contrato...\n');

    // 1. Crear usuarios usando auth
    console.log('👤 Creando usuarios...');

    let ownerAuth, tenantAuth;

    try {
      const ownerResult = await supabase.auth.signUp({
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
      ownerAuth = ownerResult;
      console.log('✅ Arrendador creado:', ownerResult.data.user?.email);
    } catch (error) {
      console.log('⚠️  Arrendador ya existe o error:', error.message);
      // Intentar obtener el usuario existente
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingOwner = existingUsers.users.find(u => u.email === 'carolina.soto@example.com');
      if (existingOwner) {
        ownerAuth = { data: { user: existingOwner } };
        console.log('✅ Usando arrendador existente');
      }
    }

    try {
      const tenantResult = await supabase.auth.signUp({
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
      tenantAuth = tenantResult;
      console.log('✅ Arrendatario creado:', tenantResult.data.user?.email);
    } catch (error) {
      console.log('⚠️  Arrendatario ya existe o error:', error.message);
      // Intentar obtener el usuario existente
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingTenant = existingUsers.users.find(u => u.email === 'carlos.soto@example.com');
      if (existingTenant) {
        tenantAuth = { data: { user: existingTenant } };
        console.log('✅ Usando arrendatario existente');
      }
    }

    const ownerId = ownerAuth?.data?.user?.id;
    const tenantId = tenantAuth?.data?.user?.id;

    if (!ownerId || !tenantId) {
      throw new Error('No se pudieron obtener los IDs de los usuarios');
    }

    console.log('📋 IDs obtenidos:');
    console.log('   Arrendador:', ownerId);
    console.log('   Arrendatario:', tenantId);
    console.log();

    // 2. Crear perfiles usando service role (bypassing RLS)
    console.log('👤 Creando perfiles...');

    const serviceClient = createClient(supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY'
    );

    // Arrendador
    const { error: ownerProfileError } = await serviceClient
      .from('profiles')
      .upsert({
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
      }, { onConflict: 'rut' });

    if (ownerProfileError) {
      console.error('❌ Error perfil arrendador:', ownerProfileError);
    } else {
      console.log('✅ Perfil arrendador creado');
    }

    // Arrendatario
    const { error: tenantProfileError } = await serviceClient
      .from('profiles')
      .upsert({
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
      }, { onConflict: 'rut' });

    if (tenantProfileError) {
      console.error('❌ Error perfil arrendatario:', tenantProfileError);
    } else {
      console.log('✅ Perfil arrendatario creado');
    }

    // 3. Crear aval
    console.log('🛡️ Creando aval...');

    const { error: guarantorError } = await serviceClient
      .from('guarantors')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440003',
        first_name: 'Rodolfo',
        paternal_last_name: 'Rrrrrrrr',
        maternal_last_name: 'Mmmmmm',
        rut: '44.444.444-4',
        profession: 'Abogado',
        monthly_income_clp: 3500000,
        address_street: 'Irarrazaval',
        address_number: '5350',
        address_department: '22',
        address_commune: 'Ñuñoa',
        address_region: 'Metropolitana'
      }, { onConflict: 'rut' });

    if (guarantorError) {
      console.error('❌ Error aval:', guarantorError);
    } else {
      console.log('✅ Aval creado');
    }

    // 4. Crear propiedad
    console.log('🏠 Creando propiedad...');

    const { error: propertyError } = await serviceClient
      .from('properties')
      .upsert({
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
      }, { onConflict: 'id' });

    if (propertyError) {
      console.error('❌ Error propiedad:', propertyError);
    } else {
      console.log('✅ Propiedad creada');
    }

    // 5. Crear aplicación
    console.log('📝 Creando aplicación...');

    const { error: applicationError } = await serviceClient
      .from('applications')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440005',
        property_id: '550e8400-e29b-41d4-a716-446655440004',
        applicant_id: tenantId,
        guarantor_id: '550e8400-e29b-41d4-a716-446655440003',
        status: 'aprobada',
        message: 'Excelente postulante, recomendado por conocidos. Tiene ingresos estables y referencias positivas.',
        snapshot_applicant_first_name: 'Carlos',
        snapshot_applicant_paternal_last_name: 'Soto',
        snapshot_applicant_maternal_last_name: 'Vega',
        snapshot_applicant_rut: '33.333.333-3',
        snapshot_applicant_email: 'carlos.soto@example.com',
        snapshot_applicant_phone: '+56987654321',
        snapshot_applicant_profession: 'Ingeniero',
        snapshot_applicant_monthly_income_clp: 4500000,
        snapshot_applicant_age: 35,
        snapshot_applicant_nationality: 'Chilena',
        snapshot_applicant_marital_status: 'soltero',
        snapshot_applicant_address_street: 'Los Leones',
        snapshot_applicant_address_number: '567',
        snapshot_applicant_address_commune: 'Providencia',
        snapshot_applicant_address_region: 'Metropolitana'
      }, { onConflict: 'id' });

    if (applicationError) {
      console.error('❌ Error aplicación:', applicationError);
    } else {
      console.log('✅ Aplicación creada');
    }

    // 6. Crear contrato
    console.log('📄 Creando contrato...');

    const contractContent = {
      header: { title: "Encabezado del Contrato", content: "## CONTRATO DE ARRENDAMIENTO RESIDENCIAL\\n\\nEn Santiago de Chile, a 29 de septiembre de 2025..." },
      conditions: { title: "Condiciones del Arriendo", content: "## CLÁUSULA SEGUNDA: OBJETO\\n\\nEl Arrendador da en arrendamiento... $1.600.000..." },
      obligations: { title: "Obligaciones de las Partes", content: "## GARANTÍA, AVAL Y CODEUDOR SOLIDARIO\\n\\n**Don Rodolfo Rrrrrrrr Mmmmmm**..." },
      termination: { title: "Terminación del Contrato", content: "## CLÁUSULA DE TERMINACIÓN\\n\\nEl contrato podrá terminarse por..." },
      signatures: { title: "Firmas Digitales", content: "## ESPACIOS PARA FIRMAS\\n\\n_____________________________\\nCarolina Andrea Soto Rojas..." }
    };

    const { error: contractError } = await serviceClient
      .from('rental_contracts')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440006',
        application_id: '550e8400-e29b-41d4-a716-446655440005',
        status: 'approved',
        contract_content: contractContent,
        created_by: ownerId,
        approved_by: ownerId,
        notes: 'Contrato generado automáticamente para demostración del sistema de contratos.'
      }, { onConflict: 'application_id' });

    if (contractError) {
      console.error('❌ Error contrato:', contractError);
    } else {
      console.log('✅ Contrato creado');
    }

    console.log('\n🎉 ¡Configuración completada exitosamente!');
    console.log('📋 Resumen:');
    console.log('   ✅ Usuarios creados');
    console.log('   ✅ Perfiles creados');
    console.log('   ✅ Aval creado');
    console.log('   ✅ Propiedad creada');
    console.log('   ✅ Aplicación creada');
    console.log('   ✅ Contrato creado');
    console.log();
    console.log('🌐 Para ver el contrato: /contract-canvas/550e8400-e29b-41d4-a716-446655440006');
    console.log();
    console.log('🔑 Credenciales de demo:');
    console.log('   Arrendador: carolina.soto@example.com / demo123456');
    console.log('   Arrendatario: carlos.soto@example.com / demo123456');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupDemoData();

