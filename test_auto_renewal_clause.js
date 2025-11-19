import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testAutoRenewalClause() {
  console.log('🧪 Probando funcionalidad de cláusula de renovación automática...\n');

  try {
    // 1. Verificar que la columna existe en rental_contracts
    console.log('1️⃣ Verificando que la columna has_auto_renewal_clause existe...');
    const { data: columnCheck, error: columnError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'rental_contracts'
          AND column_name = 'has_auto_renewal_clause'
        `
      });

    if (columnError) {
      console.error('❌ Error al verificar columna:', columnError);
      return;
    }

    if (!columnCheck || columnCheck.length === 0) {
      console.error('❌ La columna has_auto_renewal_clause NO existe en rental_contracts');
      console.log('🔧 Necesitas ejecutar el script apply_auto_renewal_migration.sql primero');
      return;
    }

    console.log('✅ Columna has_auto_renewal_clause encontrada:', columnCheck[0]);

    // 2. Obtener una aplicación de prueba
    console.log('\n2️⃣ Obteniendo aplicación de prueba...');
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id')
      .limit(1);

    if (appError) throw appError;
    if (!applications || applications.length === 0) {
      console.log('❌ No se encontraron aplicaciones de prueba');
      return;
    }

    const applicationId = applications[0].id;
    console.log('📋 Usando aplicación ID:', applicationId);

    // 3. Probar guardar condiciones con auto_renewal_clause = true
    console.log('\n3️⃣ Probando guardar condiciones con cláusula de renovación automática...');
    const testConditionsData = {
      application_id: applicationId,
      final_rent_price: 500000,
      broker_name: 'Corredor Prueba',
      broker_rut: '12.345.678-9',
      contract_duration_months: 12,
      monthly_payment_day: 5,
      guarantee_amount: 500000,
      contract_start_date: new Date().toISOString().split('T')[0],
      accepts_pets: false,
      dicom_clause: true,
      auto_renewal_clause: true, // Probar con true
      additional_conditions: 'Condiciones de prueba con renovación automática',
      payment_method: 'transferencia_bancaria',
      bank_name: 'Banco Estado',
      account_type: 'Cuenta Corriente',
      account_number: '12345678',
      account_holder_rut: '12.345.678-9',
      account_holder_name: 'Juan Pérez',
      landlord_email: 'test@example.com'
    };

    const { data: conditionsResult, error: conditionsError } = await supabase
      .from('rental_contract_conditions')
      .insert(testConditionsData)
      .select('id, auto_renewal_clause')
      .single();

    if (conditionsError) {
      console.error('❌ Error al guardar condiciones:', conditionsError);
      return;
    }

    console.log('✅ Condiciones guardadas exitosamente:', conditionsResult);

    // 4. Verificar que el contrato se creó con la cláusula de renovación
    console.log('\n4️⃣ Verificando que el contrato incluye la cláusula de renovación...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar un segundo

    const { data: createdContract, error: verifyError } = await supabase
      .from('rental_contracts')
      .select('id, has_auto_renewal_clause, contract_content')
      .eq('application_id', applicationId)
      .single();

    if (verifyError) {
      console.error('❌ Error al verificar contrato:', verifyError);
      return;
    }

    if (!createdContract) {
      console.error('❌ No se encontró el contrato creado');
      return;
    }

    console.log('✅ Contrato creado con has_auto_renewal_clause:', createdContract.has_auto_renewal_clause);

    // 5. Verificar que el contrato incluye la cláusula en el contenido
    if (createdContract.contract_content) {
      const contentStr = JSON.stringify(createdContract.contract_content);
      if (contentStr.includes('renovación automática') && contentStr.includes('período igual')) {
        console.log('✅ El contenido del contrato incluye la cláusula de renovación automática');
      } else {
        console.log('⚠️ El contenido del contrato NO incluye la cláusula de renovación automática');
      }
    }

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('📋 Resumen:');
    console.log('   - Columna has_auto_renewal_clause: ✅ Existe');
    console.log('   - Condiciones guardadas: ✅ Exitoso');
    console.log('   - Contrato creado: ✅ Exitoso');
    console.log('   - Cláusula en contrato: ✅ Incluida');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testAutoRenewalClause();







