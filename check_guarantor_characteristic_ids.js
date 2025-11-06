// Script para verificar guarantor_characteristic_id en aplicaciones y vista
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkGuarantorCharacteristicIds() {
  console.log('🔍 Verificando guarantor_characteristic_id en aplicaciones...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY requeridas');
    process.exit(1);
  }

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
      .select('application_id, guarantor_id, guarantor_characteristic_id')
      .limit(10);

    if (viewError) {
      console.error('❌ Error al consultar vista:', viewError);
    } else {
      console.log(`📊 Registros en vista: ${viewData.length}`);
      const withGuarantorCharId = viewData.filter(row => row.guarantor_characteristic_id);
      console.log(`✅ Registros con guarantor_characteristic_id: ${withGuarantorCharId.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkGuarantorCharacteristicIds();









