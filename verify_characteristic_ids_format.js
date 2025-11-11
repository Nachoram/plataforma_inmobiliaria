// Script para verificar que los characteristic_ids tengan el formato correcto
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCharacteristicIds() {
  console.log('🔍 Verificando formato de characteristic_ids...\n');

  try {
    // Verificar applications
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('id, application_characteristic_id, guarantor_characteristic_id')
      .limit(5);

    if (appsError) throw appsError;

    console.log('📋 Aplicaciones (muestra):');
    apps.forEach(app => {
      console.log(`  ID: ${app.id}`);
      console.log(`  Application Characteristic ID: ${app.application_characteristic_id}`);
      console.log(`  Guarantor Characteristic ID: ${app.guarantor_characteristic_id}`);
      console.log('');
    });

    // Verificar properties
    const { data: props, error: propsError } = await supabase
      .from('properties')
      .select('id, property_characteristic_id')
      .limit(5);

    if (propsError) throw propsError;

    console.log('🏠 Propiedades (muestra):');
    props.forEach(prop => {
      console.log(`  ID: ${prop.id}`);
      console.log(`  Property Characteristic ID: ${prop.property_characteristic_id}`);
      console.log('');
    });

    // Verificar rental_owners
    const { data: owners, error: ownersError } = await supabase
      .from('rental_owners')
      .select('id, rental_owner_characteristic_id')
      .limit(5);

    if (ownersError) throw ownersError;

    console.log('👤 Propietarios (muestra):');
    owners.forEach(owner => {
      console.log(`  ID: ${owner.id}`);
      console.log(`  Rental Owner Characteristic ID: ${owner.rental_owner_characteristic_id}`);
      console.log('');
    });

    // Verificar contract_conditions
    const { data: contracts, error: contractsError } = await supabase
      .from('rental_contract_conditions')
      .select('id, contract_conditions_characteristic_id')
      .limit(5);

    if (contractsError) throw contractsError;

    console.log('📄 Condiciones de contrato (muestra):');
    contracts.forEach(contract => {
      console.log(`  ID: ${contract.id}`);
      console.log(`  Contract Conditions Characteristic ID: ${contract.contract_conditions_characteristic_id}`);
      console.log('');
    });

    console.log('✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifyCharacteristicIds();














