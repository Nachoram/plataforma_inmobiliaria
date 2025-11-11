// Script para aplicar la migración de columnas broker_name, broker_rut y final_rent_price
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.2JcWLq5q9s5bL5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l'
);

async function applyMigration() {
  console.log('🔧 Aplicando migración para agregar columnas broker_name, broker_rut y final_rent_price...');

  try {
    // Verificar que la tabla existe
    console.log('📋 Verificando que la tabla rental_contract_conditions existe...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('rental_contract_conditions')
      .select('id')
      .limit(1);

    if (tableError && tableError.code !== 'PGRST116') {
      console.error('❌ Error: La tabla rental_contract_conditions no existe:', tableError);
      return;
    }

    console.log('✅ Tabla rental_contract_conditions existe');

    // Aplicar la migración SQL
    const migrationSQL = `
      -- Agregar columnas faltantes en rental_contract_conditions
      ALTER TABLE rental_contract_conditions
      ADD COLUMN IF NOT EXISTS final_rent_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS broker_name VARCHAR(120) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS broker_rut VARCHAR(20) NOT NULL DEFAULT '';

      -- Comentarios en las columnas
      COMMENT ON COLUMN rental_contract_conditions.final_rent_price IS 'Precio final mensual del arriendo (CLP)';
      COMMENT ON COLUMN rental_contract_conditions.broker_name IS 'Nombre del corredor responsable';
      COMMENT ON COLUMN rental_contract_conditions.broker_rut IS 'RUT del corredor responsable';

      -- Crear índices útiles para optimización
      CREATE INDEX IF NOT EXISTS idx_rcc_final_rent_price ON rental_contract_conditions(final_rent_price);
      CREATE INDEX IF NOT EXISTS idx_rcc_broker_rut ON rental_contract_conditions(broker_rut);
    `;

    console.log('💾 Aplicando migración SQL...');
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (migrationError) {
      console.error('❌ Error aplicando migración:', migrationError);

      // Intentar método alternativo: ejecutar comandos uno por uno
      console.log('🔄 Intentando método alternativo...');

      const sqlCommands = [
        'ALTER TABLE rental_contract_conditions ADD COLUMN IF NOT EXISTS final_rent_price NUMERIC(12,2) NOT NULL DEFAULT 0',
        'ALTER TABLE rental_contract_conditions ADD COLUMN IF NOT EXISTS broker_name VARCHAR(120) NOT NULL DEFAULT \'\'',
        'ALTER TABLE rental_contract_conditions ADD COLUMN IF NOT EXISTS broker_rut VARCHAR(20) NOT NULL DEFAULT \'\'',
        'COMMENT ON COLUMN rental_contract_conditions.final_rent_price IS \'Precio final mensual del arriendo (CLP)\'',
        'COMMENT ON COLUMN rental_contract_conditions.broker_name IS \'Nombre del corredor responsable\'',
        'COMMENT ON COLUMN rental_contract_conditions.broker_rut IS \'RUT del corredor responsable\'',
        'CREATE INDEX IF NOT EXISTS idx_rcc_final_rent_price ON rental_contract_conditions(final_rent_price)',
        'CREATE INDEX IF NOT EXISTS idx_rcc_broker_rut ON rental_contract_conditions(broker_rut)'
      ];

      for (const sql of sqlCommands) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql });
          if (error) {
            console.warn(`⚠️ Error en comando: ${sql.substring(0, 50)}... -`, error.message);
          } else {
            console.log(`✅ Comando ejecutado: ${sql.substring(0, 50)}...`);
          }
        } catch (e) {
          console.warn(`⚠️ Excepción en comando: ${sql.substring(0, 50)}...`);
        }
      }
    } else {
      console.log('✅ Migración aplicada exitosamente');
    }

    // Verificar que las columnas se crearon
    console.log('🔍 Verificando columnas creadas...');
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'rental_contract_conditions')
      .in('column_name', ['final_rent_price', 'broker_name', 'broker_rut']);

    if (verifyError) {
      console.warn('⚠️ No se pudo verificar columnas:', verifyError.message);
    } else {
      console.log('📊 Columnas encontradas:', columns);
    }

    // Probar insert de prueba
    console.log('🧪 Probando insert de prueba...');
    const testData = {
      application_id: 'test-' + Date.now(),
      final_rent_price: 500000,
      broker_name: 'Corredor de Prueba',
      broker_rut: '12.345.678-9',
      contract_start_date: new Date().toISOString().split('T')[0]
    };

    const { data: testResult, error: testError } = await supabase
      .from('rental_contract_conditions')
      .insert(testData)
      .select();

    if (testError) {
      console.error('❌ Error en insert de prueba:', testError);
    } else {
      console.log('✅ Insert de prueba exitoso:', testResult);

      // Limpiar dato de prueba
      if (testResult && testResult[0]) {
        await supabase
          .from('rental_contract_conditions')
          .delete()
          .eq('application_id', testData.application_id);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyMigration();

















