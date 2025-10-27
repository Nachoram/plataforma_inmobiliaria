import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Función para poblar datos de prueba para testing
const populateTestData = async () => {
  console.log('🧪 Poblando datos de prueba para testing de contratos...\n');

  try {
    // 1. Obtener una aplicación existente para actualizar
    console.log('1️⃣ Buscando aplicación existente...');
    const { data: existingApp, error: appError } = await supabase
      .from('applications')
      .select('id, property_id')
      .limit(1)
      .single();

    if (appError || !existingApp) {
      console.log('❌ No hay aplicaciones existentes. Crea una postulación primero.');
      console.log('💡 Ve al frontend y crea una nueva postulación para poder probar.');
      return;
    }

    console.log('✅ Aplicación encontrada:', existingApp.id);

    // 2. Generar IDs de características únicos
    const timestamp = Date.now();
    const testIds = {
      application_characteristic_id: `test-app-char-${timestamp}`,
      property_characteristic_id: `test-prop-char-${timestamp}`,
      rental_owner_characteristic_id: `test-owner-char-${timestamp}`,
      contract_conditions_characteristic_id: `test-contract-char-${timestamp}`,
      guarantor_characteristic_id: `test-guarantor-char-${timestamp}`
    };

    console.log('📋 IDs de características generados:', testIds);

    // 3. Actualizar la aplicación con los IDs de características
    console.log('\n2️⃣ Actualizando aplicación con IDs de características...');
    const { error: updateAppError } = await supabase
      .from('applications')
      .update({
        application_characteristic_id: testIds.application_characteristic_id,
        guarantor_characteristic_id: testIds.guarantor_characteristic_id
      })
      .eq('id', existingApp.id);

    if (updateAppError) {
      console.error('❌ Error actualizando aplicación:', updateAppError);
    } else {
      console.log('✅ Aplicación actualizada');
    }

    // 4. Actualizar la propiedad con los IDs de características
    console.log('\n3️⃣ Actualizando propiedad con IDs de características...');
    const { error: updatePropError } = await supabase
      .from('properties')
      .update({
        property_characteristic_id: testIds.property_characteristic_id,
        rental_owner_characteristic_id: testIds.rental_owner_characteristic_id
      })
      .eq('id', existingApp.property_id);

    if (updatePropError) {
      console.error('❌ Error actualizando propiedad:', updatePropError);
    } else {
      console.log('✅ Propiedad actualizada');
    }

    // 5. Crear condiciones de contrato
    console.log('\n4️⃣ Creando condiciones de contrato...');
    const { error: contractError } = await supabase
      .from('contract_conditions')
      .insert({
        application_id: existingApp.id,
        contract_conditions_characteristic_id: testIds.contract_conditions_characteristic_id,
        start_date: new Date().toISOString().split('T')[0], // Fecha de hoy
        duration_months: 12,
        guarantee_amount: 850000,
        payment_day: 1,
        allows_pets: false,
        sublease_allowed: 'No Permitido',
        max_occupants: 4,
        broker_commission: 50000,
        payment_method: 'transferencia',
        bank_account_holder: 'Juan Pérez González',
        bank_account_rut: '12.345.678-9',
        bank_name: 'Banco Estado',
        bank_account_type: 'Cuenta Corriente',
        bank_account_number: '123456789'
      });

    if (contractError) {
      console.error('❌ Error creando condiciones de contrato:', contractError);
    } else {
      console.log('✅ Condiciones de contrato creadas');
    }

    // 6. Verificar que todo esté correcto
    console.log('\n5️⃣ Verificando datos poblados...');
    const contractData = await fetchContractData(existingApp.id);
    console.log('📋 Datos obtenidos:', contractData);

    // Verificar que no falten campos
    const missingFields = [];
    if (!contractData.application_characteristic_id) missingFields.push('application_characteristic_id');
    if (!contractData.property_characteristic_id) missingFields.push('property_characteristic_id');
    if (!contractData.rental_owner_characteristic_id) missingFields.push('rental_owner_characteristic_id');
    if (!contractData.contract_conditions_characteristic_id) missingFields.push('contract_conditions_characteristic_id');
    if (!contractData.guarantor_characteristic_id) missingFields.push('guarantor_characteristic_id');

    if (missingFields.length > 0) {
      console.log('❌ Aún faltan campos:', missingFields);
    } else {
      console.log('✅ Todos los campos requeridos están presentes');
      console.log('\n🎉 ¡Datos de prueba poblados exitosamente!');
      console.log('📋 ID de aplicación para testing:', existingApp.id);
      console.log('🚀 Ahora puedes probar el botón "Generar y Enviar Contrato" en el frontend');
    }

  } catch (error) {
    console.error('❌ Error poblando datos de prueba:', error);
  }
};

// Copia de la función fetchContractData para testing
const fetchContractData = async (applicationId) => {
  try {
    // Obtener datos de la postulación con todas las relaciones
    const { data: applicationData, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        application_characteristic_id,
        guarantor_characteristic_id,
        property_id,
        properties (
          property_characteristic_id,
          rental_owner_characteristic_id
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Obtener condiciones del contrato
    const { data: contractData, error: contractError } = await supabase
      .from('contract_conditions')
      .select('id, contract_conditions_characteristic_id')
      .eq('application_id', applicationId)
      .single();

    if (contractError) {
      console.warn('⚠️ No se encontraron condiciones de contrato');
    }

    return {
      application_characteristic_id: applicationData.application_characteristic_id,
      property_characteristic_id: applicationData.properties?.property_characteristic_id,
      rental_owner_characteristic_id: applicationData.properties?.rental_owner_characteristic_id,
      contract_conditions_characteristic_id: contractData?.contract_conditions_characteristic_id,
      guarantor_characteristic_id: applicationData.guarantor_characteristic_id
    };

  } catch (error) {
    console.error('❌ Error al obtener datos del contrato:', error);
    throw error;
  }
};

// Ejecutar el script
populateTestData();

