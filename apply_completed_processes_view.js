// Script para aplicar la vista completed_processes_characteristics
// Ejecutar con: node apply_completed_processes_view.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyView() {
  try {
    console.log('🔍 Aplicando vista completed_processes_characteristics...');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create_completed_processes_characteristics_view.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el SQL usando rpc o directamente
    // Como no tenemos acceso directo a la DB, vamos a intentar ejecutar vía Supabase client
    console.log('⚠️  Nota: Este script requiere configuración de Supabase local o remota');
    console.log('📄 Contenido SQL a aplicar:');
    console.log('========================================');
    console.log(sqlContent);
    console.log('========================================');

    // Para ejecutar realmente, necesitaríamos acceso administrativo a la DB
    // Por ahora, solo mostramos el SQL que debe aplicarse

    console.log('✅ Script preparado. Para aplicar:');
    console.log('1. Copia el contenido del archivo create_completed_processes_characteristics_view.sql');
    console.log('2. Ejecutalo en tu cliente de base de datos PostgreSQL');
    console.log('3. O usa: supabase db push si tienes acceso a Supabase CLI');
    console.log('');
    console.log('🔧 Correcciones aplicadas:');
    console.log('   • JOIN rental_owners: p.id = ro.property_id (no profile_id)');
    console.log('   • JOIN rental_contract_conditions: rcc.application_id = rc.application_id');
    console.log('   • Columnas correctas: final_rent_price, contract_duration_months, additional_conditions');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyView();
