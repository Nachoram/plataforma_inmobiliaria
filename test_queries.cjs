const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  console.log('🧪 Probando consultas después de arreglar RLS...');

  try {
    // Probar consulta básica a application_applicants
    console.log('📋 Probando application_applicants...');
    const { data: applicants, error: applicantsError } = await supabase
      .from('application_applicants')
      .select('application_id, entity_type, first_name, email')
      .limit(1);

    if (applicantsError) {
      console.log('❌ Error en application_applicants:', applicantsError.message);
    } else {
      console.log('✅ application_applicants funciona:', applicants?.length || 0, 'registros');
    }

    // Probar consulta básica a application_guarantors
    console.log('📋 Probando application_guarantors...');
    const { data: guarantors, error: guarantorsError } = await supabase
      .from('application_guarantors')
      .select('application_id, entity_type, first_name, contact_email')
      .limit(1);

    if (guarantorsError) {
      console.log('❌ Error en application_guarantors:', guarantorsError.message);
    } else {
      console.log('✅ application_guarantors funciona:', guarantors?.length || 0, 'registros');
    }

    // Probar consulta básica a rental_contracts
    console.log('📋 Probando rental_contracts...');
    const { data: contracts, error: contractsError } = await supabase
      .from('rental_contracts')
      .select('application_id, start_date')
      .limit(1);

    if (contractsError) {
      console.log('❌ Error en rental_contracts:', contractsError.message);
    } else {
      console.log('✅ rental_contracts funciona:', contracts?.length || 0, 'registros');
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testQueries();














