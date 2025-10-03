// Script para aplicar políticas RLS correctas para edición de contratos
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Variables de entorno (usando las mismas del test_supabase.js)
const supabaseUrl = 'https://uodpyvhgerxwoibdfths.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

console.log('🔧 Aplicando políticas RLS correctas para contratos...');
console.log('URL:', supabaseUrl);
console.log('Key presente:', !!supabaseKey);

try {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Leer el archivo SQL
  console.log('📖 Leyendo archivo FIX_RLS_CORRECTO.sql...');
  const sqlContent = fs.readFileSync('FIX_RLS_CORRECTO.sql', 'utf8');

  console.log('🔄 Ejecutando script SQL...');

  // Ejecutar el SQL usando rpc (función que permite ejecutar SQL raw)
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: sqlContent
  });

  if (error) {
    console.log('❌ Error ejecutando SQL:', error.message);
    console.log('💡 Intentando método alternativo...');

    // Si rpc no funciona, intentar ejecutar las partes del SQL por separado
    // Dividir el SQL en comandos individuales
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 Ejecutando ${sqlCommands.length} comandos SQL...`);

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        console.log(`🔄 Ejecutando comando ${i + 1}/${sqlCommands.length}...`);

        try {
          // Intentar ejecutar cada comando
          const { error: cmdError } = await supabase.from('_supabase_sql').insert({
            query: command
          });

          if (cmdError) {
            console.log(`⚠️  Error en comando ${i + 1}:`, cmdError.message);
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado correctamente`);
          }
        } catch (cmdErr) {
          console.log(`⚠️  Error en comando ${i + 1}:`, cmdErr.message);
        }
      }
    }

    console.log('🎯 Script completado (con posibles errores individuales)');

  } else {
    console.log('✅ Script ejecutado correctamente:', data);
  }

  // Verificar las políticas aplicadas
  console.log('🔍 Verificando políticas RLS aplicadas...');

  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, cmd')
    .eq('tablename', 'rental_contracts');

  if (policiesError) {
    console.log('❌ Error verificando políticas:', policiesError.message);
  } else {
    console.log('📋 Políticas actuales para rental_contracts:');
    policies.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`);
    });

    // Verificar que existe la política de UPDATE
    const updatePolicy = policies.find(p => p.cmd === 'UPDATE');
    if (updatePolicy) {
      console.log('✅ Política UPDATE encontrada:', updatePolicy.policyname);
    } else {
      console.log('❌ No se encontró política UPDATE');
    }
  }

  console.log('🎉 ¡Script completado!');

} catch (error) {
  console.error('❌ Error general:', error.message);
  console.log('💡 Verifica que las credenciales sean correctas y que tengas permisos para ejecutar SQL.');
}
