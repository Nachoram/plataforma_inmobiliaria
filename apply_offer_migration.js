// Script para aplicar la migración de tablas de ofertas
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  try {
    // Configurar Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables de entorno no encontradas');
      process.exit(1);
    }

    console.log('🌐 Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251128000000_create_offer_supporting_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración...');

    // Ejecutar la migración usando rpc o directamente
    // Nota: En Supabase, necesitamos ejecutar SQL usando funciones RPC o directamente desde el dashboard
    // Por ahora, vamos a mostrar el SQL que necesita ejecutarse

    console.log('🔧 SQL a ejecutar en Supabase Dashboard:');
    console.log('========================================');
    console.log(migrationSQL);
    console.log('========================================');

    console.log('✅ Migración preparada. Copia y pega el SQL arriba en el SQL Editor de Supabase Dashboard.');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

applyMigration();
