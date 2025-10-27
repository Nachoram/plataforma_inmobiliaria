import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function applyCharacteristicIdsMigration() {
  console.log('🔧 Aplicando migración: Asegurar columnas characteristic_id...');

  try {
    // 1. Verificar y poblar guarantor_characteristic_id en applications
    console.log('\n📋 Paso 1: Verificando guarantor_characteristic_id en applications...');

    const { data: appsData, error: appsError } = await supabase
      .from('applications')
      .select('id, guarantor_id, created_at')
      .limit(5);

    if (appsError) {
      console.log('❌ Error verificando applications:', appsError.message);
    } else {
      console.log('✅ Applications accesibles');

      // Intentar poblar guarantor_characteristic_id usando update
      const { error: updateAppsError } = await supabase
        .from('applications')
        .update({
          guarantor_characteristic_id: 'GUARANTOR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8)
        })
        .eq('guarantor_id', 'some-guarantor-id') // Esto fallará si la columna no existe, pero es ok
        .limit(1);

      if (updateAppsError && updateAppsError.message.includes('does not exist')) {
        console.log('⚠️  guarantor_characteristic_id no existe en applications - necesita migración manual');
      } else {
        console.log('✅ guarantor_characteristic_id existe o se puede actualizar');
      }
    }

    // 2. Verificar rental_owner_characteristic_id en rental_owners
    console.log('\n👤 Paso 2: Verificando rental_owner_characteristic_id en rental_owners...');

    const { data: ownersData, error: ownersError } = await supabase
      .from('rental_owners')
      .select('id, rental_owner_characteristic_id, created_at')
      .limit(5);

    if (ownersError) {
      console.log('❌ Error verificando rental_owners:', ownersError.message);
    } else {
      console.log('✅ rental_owners accesible');

      // Verificar si hay registros sin rental_owner_characteristic_id
      const recordsWithoutId = ownersData.filter(r => !r.rental_owner_characteristic_id);
      if (recordsWithoutId.length > 0) {
        console.log(`⚠️  ${recordsWithoutId.length} registros en rental_owners sin rental_owner_characteristic_id`);

        // Intentar actualizar uno como prueba
        if (ownersData[0] && !ownersData[0].rental_owner_characteristic_id) {
          const testId = 'RENTAL_OWNER_' + Date.now() + '_' + ownersData[0].id.substring(0, 8);
          const { error: updateError } = await supabase
            .from('rental_owners')
            .update({ rental_owner_characteristic_id: testId })
            .eq('id', ownersData[0].id);

          if (updateError) {
            console.log('❌ Error actualizando rental_owner_characteristic_id:', updateError.message);
          } else {
            console.log('✅ rental_owner_characteristic_id se puede actualizar');
          }
        }
      } else {
        console.log('✅ Todos los registros en rental_owners tienen rental_owner_characteristic_id');
      }
    }

    // 3. Verificar rental_contract_conditions
    console.log('\n📄 Paso 3: Verificando rental_contract_conditions...');

    const { data: contractsData, error: contractsError } = await supabase
      .from('rental_contract_conditions')
      .select('id, contract_conditions_characteristic_id, created_at')
      .limit(5);

    if (contractsError) {
      if (contractsError.message.includes('does not exist')) {
        console.log('❌ rental_contract_conditions NO existe - necesita creación manual');
      } else {
        console.log('❌ Error verificando rental_contract_conditions:', contractsError.message);
      }
    } else {
      console.log('✅ rental_contract_conditions existe');

      // Verificar si hay registros sin contract_conditions_characteristic_id
      const recordsWithoutContractId = contractsData.filter(r => !r.contract_conditions_characteristic_id);
      if (recordsWithoutContractId.length > 0) {
        console.log(`⚠️  ${recordsWithoutContractId.length} registros en rental_contract_conditions sin contract_conditions_characteristic_id`);

        // Intentar actualizar uno como prueba
        if (contractsData[0] && !contractsData[0].contract_conditions_characteristic_id) {
          const testId = 'CONTRACT_' + Date.now() + '_' + contractsData[0].id.substring(0, 8);
          const { error: updateError } = await supabase
            .from('rental_contract_conditions')
            .update({ contract_conditions_characteristic_id: testId })
            .eq('id', contractsData[0].id);

          if (updateError) {
            console.log('❌ Error actualizando contract_conditions_characteristic_id:', updateError.message);
          } else {
            console.log('✅ contract_conditions_characteristic_id se puede actualizar');
          }
        }
      } else {
        console.log('✅ Todos los registros en rental_contract_conditions tienen contract_conditions_characteristic_id');
      }
    }

    console.log('\n📋 RESUMEN:');
    console.log('===========');
    console.log('Para completar la migración, necesitas ejecutar el archivo SQL manualmente en Supabase Dashboard:');
    console.log('supabase/migrations/20251027150000_ensure_all_characteristic_ids.sql');
    console.log('\nPasos:');
    console.log('1. Ve a https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
    console.log('2. Crea una nueva consulta SQL');
    console.log('3. Copia y pega todo el contenido del archivo de migración');
    console.log('4. Haz clic en "Run"');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyCharacteristicIdsMigration();
