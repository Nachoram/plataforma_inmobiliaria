// Verificar contratos y aplicaciones
const { createClient } = require('@supabase/supabase-js');

async function checkContracts() {
  console.log('🔍 Verificando contratos directamente...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Ver contratos
    const { data: contracts, error: contractsError } = await supabase
      .from('rental_contracts')
      .select('id, application_id, contract_number, status')
      .limit(10);

    if (contractsError) {
      console.error('❌ Error contratos:', contractsError);
      return;
    }

    console.log(`📋 Contratos encontrados: ${contracts.length}`);

    if (contracts.length > 0) {
      contracts.forEach(contract => {
        console.log(`  Contract ${contract.id.substring(0,8)}...: App ${contract.application_id.substring(0,8)}..., Status: ${contract.status}`);
      });

      // Verificar aplicaciones de estos contratos
      const appIds = contracts.map(c => c.application_id);
      console.log(`\n🔍 Verificando aplicaciones de contratos...`);

      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('id, guarantor_id, status')
        .in('id', appIds);

      console.log(`Aplicaciones encontradas: ${apps?.length || 0}`);

      if (apps && apps.length > 0) {
        apps.forEach(app => {
          console.log(`  App ${app.id.substring(0,8)}...: Guarantor ${app.guarantor_id?.substring(0,8) || 'NULL'}, Status: ${app.status}`);
        });
      } else {
        console.log('❌ ¡NINGUNA aplicación encontrada para los contratos!');
        console.log('Esto explica por qué la vista no puede mostrar guarantor_characteristic_id');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkContracts();


