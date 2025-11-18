// Verificar aplicaciones específicas de la vista
const { createClient } = require('@supabase/supabase-js');

async function checkSpecificApps() {
  console.log('🔍 Verificando aplicaciones específicas de la vista...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Obtener application_ids de la vista
    const { data: viewData, error: viewError } = await supabase
      .from('completed_processes_characteristics')
      .select('application_id, guarantor_id')
      .not('guarantor_id', 'is', null);

    if (viewError) {
      console.error('❌ Error obteniendo vista:', viewError);
      return;
    }

    const appIds = viewData.map(row => row.application_id);
    console.log(`📋 Application IDs de la vista: ${appIds.length}`);
    console.log('IDs:', appIds.slice(0, 3).map(id => id.substring(0, 8) + '...'));

    // Intentar consultar estas aplicaciones específicas
    console.log('\n🔍 Consultando aplicaciones específicas...');
    const { data: specificApps, error: specificError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id, status')
      .in('id', appIds);

    console.log(`Resultado consulta específica: ${specificApps?.length || 0} registros`);

    if (specificError) {
      console.error('❌ Error consulta específica:', specificError);
    } else if (specificApps) {
      specificApps.forEach(app => {
        console.log(`  App ${app.id.substring(0,8)}...: guarantor_id=${app.guarantor_id?.substring(0,8) || 'NULL'}, char_id=${app.guarantor_characteristic_id || 'NULL'}, status=${app.status}`);
      });
    }

    // Verificar total de aplicaciones en la tabla
    const { count: totalApps, error: countError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total aplicaciones en tabla: ${totalApps || 'desconocido'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSpecificApps();















