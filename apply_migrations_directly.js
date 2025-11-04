import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuración de Supabase (hardcoded para migraciones)
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function showMigrationInstructions(filePath) {
  try {
    console.log(`\n📄 MIGRACIÓN: ${path.basename(filePath)}`);
    console.log('='.repeat(80));

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(sql);

    console.log('='.repeat(80));
    console.log(`\n📋 INSTRUCCIONES PARA ${path.basename(filePath)}:`);
    console.log('1. Ve a: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
    console.log('2. Crea una nueva consulta SQL');
    console.log('3. Copia y pega el SQL de arriba');
    console.log('4. Haz clic en "Run" para ejecutar la migración');
    console.log('');

  } catch (error) {
    console.error(`❌ Error leyendo migración ${filePath}:`, error);
  }
}

async function main() {
  console.log('🚀 INSTRUCCIONES PARA APLICAR MIGRACIONES DE POSTULANTES MÚLTIPLES');
  console.log('⚠️  IMPORTANTE: Haz backup de tu base de datos antes de ejecutar estas migraciones!');
  console.log('');

  // Lista de migraciones a aplicar en orden
  const migrations = [
    'supabase/migrations/20251104_create_application_applicants_guarantors_tables.sql',
    'supabase/migrations/20251104_add_entity_type_to_profiles.sql',
    'supabase/migrations/20251104_add_entity_type_to_guarantors.sql'
  ];

  for (const migration of migrations) {
    if (fs.existsSync(migration)) {
      await showMigrationInstructions(migration);
    } else {
      console.log(`⚠️  Migración no encontrada: ${migration}`);
    }
  }

  console.log('🎉 INSTRUCCIONES COMPLETADAS');
  console.log('');
  console.log('✅ LO QUE HACEN ESTAS MIGRACIONES:');
  console.log('   - Crean tablas application_applicants y application_guarantors');
  console.log('   - Agregan soporte para personas naturales y jurídicas');
  console.log('   - Migra datos existentes de applications.applicant_id/guarantor_id');
  console.log('   - Configuran políticas RLS para seguridad');
  console.log('   - Crean funciones de utilidad para contar postulantes/avales');
  console.log('');
  console.log('📋 DESPUÉS DE APLICAR:');
  console.log('   - Verifica que las tablas se crearon en Supabase Dashboard');
  console.log('   - El formulario funcionará con múltiples postulantes/avales');
  console.log('   - Los contratos necesitarán actualización para múltiples entidades');
}

// Limpiar cache y ejecutar
delete require.cache[require.resolve('./20251104_create_application_applicants_guarantors_tables.sql')];
main().catch(console.error);
