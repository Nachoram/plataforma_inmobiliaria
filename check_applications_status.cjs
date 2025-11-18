const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN3oCSVQlaYaPkPmXS2w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkApplications() {
  console.log('📋 Verificando estado de las aplicaciones...\n');

  try {
    // Contar por estado
    const { data: statusCount, error: statusError } = await supabase
      .from('applications')
      .select('status')
      .limit(1000);

    if (statusError) {
      console.log('❌ Error:', statusError.message);
      return;
    }

    // Contar por estado
    const statusStats = {};
    statusCount.forEach(app => {
      statusStats[app.status] = (statusStats[app.status] || 0) + 1;
    });

    console.log('📊 Aplicaciones por estado:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log(`\n📋 Total de aplicaciones: ${statusCount.length}`);

    // Buscar aplicaciones recientes que podrían ser candidatas para webhook
    const { data: recentApps, error: recentError } = await supabase
      .from('applications')
      .select('id, status, created_at, property_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recentApps) {
      console.log('\n🕐 Aplicaciones más recientes:');
      recentApps.forEach(app => {
        console.log(`  ID: ${app.id} | Estado: ${app.status} | Propiedad: ${app.property_id} | Fecha: ${new Date(app.created_at).toLocaleString()}`);
      });
    }

    // Buscar si hay alguna aplicación que pueda usarse para webhook
    const testApp = recentApps?.find(app => app.status === 'En Revisión' || app.status === 'pendiente');
    if (testApp) {
      console.log(`\n🎯 Aplicación disponible para probar webhook: ${testApp.id}`);
    } else {
      console.log('\n⚠️ No hay aplicaciones en estado "En Revisión" o "pendiente"');
      console.log('💡 Para probar el webhook, necesitas crear una postulación nueva o cambiar el estado de una existente.');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkApplications();









