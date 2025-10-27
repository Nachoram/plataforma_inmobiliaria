import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testDicomClauseSave() {
  console.log('🧪 Probando guardado del campo dicom_clause...\n');

  try {
    // 1. Obtener una aplicación de prueba
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

    // 2. Datos de prueba para las condiciones del contrato
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
      dicom_clause: true, // Probar con true
      additional_conditions: 'Condiciones de prueba',
      payment_method: 'transferencia',
      bank_name: 'Banco Estado',
      account_type: 'Cuenta Corriente',
      account_number: '12345678',
      account_holder_rut: '12.345.678-9',
      account_holder_name: 'Juan Pérez',
      automatic_renewal: false,
      termination_clause_non_payment: 'En caso de no pago, el arrendador podrá terminar el contrato.',
      official_communication_email: 'test@example.com'
    };

    console.log('💾 Guardando condiciones con dicom_clause = true...');
    console.log('📊 Datos a guardar:', { dicom_clause: testConditionsData.dicom_clause });

    // 3. Intentar guardar/actualizar las condiciones
    const { data: savedData, error: saveError } = await supabase
      .from('rental_contract_conditions')
      .upsert(testConditionsData, { onConflict: 'application_id' })
      .select('id, dicom_clause, application_id')
      .single();

    if (saveError) {
      console.error('❌ Error al guardar:', saveError);
      return;
    }

    console.log('✅ Condiciones guardadas exitosamente!');
    console.log('📊 Datos guardados:', savedData);

    // 4. Verificar que se guardó correctamente
    if (savedData.dicom_clause === true) {
      console.log('✅ SUCCESS: dicom_clause se guardó correctamente como true');
    } else {
      console.log('❌ ERROR: dicom_clause no se guardó correctamente. Valor:', savedData.dicom_clause);
    }

    // 5. Probar guardando con false
    console.log('\n🔄 Probando con dicom_clause = false...');
    const testConditionsDataFalse = {
      ...testConditionsData,
      dicom_clause: false
    };

    const { data: savedDataFalse, error: saveErrorFalse } = await supabase
      .from('rental_contract_conditions')
      .upsert(testConditionsDataFalse, { onConflict: 'application_id' })
      .select('id, dicom_clause, application_id')
      .single();

    if (saveErrorFalse) {
      console.error('❌ Error al guardar con false:', saveErrorFalse);
      return;
    }

    console.log('✅ Condiciones actualizadas exitosamente!');
    console.log('📊 Datos actualizados:', savedDataFalse);

    if (savedDataFalse.dicom_clause === false) {
      console.log('✅ SUCCESS: dicom_clause se actualizó correctamente a false');
    } else {
      console.log('❌ ERROR: dicom_clause no se actualizó correctamente. Valor:', savedDataFalse.dicom_clause);
    }

    // 6. Verificar en la base de datos directamente
    console.log('\n🔍 Verificando directamente en la base de datos...');
    const { data: dbCheck, error: dbError } = await supabase
      .from('rental_contract_conditions')
      .select('dicom_clause')
      .eq('application_id', applicationId)
      .single();

    if (dbError) {
      console.error('❌ Error al verificar en BD:', dbError);
    } else {
      console.log('📊 Valor en base de datos:', dbCheck.dicom_clause);
      if (dbCheck.dicom_clause === false) {
        console.log('✅ CONFIRMED: La base de datos tiene el valor correcto (false)');
      } else {
        console.log('❌ MISMATCH: La base de datos tiene un valor diferente');
      }
    }

    console.log('\n🎉 Prueba completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testDicomClauseSave();
