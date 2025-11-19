// Script para probar la vista completed_processes_characteristics
// Ejecutar con: node test_completed_processes_view.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testView() {
  try {
    console.log('🧪 Probando vista completed_processes_characteristics...');

    // Primero aplicar la vista
    console.log('📝 Aplicando la vista...');
    const sqlPath = './create_completed_processes_characteristics_view.sql';
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (sqlError) {
      console.error('❌ Error aplicando la vista:', sqlError.message);
      return;
    }

    console.log('✅ Vista aplicada correctamente');

    // Probar la vista
    console.log('🔍 Consultando la vista...');
    const { data, error } = await supabase
      .from('completed_processes_characteristics')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error consultando la vista:', error.message);
      return;
    }

    console.log(`✅ Consulta exitosa. Registros encontrados: ${data.length}`);
    if (data.length > 0) {
      console.log('📋 Primer registro:');
      console.log(JSON.stringify(data[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testView();



















