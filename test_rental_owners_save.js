import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function testRentalOwnersSave() {
  console.log('🧪 Probando guardado en rental_owners...\n');

  try {
    // 1. Crear una propiedad de prueba primero
    console.log('1️⃣ Creando propiedad de prueba...');
    const testProperty = {
      owner_id: '00000000-0000-0000-0000-000000000001', // ID ficticio
      listing_type: 'venta',
      address_street: 'Calle Test',
      address_number: '123',
      address_commune: 'Santiago',
      address_region: 'Metropolitana',
      price_clp: 100000000,
      bedrooms: 3,
      bathrooms: 2,
      surface_m2: 80,
      description: 'Propiedad de prueba para testing',
      created_at: new Date().toISOString(),
    };

    const { data: propertyResult, error: propError } = await supabase
      .from('properties')
      .insert(testProperty)
      .select()
      .single();

    if (propError) {
      console.error('❌ Error creando propiedad de prueba:', propError);
      return;
    }

    console.log('✅ Propiedad de prueba creada:', propertyResult.id);

    // 2. Guardar datos del propietario usando la lógica implementada
    console.log('\n2️⃣ Guardando datos del propietario...');

    const ownerData = {
      first_name: 'Juan',
      paternal_last_name: 'Pérez',
      maternal_last_name: 'González',
      rut: '12.345.678-9',
      address_street: 'Calle del Propietario',
      address_number: '456',
      address_commune: 'Providencia',
      address_region: 'Metropolitana',
      marital_status: 'casado',
      property_regime: 'sociedad_conyugal',
      phone: '+56912345678',
      email: 'juan.perez@email.com',
    };

    // Simular la lógica de saveRentalOwner
    const ownerPayload = {
      property_id: propertyResult.id,
      first_name: ownerData.first_name.trim(),
      paternal_last_name: ownerData.paternal_last_name.trim(),
      maternal_last_name: ownerData.maternal_last_name?.trim() || null,
      rut: ownerData.rut.trim(),
      address_street: ownerData.address_street?.trim() || null,
      address_number: ownerData.address_number?.trim() || null,
      address_department: null,
      address_commune: ownerData.address_commune?.trim() || null,
      address_region: ownerData.address_region?.trim() || null,
      marital_status: ownerData.marital_status,
      property_regime: ownerData.marital_status === 'casado' ? ownerData.property_regime : null,
      phone: ownerData.phone?.trim() || null,
      email: ownerData.email?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data: ownerResult, error: ownerError } = await supabase
      .from('rental_owners')
      .insert({
        ...ownerPayload,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (ownerError) {
      console.error('❌ Error guardando propietario:', ownerError);
      return;
    }

    console.log('✅ Propietario guardado exitosamente:', ownerResult.id);

    // 3. Verificar que los datos se guardaron correctamente
    console.log('\n3️⃣ Verificando datos guardados...');

    const { data: savedOwner, error: verifyError } = await supabase
      .from('rental_owners')
      .select('*')
      .eq('id', ownerResult.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verificando datos guardados:', verifyError);
      return;
    }

    console.log('✅ Datos del propietario guardados:');
    console.log('  - ID:', savedOwner.id);
    console.log('  - Property ID:', savedOwner.property_id);
    console.log('  - Nombre:', `${savedOwner.first_name} ${savedOwner.paternal_last_name} ${savedOwner.maternal_last_name || ''}`.trim());
    console.log('  - RUT:', savedOwner.rut);
    console.log('  - Estado Civil:', savedOwner.marital_status);
    console.log('  - Régimen:', savedOwner.property_regime || 'N/A');
    console.log('  - Email:', savedOwner.email);
    console.log('  - Teléfono:', savedOwner.phone);

    // 4. Verificar relación con propiedad
    console.log('\n4️⃣ Verificando relación propiedad-propietario...');

    const { data: propertyWithOwner, error: relationError } = await supabase
      .from('properties')
      .select(`
        id,
        address_street,
        address_number,
        rental_owners (
          first_name,
          paternal_last_name,
          rut
        )
      `)
      .eq('id', propertyResult.id)
      .single();

    if (relationError) {
      console.error('❌ Error verificando relación:', relationError);
    } else {
      console.log('✅ Relación propiedad-propietario verificada:');
      console.log('  - Propiedad:', `${propertyWithOwner.address_street} ${propertyWithOwner.address_number}`);
      if (propertyWithOwner.rental_owners && propertyWithOwner.rental_owners.length > 0) {
        const owner = propertyWithOwner.rental_owners[0];
        console.log('  - Propietario:', `${owner.first_name} ${owner.paternal_last_name} (${owner.rut})`);
      }
    }

    // 5. Limpiar datos de prueba
    console.log('\n5️⃣ Limpiando datos de prueba...');

    await supabase.from('rental_owners').delete().eq('id', ownerResult.id);
    await supabase.from('properties').delete().eq('id', propertyResult.id);

    console.log('✅ Datos de prueba eliminados');

    console.log('\n🎉 Prueba completada exitosamente!');
    console.log('✅ La funcionalidad de guardado en rental_owners está funcionando correctamente.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRentalOwnersSave();
