// Script para verificar que la tabla rental_contract_conditions tenga el campo correcto
import { createClient } from '@supabase/supabase-js';

// Usar las credenciales del test_supabase.js
const supabaseUrl = 'https://uodpyvhgerxwoibdfths.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContractConditionsTable() {
  try {
    console.log('🔍 Verificando tabla rental_contract_conditions...');

    // Verificar si existe algún registro en rental_contract_conditions
    const { data, error } = await supabase
      .from('rental_contract_conditions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar rental_contract_conditions:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Tabla rental_contract_conditions existe');
      console.log('📋 Campos del primer registro:', Object.keys(data[0]));
      console.log('🔑 ID característico:', data[0].rental_contract_conditions_characteristic_id);

      // Verificar si tiene el campo correcto
      if (data[0].hasOwnProperty('rental_contract_conditions_characteristic_id')) {
        console.log('✅ Campo rental_contract_conditions_characteristic_id existe');
      } else {
        console.log('❌ Campo rental_contract_conditions_characteristic_id NO existe');
      }
    } else {
      console.log('⚠️ No hay registros en rental_contract_conditions');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkContractConditionsTable();
