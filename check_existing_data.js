import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function checkExistingData() {
  console.log('🔍 Verificando datos existentes...\n');

  try {
    // Verificar propiedades
    console.log('🏠 PROPIEDADES:');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, listing_type, owner_id, address_street')
      .limit(10);

    if (propError) {
      console.log('❌ Error obteniendo properties:', propError.message);
    } else {
      console.log(`✅ ${properties?.length || 0} propiedades encontradas`);
      properties?.forEach(p => {
        console.log(`  - ID: ${p.id}, Tipo: ${p.listing_type}, Owner: ${p.owner_id}, Dirección: ${p.address_street}`);
      });
    }

    // Verificar profiles (propietarios)
    console.log('\n👤 PROFILES (PROPIETARIOS):');
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, first_name, paternal_last_name, email')
      .limit(10);

    if (profError) {
      console.log('❌ Error obteniendo profiles:', profError.message);
    } else {
      console.log(`✅ ${profiles?.length || 0} profiles encontrados`);
      profiles?.forEach(p => {
        console.log(`  - ID: ${p.id}, Nombre: ${p.first_name} ${p.paternal_last_name}, Email: ${p.email}`);
      });
    }

    // Verificar rental_owners
    console.log('\n🏢 RENTAL_OWNERS:');
    const { data: rentalOwners, error: roError } = await supabase
      .from('rental_owners')
      .select('*')
      .limit(10);

    if (roError) {
      console.log('❌ Error obteniendo rental_owners:', roError.message);
      if (roError.message.includes('does not exist')) {
        console.log('💡 La tabla rental_owners NO existe');
      }
    } else {
      console.log(`✅ ${rentalOwners?.length || 0} rental_owners encontrados`);
      rentalOwners?.forEach(ro => {
        console.log(`  - ID: ${ro.id}, Property: ${ro.property_id}, Nombre: ${ro.first_name} ${ro.paternal_last_name}`);
      });
    }

    // Verificar aplicaciones
    console.log('\n📋 APPLICATIONS:');
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id, property_id, applicant_id, status')
      .limit(5);

    if (appError) {
      console.log('❌ Error obteniendo applications:', appError.message);
    } else {
      console.log(`✅ ${applications?.length || 0} applications encontradas`);
      applications?.forEach(a => {
        console.log(`  - ID: ${a.id}, Property: ${a.property_id}, Applicant: ${a.applicant_id}, Status: ${a.status}`);
      });
    }

    // Verificar rental_contract_conditions
    console.log('\n📄 RENTAL_CONTRACT_CONDITIONS:');
    const { data: contracts, error: contractError } = await supabase
      .from('rental_contract_conditions')
      .select('id, application_id, final_rent_price')
      .limit(5);

    if (contractError) {
      console.log('❌ Error obteniendo rental_contract_conditions:', contractError.message);
      if (contractError.message.includes('does not exist')) {
        console.log('💡 La tabla rental_contract_conditions NO existe');
      }
    } else {
      console.log(`✅ ${contracts?.length || 0} rental_contract_conditions encontrados`);
      contracts?.forEach(c => {
        console.log(`  - ID: ${c.id}, Application: ${c.application_id}, Price: ${c.final_rent_price}`);
      });
    }

    console.log('\n📊 RESUMEN:');
    console.log('==========');
    console.log(`Propiedades: ${properties?.length || 0}`);
    console.log(`Profiles: ${profiles?.length || 0}`);
    console.log(`Rental Owners: ${rentalOwners?.length || 'NO EXISTE'}`);
    console.log(`Applications: ${applications?.length || 0}`);
    console.log(`Contract Conditions: ${contracts?.length || 'NO EXISTE'}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkExistingData();
