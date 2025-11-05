// Verificación detallada del problema de guarantor_characteristic_id
const { createClient } = require('@supabase/supabase-js');

async function detailedCheck() {
  console.log('🔍 Verificación detallada del problema...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Verificar aplicaciones con guarantor_id
    console.log('\n1. Aplicaciones con guarantor_id:');
    const { data: appsWithGuarantor, error: appsError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id, created_at')
      .not('guarantor_id', 'is', null);

    if (appsError) {
      console.error('❌ Error:', appsError);
      return;
    }

    console.log(`   Total: ${appsWithGuarantor.length}`);

    const withCharId = appsWithGuarantor.filter(app => app.guarantor_characteristic_id);
    const withoutCharId = appsWithGuarantor.filter(app => !app.guarantor_characteristic_id);

    console.log(`   ✅ Con guarantor_characteristic_id: ${withCharId.length}`);
    console.log(`   ❌ Sin guarantor_characteristic_id: ${withoutCharId.length}`);

    // 2. Verificar vista completed_processes_characteristics
    console.log('\n2. Vista completed_processes_characteristics:');
    const { data: viewData, error: viewError } = await supabase
      .from('completed_processes_characteristics')
      .select('contract_id, application_id, guarantor_id, guarantor_characteristic_id');

    if (viewError) {
      console.error('❌ Error:', viewError);
      return;
    }

    console.log(`   Total registros: ${viewData.length}`);

    const viewWithGuarantor = viewData.filter(row => row.guarantor_id);
    const viewWithCharId = viewData.filter(row => row.guarantor_characteristic_id);

    console.log(`   Con guarantor_id: ${viewWithGuarantor.length}`);
    console.log(`   ✅ Con guarantor_characteristic_id: ${viewWithCharId.length}`);
    console.log(`   ❌ Sin guarantor_characteristic_id: ${viewWithGuarantor.length - viewWithCharId.length}`);

    // 3. Comparar IDs específicos
    if (viewWithGuarantor.length > 0 && withoutCharId.length === 0) {
      console.log('\n3. Comparación de IDs:');
      console.log('   La vista tiene guarantor_id pero aplicaciones dicen que no faltan guarantor_characteristic_id');
      console.log('   Esto sugiere que los datos ya están corregidos o hay inconsistencia.');

      // Mostrar algunos ejemplos
      console.log('\n   Ejemplos de la vista:');
      viewWithGuarantor.slice(0, 3).forEach((row, i) => {
        console.log(`     ${i+1}. Contract: ${row.contract_id.substring(0,8)}..., Guarantor ID: ${row.guarantor_id?.substring(0,8)}..., Char ID: ${row.guarantor_characteristic_id || 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

detailedCheck();




