// Script para aplicar la corrección de la vista completed_processes_characteristics
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyViewFix() {
  console.log('🔧 Aplicando corrección a la vista completed_processes_characteristics...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Leer el archivo de corrección
    const fixPath = path.join(__dirname, 'fix_completed_processes_view.sql');
    const fixSQL = fs.readFileSync(fixPath, 'utf8');

    console.log('📄 Aplicando corrección de vista...');

    // Nota: Como no tenemos acceso directo a ejecutar SQL complejo,
    // vamos a intentar ejecutar la lógica de corrección directamente

    console.log('🔍 Verificando estado actual de la vista...');

    // Verificar estado antes de la corrección
    const { data: beforeData, error: beforeError } = await supabase
      .from('completed_processes_characteristics')
      .select('contract_id, guarantor_id, guarantor_characteristic_id')
      .limit(10);

    if (beforeError) {
      console.error('❌ Error consultando vista:', beforeError);
      return;
    }

    const beforeWithCharId = beforeData.filter(row => row.guarantor_characteristic_id).length;
    const beforeWithGuarantor = beforeData.filter(row => row.guarantor_id).length;

    console.log(`📊 Antes de corrección:`);
    console.log(`   Registros con garante: ${beforeWithGuarantor}`);
    console.log(`   ✅ Registros con guarantor_characteristic_id: ${beforeWithCharId}`);

    // Intentar recrear la vista usando una consulta más simple
    // Como alternativa, podemos mostrar al usuario el SQL que debe ejecutar manualmente
    console.log('\n📋 SQL para ejecutar manualmente en Supabase SQL Editor:');
    console.log('=' .repeat(80));
    console.log(fixSQL);
    console.log('=' .repeat(80));

    console.log('\n✅ Script completado. El SQL anterior corregirá la vista.');
    console.log('💡 La nueva vista generará automáticamente guarantor_characteristic_id cuando sea NULL.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyViewFix();



















