import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function checkTables() {
  try {
    console.log('=== VERIFICANDO ESTRUCTURA DE BASE DE DATOS ===');

    // Verificar si existen las columnas requeridas en applications
    console.log('\n📋 Verificando tabla applications:');
    const { data: appData, error: appErr } = await supabase
      .from('applications')
      .select('id, application_characteristic_id, guarantor_characteristic_id')
      .limit(1);

    if (appErr) console.error('Error en applications:', appErr);
    else {
      console.log('✅ applications existe');
      console.log('Columnas disponibles:', Object.keys(appData[0] || {}));
    }

    // Verificar si existen las columnas requeridas en properties
    console.log('\n🏠 Verificando tabla properties:');
    const { data: propData, error: propErr } = await supabase
      .from('properties')
      .select('id, property_characteristic_id, rental_owner_characteristic_id')
      .limit(1);

    if (propErr) {
      console.log('❌ Error en properties:', propErr.message);
      // Intentar sin las columnas nuevas
      const { data: propData2, error: propErr2 } = await supabase
        .from('properties')
        .select('id')
        .limit(1);

      if (propErr2) console.error('Error básico en properties:', propErr2);
      else console.log('✅ properties existe, pero faltan columnas de características');
    } else {
      console.log('✅ properties existe con columnas de características');
      console.log('Columnas disponibles:', Object.keys(propData[0] || {}));
    }

    // Verificar si existe contract_conditions
    console.log('\n📄 Verificando tabla contract_conditions:');
    const { data: contractData, error: contractErr } = await supabase
      .from('contract_conditions')
      .select('id, contract_conditions_characteristic_id')
      .limit(1);

    if (contractErr) {
      console.log('❌ contract_conditions NO existe:', contractErr.message);
    } else {
      console.log('✅ contract_conditions existe');
      console.log('Columnas disponibles:', Object.keys(contractData[0] || {}));
    }

    // Verificar guarantors
    console.log('\n🛡️ Verificando tabla guarantors:');
    const { data: guarData, error: guarErr } = await supabase
      .from('guarantors')
      .select('id, guarantor_characteristic_id')
      .limit(1);

    if (guarErr) console.error('Error en guarantors:', guarErr);
    else {
      console.log('✅ guarantors existe');
      console.log('Columnas disponibles:', Object.keys(guarData[0] || {}));
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

checkTables();
