// Script para aplicar la migración que corrige guarantor_characteristic_id faltantes
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyFixGuarantorCharacteristicIds() {
  console.log('🔧 Aplicando migración para corregir guarantor_characteristic_id faltantes...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251030220000_fix_missing_guarantor_characteristic_ids.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración...');

    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      return;
    }

    console.log('✅ Migración aplicada exitosamente');

    // Verificar resultados
    console.log('\n🔍 Verificando resultados...');

    const { data: verificationData, error: verifyError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id')
      .not('guarantor_id', 'is', null)
      .limit(10);

    if (verifyError) {
      console.error('❌ Error verificando resultados:', verifyError);
      return;
    }

    const withGuarantorId = verificationData.filter(app => app.guarantor_characteristic_id);
    console.log(`📊 Aplicaciones con guarantor_id: ${verificationData.length}`);
    console.log(`✅ Aplicaciones con guarantor_characteristic_id: ${withGuarantorId.length}`);

    // Verificar vista
    const { data: viewData, error: viewError } = await supabase
      .from('completed_processes_characteristics')
      .select('contract_id, application_id, guarantor_id, guarantor_characteristic_id')
      .limit(10);

    if (viewError) {
      console.error('❌ Error consultando vista:', viewError);
    } else {
      const viewWithGuarantorId = viewData.filter(row => row.guarantor_characteristic_id);
      console.log(`📋 Registros en vista completed_processes_characteristics: ${viewData.length}`);
      console.log(`✅ Registros en vista con guarantor_characteristic_id: ${viewWithGuarantorId.length}`);

      if (viewWithGuarantorId.length > 0) {
        console.log('\n🎉 ¡ÉXITO! La vista ahora muestra guarantor_characteristic_id correctamente.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyFixGuarantorCharacteristicIds();













