import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Leer .env
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function verContratos() {
  console.log('🔍 Buscando contratos en rental_contracts...\n');
  
  const { data: contratos, error } = await supabase
    .from('rental_contracts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!contratos || contratos.length === 0) {
    console.log('⚠️  No se encontraron contratos');
    return;
  }
  
  console.log(`✅ Se encontraron ${contratos.length} contrato(s)\n`);
  
  contratos.forEach((contrato, i) => {
    console.log(`${'='.repeat(80)}`);
    console.log(`CONTRATO ${i + 1}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`ID: ${contrato.id}`);
    console.log(`Número: ${contrato.contract_number || 'Sin número'}`);
    console.log(`Estado: ${contrato.status}`);
    console.log(`Formato: ${contrato.contract_format || 'No especificado'}`);
    console.log(`Application ID: ${contrato.application_id || 'N/A'}`);
    console.log(`Creado: ${new Date(contrato.created_at).toLocaleString('es-CL')}`);
    
    // Verificar contract_html
    if (contrato.contract_html) {
      console.log(`\n📄 contract_html:`);
      console.log(`   ✅ Presente (${contrato.contract_html.length} caracteres)`);
      // Mostrar primeros 200 caracteres
      const preview = contrato.contract_html.substring(0, 200);
      console.log(`   Preview: "${preview}..."`);
    } else {
      console.log(`\n❌ contract_html: NULL o vacío`);
    }
    
    // Verificar contract_content
    if (contrato.contract_content) {
      console.log(`\n📋 contract_content:`);
      console.log(`   ✅ Presente (JSON)`);
      if (contrato.contract_content.sections) {
        console.log(`   Secciones: ${contrato.contract_content.sections.length}`);
      }
    } else {
      console.log(`\n❌ contract_content: NULL o vacío`);
    }
    
    console.log(`\n🌐 URL para visualizar:`);
    console.log(`   http://localhost:5173/contract/${contrato.id}`);
    console.log(`\n`);
  });
  
  // Diagnóstico
  const primerContrato = contratos[0];
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 DIAGNÓSTICO');
  console.log(`${'='.repeat(80)}`);
  
  if (!primerContrato.contract_html && !primerContrato.contract_content) {
    console.log('❌ PROBLEMA: El contrato no tiene ni contract_html ni contract_content');
    console.log('💡 SOLUCIÓN: N8N debe insertar el HTML en el campo contract_html');
  } else if (primerContrato.contract_html && !primerContrato.contract_format) {
    console.log('⚠️  PROBLEMA: Tiene HTML pero contract_format es NULL');
    console.log('💡 SOLUCIÓN: Ejecutar:');
    console.log(`   UPDATE rental_contracts SET contract_format = 'html' WHERE id = '${primerContrato.id}';`);
  } else if (primerContrato.contract_html && primerContrato.contract_format !== 'html') {
    console.log(`⚠️  PROBLEMA: contract_format es '${primerContrato.contract_format}' pero debería ser 'html'`);
    console.log('💡 SOLUCIÓN: Ejecutar:');
    console.log(`   UPDATE rental_contracts SET contract_format = 'html' WHERE id = '${primerContrato.id}';`);
  } else if (primerContrato.contract_html && primerContrato.contract_format === 'html') {
    console.log('✅ El contrato está bien configurado');
    console.log('💡 Verifica que el frontend esté corriendo y la ruta sea correcta');
  }
  
  console.log('\n');
}

verContratos();

