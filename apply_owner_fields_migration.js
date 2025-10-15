import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de campos del propietario...');

    // Leer el archivo de migración
    const migrationPath = join(__dirname, '20251015130000_add_owner_fields_to_properties.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración SQL...');

    // Ejecutar la migración usando rpc (función SQL)
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error aplicando migración:', error);

      // Si rpc no funciona, intentar ejecutar directamente
      console.log('🔄 Intentando método alternativo...');

      // Dividir la migración en sentencias individuales
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`⚡ Ejecutando: ${statement.substring(0, 50)}...`);

          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (stmtError) {
            console.error(`❌ Error en statement:`, stmtError);
            // Continuar con el siguiente statement
          }
        }
      }
    } else {
      console.log('✅ Migración aplicada exitosamente');
    }

    // Verificar que los campos se crearon
    console.log('🔍 Verificando campos creados...');

    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'properties')
      .in('column_name', [
        'owner_type',
        'owner_first_name',
        'owner_company_name',
        'owner_representative_first_name'
      ]);

    if (columnsError) {
      console.error('❌ Error verificando columnas:', columnsError);
    } else {
      console.log('✅ Columnas encontradas:', columns?.map(c => c.column_name));
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

applyMigration();
