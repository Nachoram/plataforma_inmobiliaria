import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function applyContractMigration() {
  console.log('🔧 Aplicando migración de características de contrato...');

  try {
    // Leer el archivo de migración
    const migrationSQL = fs.readFileSync('supabase/migrations/20251027150000_ensure_all_characteristic_ids.sql', 'utf8');

    console.log('📄 Ejecutando migración SQL (UUID version)...');

    // Ejecutar la migración usando rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error aplicando migración:', error);
      console.log('\n💡 Método alternativo: Aplicar manualmente en Supabase Dashboard');
      console.log('   1. Ve a https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
      console.log('   2. Crea una nueva consulta SQL');
      console.log('   3. Copia y pega el contenido del archivo supabase/migrations/20251025180000_add_contract_characteristics.sql');
      console.log('   4. Haz clic en "Run"');
      return;
    }

    console.log('✅ Migración aplicada exitosamente:', data);

    // Verificar que las columnas se crearon correctamente
    console.log('\n🔍 Verificando columnas creadas...');

    // Verificar applications
    const { data: appCols, error: appErr } = await supabase
      .from('applications')
      .select('application_characteristic_id, guarantor_characteristic_id')
      .limit(1);

    if (appErr && !appErr.message.includes('does not exist')) {
      console.log('⚠️  Advertencia con applications:', appErr.message);
    } else {
      console.log('✅ applications: columnas verificadas');
    }

    // Verificar properties
    const { data: propCols, error: propErr } = await supabase
      .from('properties')
      .select('property_characteristic_id, rental_owner_characteristic_id')
      .limit(1);

    if (propErr && !propErr.message.includes('does not exist')) {
      console.log('⚠️  Advertencia con properties:', propErr.message);
    } else {
      console.log('✅ properties: columnas verificadas');
    }

    // Verificar rental_contract_conditions
    const { data: contractCols, error: contractErr } = await supabase
      .from('rental_contract_conditions')
      .select('contract_conditions_characteristic_id')
      .limit(1);

    if (contractErr) {
      console.log('⚠️  rental_contract_conditions podría no existir aún:', contractErr.message);
    } else {
      console.log('✅ rental_contract_conditions: tabla creada');
    }

    // Verificar rental_owners
    const { data: ownerCols, error: ownerErr } = await supabase
      .from('rental_owners')
      .select('rental_owner_characteristic_id')
      .limit(1);

    if (ownerErr && !ownerErr.message.includes('does not exist')) {
      console.log('⚠️  Advertencia con rental_owners:', ownerErr.message);
    } else {
      console.log('✅ rental_owners: columnas verificadas');
    }

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  }
}

applyContractMigration();

