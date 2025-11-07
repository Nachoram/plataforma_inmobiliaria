// Script para verificar consistencia de datos entre applications y guarantors
const { createClient } = require('@supabase/supabase-js');

async function checkDataConsistency() {
  console.log('🔍 Verificando consistencia entre applications y guarantors...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get applications with guarantor_characteristic_id
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id')
      .not('guarantor_characteristic_id', 'is', null);

    if (appsError) {
      console.error('❌ Error al consultar applications:', appsError);
      return;
    }

    console.log(`📊 Aplicaciones con guarantor_characteristic_id: ${apps.length}`);

    // Get all guarantors
    const { data: guarantors, error: guarsError } = await supabase
      .from('guarantors')
      .select('id, guarantor_characteristic_id, first_name, paternal_last_name, rut');

    if (guarsError) {
      console.error('❌ Error al consultar guarantors:', guarsError);
      return;
    }

    console.log(`📊 Total garantes: ${guarantors.length}`);

    // Create map of guarantor_characteristic_id -> guarantor
    const guarantorMap = new Map();
    guarantors.forEach(g => {
      if (g.guarantor_characteristic_id) {
        guarantorMap.set(g.guarantor_characteristic_id, g);
      }
    });

    console.log(`📊 Garantes con guarantor_characteristic_id: ${guarantorMap.size}`);

    // Check consistency
    let consistent = 0;
    let inconsistent = 0;
    let noGuarantorId = 0;
    let issues = [];

    apps.forEach(app => {
      const expectedGuarantor = guarantorMap.get(app.guarantor_characteristic_id);

      if (!app.guarantor_id) {
        // No guarantor_id but has characteristic_id
        noGuarantorId++;
        if (expectedGuarantor) {
          issues.push({
            type: 'missing_guarantor_id',
            application_id: app.id,
            guarantor_characteristic_id: app.guarantor_characteristic_id,
            expected_guarantor_id: expectedGuarantor.id,
            expected_guarantor_name: `${expectedGuarantor.first_name} ${expectedGuarantor.paternal_last_name}`,
            expected_guarantor_rut: expectedGuarantor.rut
          });
        } else {
          issues.push({
            type: 'no_matching_guarantor',
            application_id: app.id,
            guarantor_characteristic_id: app.guarantor_characteristic_id
          });
          inconsistent++;
        }
      } else {
        // Has guarantor_id, check if it matches
        const actualGuarantor = guarantors.find(g => g.id === app.guarantor_id);
        if (actualGuarantor && actualGuarantor.guarantor_characteristic_id === app.guarantor_characteristic_id) {
          consistent++;
        } else {
          inconsistent++;
          issues.push({
            type: 'mismatched_characteristic_id',
            application_id: app.id,
            guarantor_id: app.guarantor_id,
            application_characteristic_id: app.guarantor_characteristic_id,
            actual_guarantor_characteristic_id: actualGuarantor ? actualGuarantor.guarantor_characteristic_id : 'NULL'
          });
        }
      }
    });

    console.log(`\n📊 Resumen:`);
    console.log(`  ✅ Consistente: ${consistent}`);
    console.log(`  ❌ Inconsistente: ${inconsistent}`);
    console.log(`  🔗 Sin guarantor_id pero con characteristic_id: ${noGuarantorId}`);

    if (issues.length > 0) {
      console.log(`\n🔧 Problemas encontrados:`);
      issues.slice(0, 10).forEach((issue, index) => {
        console.log(`${index + 1}. Tipo: ${issue.type}`);
        console.log(`   Application ID: ${issue.application_id}`);
        if (issue.type === 'missing_guarantor_id') {
          console.log(`   Characteristic ID: ${issue.guarantor_characteristic_id}`);
          console.log(`   Debería enlazar con: ${issue.expected_guarantor_id} (${issue.expected_guarantor_name} - ${issue.expected_guarantor_rut})`);
        } else if (issue.type === 'no_matching_guarantor') {
          console.log(`   Characteristic ID: ${issue.guarantor_characteristic_id} - No existe garante con este ID`);
        } else if (issue.type === 'mismatched_characteristic_id') {
          console.log(`   Guarantor ID: ${issue.guarantor_id}`);
          console.log(`   App characteristic ID: ${issue.application_characteristic_id}`);
          console.log(`   Guarantor characteristic ID: ${issue.actual_guarantor_characteristic_id}`);
        }
        console.log('');
      });

      if (issues.length > 10) {
        console.log(`... y ${issues.length - 10} problemas más`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDataConsistency();








