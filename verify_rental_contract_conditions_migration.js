// Script para verificar el estado final de rental_contract_conditions después de la migración
import { createClient } from '@supabase/supabase-js';

// Usar anon key para consultas de solo lectura
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMigration() {
  console.log('🔍 Verificando estado de rental_contract_conditions después de la migración...\n');

  try {
    // 1. Verificar estructura de columnas
    console.log('📋 ESTRUCTURA DE COLUMNAS:');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'rental_contract_conditions')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error obteniendo columnas:', columnsError);
      return;
    }

    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 2. Verificar restricciones
    console.log('\n🔒 RESTRICCIONES ACTIVAS:');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT conname, contype, conrelid::regclass as table_name,
                 CASE contype
                   WHEN 'c' THEN 'CHECK'
                   WHEN 'f' THEN 'FOREIGN KEY'
                   WHEN 'p' THEN 'PRIMARY KEY'
                   WHEN 'u' THEN 'UNIQUE'
                   ELSE contype
                 END as constraint_type
          FROM pg_constraint
          WHERE conrelid = 'rental_contract_conditions'::regclass
          ORDER BY conname;
        `
      });

    if (constraintsError) {
      console.error('❌ Error obteniendo restricciones:', constraintsError);
      console.log('💡 Ejecuta manualmente en Supabase SQL:');
      console.log(`
        SELECT conname, contype,
               CASE contype
                 WHEN 'c' THEN 'CHECK'
                 WHEN 'f' THEN 'FOREIGN KEY'
                 WHEN 'p' THEN 'PRIMARY KEY'
                 WHEN 'u' THEN 'UNIQUE'
                 ELSE contype
               END as constraint_type
        FROM pg_constraint
        WHERE conrelid = 'rental_contract_conditions'::regclass
        ORDER BY conname;
      `);
    } else {
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.conname} (${constraint.constraint_type})`);
      });
    }

    // 3. Verificar datos existentes
    console.log('\n📊 ESTADO DE DATOS:');
    const { data: dataCheck, error: dataError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT
            COUNT(*) as total_records,
            COUNT(final_rent_price) as with_final_price,
            COUNT(contract_duration_months) as with_duration,
            COUNT(guarantee_amount) as with_guarantee,
            COUNT(payment_method) as with_payment_method
          FROM rental_contract_conditions;
        `
      });

    if (dataError) {
      console.error('❌ Error obteniendo estadísticas de datos:', dataError);
    } else {
      console.log(`   - Total de registros: ${dataCheck[0].total_records}`);
      console.log(`   - Con precio final: ${dataCheck[0].with_final_price}`);
      console.log(`   - Con duración: ${dataCheck[0].with_duration}`);
      console.log(`   - Con garantía: ${dataCheck[0].with_guarantee}`);
      console.log(`   - Con método de pago: ${dataCheck[0].with_payment_method}`);
    }

    // 4. Verificar campos requeridos por el formulario
    console.log('\n✅ VERIFICACIÓN DE CAMPOS DEL FORMULARIO:');

    const requiredColumns = [
      'final_rent_price',
      'contract_start_date',
      'contract_duration_months',
      'guarantee_amount',
      'monthly_payment_day',
      'brokerage_commission',
      'payment_method',
      'account_holder_name',
      'account_holder_rut',
      'bank_name',
      'account_type',
      'account_number'
    ];

    const columnNames = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length === 0) {
      console.log('   ✅ Todos los campos requeridos por el formulario están presentes');
    } else {
      console.log('   ❌ Columnas faltantes:', missingColumns);
    }

    console.log('\n🎉 ¡Verificación completada!');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// Ejecutar verificación
verifyMigration();
