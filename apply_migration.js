import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  console.log('🔄 Aplicando migración de tablas de soporte para ofertas...\n');

  try {
    // Leer el archivo de migración
    const migrationSQL = readFileSync('supabase/migrations/20251128000000_create_offer_supporting_tables.sql', 'utf8');

    // Dividir el SQL en statements individuales (por punto y coma)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Encontrados ${statements.length} statements SQL para ejecutar`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Ejecutando statement ${i + 1}/${statements.length}...`);
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            console.log(`⚠️  Error en statement ${i + 1}: ${error.message}`);
            // Continuar con el siguiente statement en lugar de detener todo
          } else {
            console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
          }
        } catch (err) {
          console.log(`⚠️  Error ejecutando statement ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log('\n🎉 Migración completada. Verificando tablas creadas...');

    // Verificar que las tablas fueron creadas
    const tablesToCheck = ['tasks', 'timeline', 'formal_requests', 'communications'];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Tabla '${table}': ${error.message}`);
        } else {
          console.log(`✅ Tabla '${table}': Creada exitosamente`);
        }
      } catch (err) {
        console.log(`❌ Error verificando tabla '${table}': ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
  }
}

applyMigration();


