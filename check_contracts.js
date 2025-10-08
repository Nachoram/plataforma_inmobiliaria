import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContracts() {
  try {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('id, contract_number, status, contract_content')
      .limit(10);

    if (error) throw error;

    console.log(`📋 Contratos encontrados: ${data?.length || 0}`);
    console.log('');

    data?.forEach((contract, index) => {
      console.log(`${index + 1}. ID: ${contract.id}`);
      console.log(`   Número: ${contract.contract_number || 'Sin número'}`);
      console.log(`   Estado: ${contract.status}`);
      console.log(`   Tiene contract_content: ${!!contract.contract_content}`);

      if (contract.contract_content) {
        const hasCanvasFormat = contract.contract_content.arrendador ||
                               contract.contract_content.arrendatario ||
                               contract.contract_content.aval ||
                               contract.contract_content.clausulas;

        if (hasCanvasFormat) {
          console.log('   → ✅ Formato Canvas (editable con ContractCanvasEditor)');
        } else if (contract.contract_content.sections) {
          console.log('   → 📄 Formato Secciones (editor antiguo)');
        } else {
          console.log('   → ❓ Formato desconocido');
        }
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkContracts();
