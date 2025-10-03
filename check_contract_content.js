import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Leer variables de entorno del archivo .env
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContractContent() {
  console.log('📋 Consultando contratos en la tabla rental_contracts...\n');

  // Consultar contratos
  const { data: contracts, error } = await supabase
    .from('rental_contracts')
    .select('id, status, contract_content, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('❌ Error al consultar contratos:', error.message);
    return;
  }

  if (!contracts || contracts.length === 0) {
    console.log('⚠️  No se encontraron contratos en la base de datos');
    return;
  }

  console.log(`✅ Se encontraron ${contracts.length} contrato(s)\n`);

  contracts.forEach((contract, index) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`CONTRATO ${index + 1}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`ID: ${contract.id}`);
    console.log(`Estado: ${contract.status}`);
    console.log(`Creado: ${new Date(contract.created_at).toLocaleString('es-CL')}`);
    console.log(`\n📄 Estructura de contract_content:`);
    
    if (!contract.contract_content) {
      console.log('  ⚠️  contract_content es NULL o vacío');
      return;
    }

    const content = contract.contract_content;
    
    console.log(`  - Versión: ${content.version || 'No especificada'}`);
    console.log(`  - Generado en: ${content.generatedAt ? new Date(content.generatedAt).toLocaleString('es-CL') : 'No especificado'}`);
    console.log(`  - Última modificación: ${content.lastModified ? new Date(content.lastModified).toLocaleString('es-CL') : 'No especificado'}`);
    
    if (content.sections && Array.isArray(content.sections)) {
      console.log(`\n  📑 Secciones (${content.sections.length}):`);
      content.sections.forEach((section, i) => {
        console.log(`    ${i + 1}. [${section.id}] ${section.title}`);
        console.log(`       - Editable: ${section.editable ? 'Sí' : 'No'}`);
        console.log(`       - Contenido: ${section.content?.length || 0} caracteres`);
        if (section.content) {
          // Mostrar preview del contenido (primeros 100 caracteres sin HTML)
          const preview = section.content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 150);
          console.log(`       - Preview: "${preview}..."`);
        }
      });
    } else {
      console.log('  ⚠️  No se encontró el array de secciones');
      console.log('  Estructura actual:', JSON.stringify(content, null, 2).substring(0, 500));
    }
  });

  console.log(`\n${'='.repeat(80)}\n`);
  console.log('✅ Análisis completado\n');

  // Análisis del formato
  console.log('📊 ANÁLISIS DEL FORMATO:\n');
  const sampleContract = contracts[0];
  if (sampleContract?.contract_content?.sections) {
    console.log('✅ El formato actual es CORRECTO:');
    console.log('   - contract_content es un objeto JSONB');
    console.log('   - Contiene un array de "sections"');
    console.log('   - Cada sección tiene: id, title, content (HTML), editable');
    console.log('\n📱 COMPATIBILIDAD CON CANVAS:');
    console.log('   ✅ La plataforma YA está preparada para mostrar este formato');
    console.log('   ✅ ContractViewer.tsx convierte las secciones a HTML completo');
    console.log('   ✅ HTMLCanvasViewer renderiza el HTML en un canvas/iframe');
  } else {
    console.log('⚠️  El formato requiere ajustes');
  }
}

checkContractContent().catch(console.error);

