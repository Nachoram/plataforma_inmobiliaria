// Script para verificar guarantor_characteristic_id en aplicaciones y vista
const { createClient } = require('@supabase/supabase-js');

async function checkGuarantorCharacteristicIds() {
  console.log('🔍 Verificando guarantor_characteristic_id en aplicaciones...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Verificar aplicaciones con guarantor_id pero sin guarantor_characteristic_id
    const { data: appsWithGuarantor, error: appsError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id, created_at')
      .not('guarantor_id', 'is', null);

    if (appsError) {
      console.error('❌ Error al consultar aplicaciones:', appsError);
      return;
    }

    console.log(`📊 Total aplicaciones con guarantor_id: ${appsWithGuarantor.length}`);

    const withGuarantorId = appsWithGuarantor.filter(app => app.guarantor_characteristic_id);
    const withoutGuarantorId = appsWithGuarantor.filter(app => !app.guarantor_characteristic_id);

    console.log(`✅ Aplicaciones con guarantor_characteristic_id: ${withGuarantorId.length}`);
    console.log(`❌ Aplicaciones sin guarantor_characteristic_id: ${withoutGuarantorId.length}`);

    if (withoutGuarantorId.length > 0) {
      console.log('\n🔧 Aplicaciones que necesitan guarantor_characteristic_id:');
      withoutGuarantorId.slice(0, 5).forEach(app => {
        console.log(`  ID: ${app.id}, Guarantor ID: ${app.guarantor_id}, Created: ${app.created_at}`);
      });
      if (withoutGuarantorId.length > 5) {
        console.log(`  ... y ${withoutGuarantorId.length - 5} más`);
      }
    }

    // Verificar vista completed_processes_characteristics
    console.log('\n📋 Verificando vista completed_processes_characteristics...');
    const { data: viewData, error: viewError } = await supabase
      .from('completed_processes_characteristics')
      .select('*')
      .limit(10);

    if (viewError) {
      console.error('❌ Error al consultar vista:', viewError);
    } else {
      console.log(`📊 Registros en vista: ${viewData.length}`);
      const withGuarantorCharId = viewData.filter(row => row.guarantor_characteristic_id);
      console.log(`✅ Registros con guarantor_characteristic_id: ${withGuarantorCharId.length}`);

      // Mostrar detalles de cada registro
      console.log('\n🔍 Detalles de registros en vista:');
      viewData.forEach((row, index) => {
        console.log(`${index + 1}. Contract ID: ${row.contract_id}`);
        console.log(`   Application ID: ${row.application_id}`);
        console.log(`   Guarantor ID: ${row.guarantor_id || 'NULL'}`);
        console.log(`   Guarantor Characteristic ID: ${row.guarantor_characteristic_id || 'NULL'}`);
        console.log('');
      });

      // Verificar contratos sin garantes
      const contractsWithoutGuarantor = viewData.filter(row => !row.guarantor_id);
      console.log(`📊 Contratos sin garante: ${contractsWithoutGuarantor.length} de ${viewData.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkGuarantorCharacteristicIds();
