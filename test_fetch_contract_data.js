import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

// Función para obtener los IDs de características del contrato (copiada de AdminPropertyDetailView.tsx)
const fetchContractData = async (applicationId) => {
  try {
    console.log('🔍 Obteniendo datos del contrato para application:', applicationId);

    // Paso 1: Obtener datos de la aplicación y propiedad
    const { data: applicationData, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        application_characteristic_id,
        guarantor_characteristic_id,
        property_id,
        properties (
          id,
          property_characteristic_id,
          owner_id
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError) {
      console.error('❌ Error fetching application:', appError);
      throw appError;
    }

    console.log('📋 Application data:', applicationData);

    // Paso 2: Obtener rental_owner_characteristic_id desde rental_owners
    const { data: ownerData, error: ownerError } = await supabase
      .from('rental_owners')
      .select('id, rental_owner_characteristic_id')
      .eq('property_id', applicationData.properties.id)
      .single();

    if (ownerError) {
      console.error('❌ Error fetching owner:', ownerError);
      throw ownerError;
    }

    console.log('👤 Owner data:', ownerData);

    // Paso 3: Obtener contract_conditions_characteristic_id
    const { data: contractData, error: contractError } = await supabase
      .from('rental_contract_conditions')
      .select('id, contract_conditions_characteristic_id')
      .eq('application_id', applicationId)
      .maybeSingle(); // Puede no existir aún

    if (contractError && contractError.code !== 'PGRST116') {
      console.error('❌ Error fetching contract conditions:', contractError);
      throw contractError;
    }

    console.log('📄 Contract data:', contractData);

    // Validar que todos los IDs existen
    const characteristicIds = {
      application_characteristic_id: applicationData.application_characteristic_id,
      property_characteristic_id: applicationData.properties.property_characteristic_id,
      rental_owner_characteristic_id: ownerData.rental_owner_characteristic_id,
      contract_conditions_characteristic_id: contractData?.contract_conditions_characteristic_id || null,
      guarantor_characteristic_id: applicationData.guarantor_characteristic_id
    };

    console.log('✅ Characteristic IDs obtenidos:', characteristicIds);

    // Validar campos requeridos
    const missingFields = [];
    if (!characteristicIds.application_characteristic_id) {
      missingFields.push('application_characteristic_id');
    }
    if (!characteristicIds.property_characteristic_id) {
      missingFields.push('property_characteristic_id');
    }
    if (!characteristicIds.rental_owner_characteristic_id) {
      missingFields.push('rental_owner_characteristic_id');
    }
    if (!characteristicIds.guarantor_characteristic_id) {
      missingFields.push('guarantor_characteristic_id');
    }

    if (missingFields.length > 0) {
      throw new Error(`Faltan datos requeridos: ${missingFields.join(', ')}`);
    }

    return characteristicIds;
  } catch (error) {
    console.error('❌ Error al obtener datos del contrato:', error);
    throw error;
  }
};

async function testFetchContractData() {
  console.log('🧪 Probando fetchContractData...');

  try {
    // Primero obtener una aplicación real
    console.log('\n🔍 Buscando aplicaciones existentes...');

    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id, status, created_at')
      .limit(5);

    if (appsError) {
      console.error('❌ Error obteniendo aplicaciones:', appsError);
      return;
    }

    if (!applications || applications.length === 0) {
      console.log('⚠️  No hay aplicaciones en la base de datos');
      return;
    }

    console.log(`✅ Encontradas ${applications.length} aplicaciones:`);
    applications.forEach((app, index) => {
      console.log(`  ${index + 1}. ID: ${app.id}, Status: ${app.status}`);
    });

    // Probar con la primera aplicación
    const testApplicationId = applications[0].id;
    console.log(`\n🎯 Probando con application ID: ${testApplicationId}`);

    const result = await fetchContractData(testApplicationId);

    console.log('\n🎉 ÉXITO! fetchContractData funcionó correctamente');
    console.log('📊 Resultado:', result);

    // Verificar que todos los IDs requeridos existen
    const requiredIds = [
      'application_characteristic_id',
      'property_characteristic_id',
      'rental_owner_characteristic_id',
      'guarantor_characteristic_id'
    ];

    let allIdsPresent = true;
    requiredIds.forEach(id => {
      if (!result[id]) {
        console.log(`❌ Falta: ${id}`);
        allIdsPresent = false;
      } else {
        console.log(`✅ ${id}: ${result[id]}`);
      }
    });

    if (allIdsPresent) {
      console.log('\n✅ TODOS los IDs requeridos están presentes!');
      console.log('🚀 El error "column properties_1.rental_owner_characteristic_id does not exist" debería estar RESUELTO');
    } else {
      console.log('\n⚠️  Faltan algunos IDs. Es posible que necesites aplicar la migración SQL manualmente.');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);

    if (error.message.includes('does not exist')) {
      console.log('\n💡 SOLUCIÓN: Necesitas aplicar la migración SQL en Supabase Dashboard');
      console.log('   Archivo: supabase/migrations/20251027150000_ensure_all_characteristic_ids.sql');
    }
  }
}

testFetchContractData();
