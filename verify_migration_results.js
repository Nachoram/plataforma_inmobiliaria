import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function verifyMigrationResults() {
  console.log('🔍 VERIFICANDO RESULTADOS DE LA MIGRACIÓN...\n');

  try {
    // 1. Verificar rental_owners
    console.log('🏠 RENTAL_OWNERS:');
    const { data: rentalOwners, error: roError } = await supabase
      .from('rental_owners')
      .select('id, property_id, rental_owner_characteristic_id, first_name, paternal_last_name')
      .limit(10);

    if (roError) {
      console.log('❌ Error:', roError.message);
    } else {
      console.log(`✅ ${rentalOwners?.length || 0} registros encontrados`);
      rentalOwners?.forEach(ro => {
        console.log(`  - Propiedad: ${ro.property_id.substring(0, 8)}...`);
        console.log(`    Owner: ${ro.first_name} ${ro.paternal_last_name}`);
        console.log(`    UUID: ${ro.rental_owner_characteristic_id}`);
      });
    }

    // 2. Verificar la propiedad específica del error
    console.log('\n🎯 PROPIEDAD ESPECÍFICA (c5401929-ca4e-486a-bed7-b883e76f7f6e):');
    const { data: specificOwner, error: soError } = await supabase
      .from('rental_owners')
      .select('id, rental_owner_characteristic_id, first_name, paternal_last_name')
      .eq('property_id', 'c5401929-ca4e-486a-bed7-b883e76f7f6e')
      .single();

    if (soError) {
      console.log('❌ Error:', soError.message);
    } else if (specificOwner) {
      console.log('✅ ¡ENCONTRADO!');
      console.log(`  Owner: ${specificOwner.first_name} ${specificOwner.paternal_last_name}`);
      console.log(`  UUID: ${specificOwner.rental_owner_characteristic_id}`);
    } else {
      console.log('❌ No encontrado');
    }

    // 3. Verificar properties
    console.log('\n🏢 PROPERTIES:');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, property_characteristic_id, listing_type')
      .limit(5);

    if (propError) {
      console.log('❌ Error:', propError.message);
    } else {
      console.log(`✅ ${properties?.length || 0} propiedades verificadas`);
      properties?.forEach(p => {
        console.log(`  - ${p.listing_type}: ${p.property_characteristic_id ? '✅' : '❌'} UUID`);
      });
    }

    // 4. Verificar rental_contract_conditions
    console.log('\n📄 RENTAL_CONTRACT_CONDITIONS:');
    const { data: contracts, error: contractError } = await supabase
      .from('rental_contract_conditions')
      .select('id, application_id, contract_conditions_characteristic_id')
      .limit(3);

    if (contractError) {
      console.log('❌ Error:', contractError.message);
    } else {
      console.log(`✅ ${contracts?.length || 0} contratos encontrados`);
      contracts?.forEach(c => {
        console.log(`  - App: ${c.application_id.substring(0, 8)}... UUID: ${c.contract_conditions_characteristic_id ? '✅' : '❌'}`);
      });
    }

    // 5. Verificar la aplicación específica del error
    console.log('\n📋 APLICACIÓN ESPECÍFICA (1327791a-e975-4391-840c-aa763e8206e0):');
    const { data: specificApp, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        application_characteristic_id,
        guarantor_characteristic_id,
        property_id,
        properties(id, property_characteristic_id)
      `)
      .eq('id', '1327791a-e975-4391-840c-aa763e8206e0')
      .single();

    if (appError) {
      console.log('❌ Error:', appError.message);
    } else {
      console.log('✅ Aplicación encontrada:');
      console.log(`  App UUID: ${specificApp.application_characteristic_id}`);
      console.log(`  Guarantor UUID: ${specificApp.guarantor_characteristic_id}`);
      console.log(`  Property UUID: ${specificApp.properties?.property_characteristic_id}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

verifyMigrationResults();
