// Script de prueba para verificar las columnas de rental_contract_conditions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContractConditions() {
  try {
    console.log('🔍 Probando consulta a rental_contract_conditions...\n');

    // Intentar una consulta simple para ver si la tabla existe y tiene las columnas correctas
    const { data, error } = await supabase
      .from('rental_contract_conditions')
      .select('contract_duration_months, monthly_payment_day, final_rent_price, brokerage_commission, guarantee_amount')
      .limit(1);

    if (error) {
      console.error('❌ Error en consulta:', error.message);
      console.error('Código de error:', error.code);
      return;
    }

    console.log('✅ Consulta exitosa!');
    console.log('Datos obtenidos:', data);

    // Intentar insertar un registro de prueba (esto debería fallar si no tenemos permisos, pero nos dirá si las columnas existen)
    const testData = {
      application_id: '00000000-0000-0000-0000-000000000000', // UUID dummy
      contract_duration_months: 12,
      monthly_payment_day: 1,
      final_rent_price: 500000,
      brokerage_commission: 25000,
      guarantee_amount: 500000,
      official_communication_email: 'test@example.com',
      accepts_pets: false,
      dicom_clause: false,
      additional_conditions: 'Prueba'
    };

    console.log('\n🧪 Intentando insertar datos de prueba...');
    const { data: insertData, error: insertError } = await supabase
      .from('rental_contract_conditions')
      .insert([testData])
      .select();

    if (insertError) {
      console.log('ℹ️ Error esperado en inserción (sin permisos o aplicación inexistente):', insertError.message);
      if (insertError.message.includes('broker_commission_clp')) {
        console.error('❌ ERROR: La columna broker_commission_clp no existe. Debería ser brokerage_commission');
      } else if (insertError.message.includes('final_price_clp')) {
        console.error('❌ ERROR: La columna final_price_clp no existe. Debería ser final_rent_price');
      } else {
        console.log('✅ Las columnas principales existen (error es por permisos o FK)');
      }
    } else {
      console.log('✅ Inserción exitosa:', insertData);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testContractConditions();




