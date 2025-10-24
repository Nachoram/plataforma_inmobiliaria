// Script para aplicar la migración de nuevos campos en rental_contract_conditions
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.2JcWLq5q9s5bL5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l5l'
);

async function applyMigration() {
  console.log('🔧 Aplicando migración para agregar campos final_rent_price, broker_name y broker_rut...');

  try {
    // SQL para agregar las columnas
    const addColumnsSQL = `
      ALTER TABLE rental_contract_conditions
      ADD COLUMN IF NOT EXISTS final_rent_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS broker_name VARCHAR(120) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS broker_rut VARCHAR(20) NOT NULL DEFAULT '';
    `;

    // Ejecutar la migración usando rpc
    const { error } = await supabase.rpc('exec_sql', { sql: addColumnsSQL });

    if (error) {
      console.error('❌ Error aplicando migración:', error);
      console.log('\n💡 Método alternativo: Aplicar manualmente en Supabase Dashboard');
      console.log('   Ve a https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
      console.log('   y ejecuta:');
      console.log(addColumnsSQL);
      return;
    }

    console.log('✅ Columnas agregadas exitosamente!');

    // Agregar comentarios
    const commentsSQL = `
      COMMENT ON COLUMN rental_contract_conditions.final_rent_price IS 'Precio final mensual del arriendo (CLP)';
      COMMENT ON COLUMN rental_contract_conditions.broker_name IS 'Nombre del corredor responsable';
      COMMENT ON COLUMN rental_contract_conditions.broker_rut IS 'RUT del corredor responsable';
    `;

    const { error: commentError } = await supabase.rpc('exec_sql', { sql: commentsSQL });

    if (commentError) {
      console.warn('⚠️ No se pudieron agregar comentarios:', commentError);
    } else {
      console.log('✅ Comentarios agregados!');
    }

    // Crear índices
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_rcc_final_rent_price ON rental_contract_conditions(final_rent_price);
      CREATE INDEX IF NOT EXISTS idx_rcc_broker_rut ON rental_contract_conditions(broker_rut);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });

    if (indexError) {
      console.warn('⚠️ No se pudieron crear índices:', indexError);
    } else {
      console.log('✅ Índices creados!');
    }

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  }
}

applyMigration();
