// Script de prueba para verificar que PostulationAdminPanel funciona correctamente
// Ejecutar con: node test_postulation_panel_fix.js

const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase (usar variables de entorno en producción)
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPostulationPanelQueries() {
  console.log('🧪 Probando consultas de PostulationAdminPanel...\n');

  try {
    // 1. Verificar que las columnas existen en profiles
    console.log('1. Verificando columnas en tabla profiles...');
    const { data: profileColumns, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_income_clp, job_seniority, nationality, date_of_birth')
      .limit(1);

    if (profileError) {
      console.error('❌ Error consultando profiles:', profileError.message);
    } else {
      console.log('✅ Columnas de profiles accesibles');
    }

    // 2. Verificar consulta de aplicaciones
    console.log('\n2. Probando consulta básica de aplicaciones...');
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        property_id,
        applicant_id,
        guarantor_id,
        status,
        created_at
      `)
      .limit(5);

    if (appError) {
      console.error('❌ Error consultando applications:', appError.message);
    } else {
      console.log(`✅ Consulta básica funciona. Encontradas ${applications.length} aplicaciones.`);
    }

    // 3. Probar consulta de perfiles por separado
    console.log('\n3. Probando consulta separada de profiles...');
    const applicantIds = applications?.map(app => app.applicant_id).filter(Boolean) || [];

    if (applicantIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          paternal_last_name,
          email,
          phone,
          profession
        `)
        .in('id', applicantIds);

      if (profilesError) {
        console.error('❌ Error consultando profiles:', profilesError.message);
      } else {
        console.log(`✅ Consulta separada de profiles funciona. Encontrados ${profiles.length} perfiles.`);
      }
    }

    // 4. Probar consulta de guarantors
    console.log('\n4. Probando consulta de guarantors...');
    const guarantorIds = applications?.map(app => app.guarantor_id).filter(Boolean) || [];

    if (guarantorIds.length > 0) {
      const { data: guarantors, error: guarantorsError } = await supabase
        .from('guarantors')
        .select(`
          id,
          first_name,
          contact_email,
          contact_phone,
          monthly_income
        `)
        .in('id', guarantorIds);

      if (guarantorsError) {
        console.error('❌ Error consultando guarantors:', guarantorsError.message);
      } else {
        console.log(`✅ Consulta de guarantors funciona. Encontrados ${guarantors.length} garantes.`);
      }
    }

    // 5. Verificar tablas de auditoría
    console.log('\n5. Verificando tablas de auditoría...');
    const { data: auditLog, error: auditError } = await supabase
      .from('application_audit_log')
      .select('count', { count: 'exact', head: true });

    if (auditError) {
      console.log('⚠️ Tabla application_audit_log no existe o no es accesible:', auditError.message);
    } else {
      console.log('✅ Tabla application_audit_log existe');
    }

    const { data: modifications, error: modError } = await supabase
      .from('application_modifications')
      .select('count', { count: 'exact', head: true });

    if (modError) {
      console.log('⚠️ Tabla application_modifications no existe o no es accesible:', modError.message);
    } else {
      console.log('✅ Tabla application_modifications existe');
    }

    console.log('\n🎉 Pruebas completadas. Revisa los resultados arriba.');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
}

// Ejecutar pruebas
testPostulationPanelQueries();
