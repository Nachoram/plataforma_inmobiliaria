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

async function verificar() {
  console.log('🔍 Verificando tabla rental_contracts...\n');
  
  // Intentar hacer una query simple
  const { data, error } = await supabase
    .from('rental_contracts')
    .select('id, contract_html, contract_format, contract_number')
    .limit(1);
  
  if (error) {
    console.log('⚠️  Error:', error.message);
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n❌ La migración NO se aplicó correctamente');
      console.log('💡 Por favor ejecuta:');
      console.log('   psql -U postgres -d tu_base_datos -f supabase/migrations/20251003190000_add_contract_html_column.sql');
    }
  } else {
    console.log('✅ Tabla rental_contracts accesible');
    console.log('✅ Columnas nuevas disponibles:');
    console.log('   - contract_html');
    console.log('   - contract_format');
    console.log('   - contract_number');
    console.log('\n🎉 Migración aplicada correctamente!\n');
    console.log('📝 Ahora N8N puede insertar contratos con:');
    console.log('   {');
    console.log('     "application_id": "uuid...",');
    console.log('     "contract_html": "<html>...</html>",');
    console.log('     "contract_format": "html",');
    console.log('     "status": "draft"');
    console.log('   }');
  }
}

verificar();

