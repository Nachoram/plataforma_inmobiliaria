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

async function buscarEnTodasPartes() {
  console.log('🔍 Buscando contratos en diferentes lugares...\n');
  
  // 1. rental_contracts
  console.log('1️⃣ Verificando tabla: rental_contracts');
  const { data: rc, error: rcError } = await supabase
    .from('rental_contracts')
    .select('*')
    .limit(5);
  
  if (rcError) {
    console.log(`   ❌ Error: ${rcError.message}`);
  } else {
    console.log(`   ${rc?.length || 0} registros encontrados`);
  }
  
  // 2. workflow_outputs (donde el webhook guarda)
  console.log('\n2️⃣ Verificando tabla: workflow_outputs');
  const { data: wo, error: woError } = await supabase
    .from('workflow_outputs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (woError) {
    console.log(`   ❌ Error: ${woError.message}`);
  } else {
    console.log(`   ${wo?.length || 0} registros encontrados`);
    if (wo && wo.length > 0) {
      console.log('\n   📋 Últimos workflow_outputs:');
      wo.forEach((item, i) => {
        console.log(`   ${i + 1}. ID: ${item.id}`);
        console.log(`      Workflow: ${item.workflow_type}`);
        console.log(`      Path: ${item.output_storage_path}`);
        console.log(`      User: ${item.user_id}`);
        console.log(`      Creado: ${new Date(item.created_at).toLocaleString('es-CL')}`);
        if (item.metadata) {
          console.log(`      Metadata:`, JSON.stringify(item.metadata, null, 2));
        }
        console.log('');
      });
    }
  }
  
  // 3. applications con algún campo de contrato
  console.log('\n3️⃣ Verificando tabla: applications (con status aprobada)');
  const { data: apps, error: appsError } = await supabase
    .from('applications')
    .select('id, status, created_at')
    .eq('status', 'aprobada')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (appsError) {
    console.log(`   ❌ Error: ${appsError.message}`);
  } else {
    console.log(`   ${apps?.length || 0} aplicaciones aprobadas`);
    if (apps && apps.length > 0) {
      console.log('\n   📋 Aplicaciones aprobadas (candidatas para contrato):');
      apps.forEach((app, i) => {
        console.log(`   ${i + 1}. ID: ${app.id}`);
        console.log(`      Creado: ${new Date(app.created_at).toLocaleString('es-CL')}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('💡 DIAGNÓSTICO');
  console.log('='.repeat(80));
  
  if (!rc || rc.length === 0) {
    console.log('\n❌ No hay contratos en rental_contracts');
    console.log('\n📝 Posibles causas:');
    console.log('   1. N8N todavía no ha ejecutado el workflow');
    console.log('   2. N8N está guardando en otro lugar');
    console.log('   3. Hay un error en el nodo de inserción de N8N');
    console.log('\n✅ SOLUCIÓN:');
    console.log('   1. Ve a N8N y ejecuta el workflow manualmente');
    console.log('   2. Verifica el output del nodo Supabase Insert');
    console.log('   3. O dime dónde está guardando N8N el HTML actualmente');
  }
  
  console.log('\n');
}

buscarEnTodasPartes();

