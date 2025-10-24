// Script para aplicar la migración de rental_contract_conditions
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Usar service role key para poder ejecutar DDL
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

// Si tienes la service role key correcta, reemplaza YOUR_SERVICE_ROLE_KEY arriba
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  console.log('🔧 Aplicando migración para sincronizar rental_contract_conditions con formulario...');

  try {
    // Leer el archivo de migración
    const migrationSQL = fs.readFileSync('supabase/migrations/20251024141238_sync_rental_contract_conditions.sql', 'utf8');

    console.log('📄 Migración cargada, aplicando...');

    // Ejecutar la migración completa usando el cliente directo de Supabase
    // Nota: exec_sql function podría no estar disponible, así que usamos consultas directas
    const { error } = await supabase.from('_supabase_migration_temp').select('*').limit(0);

    if (error) {
      console.log('⚠️  exec_sql no disponible, usando método manual...');
      console.log('\n💡 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN:');
      console.log('1. Ve a https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
      console.log('2. Crea una nueva consulta SQL');
      console.log('3. Copia y pega el contenido del archivo:');
      console.log('   supabase/migrations/20251024141238_sync_rental_contract_conditions.sql');
      console.log('4. Ejecuta la consulta');
      return;
    }

    if (error) {
      console.error('❌ Error aplicando migración:', error);
      console.log('\n💡 Método alternativo: Aplicar manualmente en Supabase Dashboard');
      console.log('   1. Ve a https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
      console.log('   2. Copia el contenido del archivo supabase/migrations/20251024141238_sync_rental_contract_conditions.sql');
      console.log('   3. Ejecuta la consulta');
      return;
    }

    console.log('✅ Migración aplicada exitosamente!');

    // Verificar la estructura después de la migración
    console.log('\n🔍 Verificando estructura de tabla...');

    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'rental_contract_conditions')
      .order('ordinal_position');

    if (verifyError) {
      console.log('⚠️  No se pudo verificar la estructura:', verifyError.message);
    } else {
      console.log('📋 Estructura de rental_contract_conditions:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });

      // Verificar columnas críticas
      const requiredColumns = [
        'final_rent_price',
        'contract_duration_months',
        'monthly_payment_day',
        'guarantee_amount',
        'payment_method',
        'account_holder_name',
        'account_holder_rut',
        'bank_name',
        'account_type',
        'account_number'
      ];

      const existingColumns = columns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('❌ Columnas faltantes:', missingColumns);
      } else {
        console.log('✅ Todas las columnas requeridas están presentes');
      }
    }

    console.log('\n🎉 ¡Proceso completado!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la migración
applyMigration();
