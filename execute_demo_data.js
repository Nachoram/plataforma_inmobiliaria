import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuración de Supabase
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeDemoData() {
  try {
    console.log('🚀 Iniciando carga de datos de demostración del contrato...');

    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('seed_contract_demo_data.sql', 'utf8');

    // Dividir el SQL en statements individuales (separados por punto y coma)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Encontrados ${statements.length} statements SQL para ejecutar`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      console.log(`⚡ Ejecutando statement ${i + 1}/${statements.length}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.error(`❌ Error en statement ${i + 1}:`, error);
          // No detener la ejecución por errores en statements individuales
        } else {
          console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
        }
      } catch (err) {
        console.error(`❌ Error ejecutando statement ${i + 1}:`, err.message);
      }
    }

    console.log('🎉 ¡Carga de datos de demostración completada!');
    console.log('📋 IDs importantes creados:');
    console.log('   - Contrato ID: 550e8400-e29b-41d4-a716-446655440006');
    console.log('   - Aplicación ID: 550e8400-e29b-41d4-a716-446655440005');
    console.log('   - Propiedad ID: 550e8400-e29b-41d4-a716-446655440004');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
executeDemoData();
