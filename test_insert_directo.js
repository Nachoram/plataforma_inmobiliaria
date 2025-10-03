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

// Usar SERVICE ROLE para bypasear RLS
const supabase = createClient(
  envVars.VITE_SUPABASE_URL, 
  envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY
);

async function testInsert() {
  console.log('🧪 Probando inserción directa en rental_contracts...\n');
  
  // Primero verificar la columna
  console.log('1️⃣ Verificando estructura de contract_content...');
  
  const { data, error } = await supabase
    .from('rental_contracts')
    .insert({
      application_id: '69a4f2d5-e08b-4c8e-a748-7e4de3e2d8fb',
      status: 'draft',
      contract_content: null,
      contract_html: null,
      contract_format: 'html',
      version: 1,
      notes: 'Test de inserción'
    })
    .select()
    .single();
  
  if (error) {
    console.error('\n❌ ERROR AL INSERTAR:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Detalles:', error.details);
    console.error('Hint:', error.hint);
    console.error('\nObjeto completo:', JSON.stringify(error, null, 2));
    
    if (error.message.includes('null value')) {
      console.log('\n💡 PROBLEMA: contract_content todavía es NOT NULL');
      console.log('✅ SOLUCIÓN: Ejecuta este SQL:');
      console.log('   ALTER TABLE rental_contracts ALTER COLUMN contract_content DROP NOT NULL;');
    }
    
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      console.log('\n💡 PROBLEMA: Ya existe un contrato para esta aplicación');
      console.log('✅ SOLUCIÓN: Elimina el contrato anterior o usa otra aplicación');
    }
    
  } else {
    console.log('\n✅ INSERCIÓN EXITOSA!');
    console.log('ID:', data.id);
    console.log('Number:', data.contract_number);
    console.log('Status:', data.status);
    console.log('\n🌐 Ver en: http://localhost:5173/contract/' + data.id);
  }
}

testInsert();

