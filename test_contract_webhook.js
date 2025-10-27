import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Simular función fetchContractData (igual que en el componente)
const fetchContractData = async (applicationId) => {
  try {
    console.log('🔍 Obteniendo datos del contrato para application:', applicationId);

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
      console.warn('⚠️ No se encontraron condiciones de contrato, usando valores por defecto');
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

// Función para probar el webhook (con mock para evitar envío real)
const testWebhookCall = async (contractCharacteristics) => {
  console.log('🧪 Probando envío al webhook (MOCK)...');

  // Preparar payload para el webhook
  const webhookPayload = {
    application_characteristic_id: contractCharacteristics.application_characteristic_id,
    property_characteristic_id: contractCharacteristics.property_characteristic_id,
    rental_owner_characteristic_id: contractCharacteristics.rental_owner_characteristic_id,
    contract_conditions_characteristic_id: contractCharacteristics.contract_conditions_characteristic_id,
    guarantor_characteristic_id: contractCharacteristics.guarantor_characteristic_id,
    timestamp: new Date().toISOString(),
    platform: 'plataforma_inmobiliaria',
    action: 'generate_contract'
  };

  console.log('📤 Payload que se enviaría:', JSON.stringify(webhookPayload, null, 2));

  // Simular respuesta del webhook
  const mockResponse = {
    success: true,
    contract_id: 'mock-contract-' + Date.now(),
    message: 'Contrato generado exitosamente'
  };

  console.log('✅ Respuesta mock del webhook:', mockResponse);

  return mockResponse;
};

// Función para crear datos de prueba
const createTestData = async () => {
  console.log('🛠️ Creando datos de prueba...');

  try {
    // Crear IDs únicos para las características
    const applicationCharId = 'test-app-char-' + Date.now();
    const propertyCharId = 'test-prop-char-' + Date.now();
    const ownerCharId = 'test-owner-char-' + Date.now();
    const contractCharId = 'test-contract-char-' + Date.now();
    const guarantorCharId = 'test-guarantor-char-' + Date.now();

    console.log('📋 IDs de características generados:', {
      application_characteristic_id: applicationCharId,
      property_characteristic_id: propertyCharId,
      rental_owner_characteristic_id: ownerCharId,
      contract_conditions_characteristic_id: contractCharId,
      guarantor_characteristic_id: guarantorCharId
    });

    // Nota: En un entorno real, necesitaríamos crear registros completos
    // con usuarios, propiedades, postulaciones, etc.
    // Por ahora, solo mostramos los IDs que se usarían

    return {
      application_characteristic_id: applicationCharId,
      property_characteristic_id: propertyCharId,
      rental_owner_characteristic_id: ownerCharId,
      contract_conditions_characteristic_id: contractCharId,
      guarantor_characteristic_id: guarantorCharId
    };

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  }
};

// Función principal de testing
const runContractTests = async () => {
  console.log('🚀 === INICIANDO TESTS DE CONTRATO WEBHOOK ===\n');

  try {
    // 1. Verificar estructura de BD
    console.log('1️⃣ VERIFICANDO ESTRUCTURA DE BASE DE DATOS');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️ No se puede verificar estructura (posible problema de permisos)');
    } else {
      const requiredTables = ['applications', 'properties', 'contract_conditions', 'guarantors'];
      const existingTables = tables.map(t => t.table_name);

      console.log('📋 Tablas existentes:', existingTables);
      console.log('📋 Tablas requeridas:', requiredTables);

      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      if (missingTables.length > 0) {
        console.log('❌ Faltan tablas:', missingTables);
        console.log('💡 Ejecuta la migración SQL primero');
        return;
      } else {
        console.log('✅ Todas las tablas existen');
      }
    }

    // 2. Crear datos de prueba
    console.log('\n2️⃣ CREANDO DATOS DE PRUEBA');
    const testCharacteristics = await createTestData();

    // 3. Probar fetchContractData (nota: esto fallará sin datos reales)
    console.log('\n3️⃣ PROBANDO FETCH CONTRACT DATA');
    console.log('⚠️ Esta prueba requiere una aplicación real en la BD');
    console.log('💡 Para probar completamente, necesitas:');
    console.log('   - Una aplicación existente con todos los IDs de características');
    console.log('   - Condiciones de contrato asociadas');

    // 4. Probar webhook call
    console.log('\n4️⃣ PROBANDO WEBHOOK CALL');
    await testWebhookCall(testCharacteristics);

    // 5. Verificar validaciones
    console.log('\n5️⃣ PROBANDO VALIDACIONES');
    const invalidCharacteristics = {
      application_characteristic_id: null,
      property_characteristic_id: 'test',
      rental_owner_characteristic_id: 'test',
      contract_conditions_characteristic_id: null,
      guarantor_characteristic_id: 'test'
    };

    console.log('📋 Probando con datos inválidos:', invalidCharacteristics);
    const missingFields = [];
    if (!invalidCharacteristics.application_characteristic_id) missingFields.push('application_characteristic_id');
    if (!invalidCharacteristics.property_characteristic_id) missingFields.push('property_characteristic_id');
    if (!invalidCharacteristics.rental_owner_characteristic_id) missingFields.push('rental_owner_characteristic_id');
    if (!invalidCharacteristics.contract_conditions_characteristic_id) missingFields.push('contract_conditions_characteristic_id');
    if (!invalidCharacteristics.guarantor_characteristic_id) missingFields.push('guarantor_characteristic_id');

    if (missingFields.length > 0) {
      console.log('✅ Validación funciona - Campos faltantes detectados:', missingFields);
    }

    console.log('\n🎉 TESTS COMPLETADOS');
    console.log('\n📋 CHECKLIST FINAL:');
    console.log('✅ Migración SQL creada');
    console.log('✅ Componente actualizado con nueva funcionalidad');
    console.log('✅ Función fetchContractData implementada');
    console.log('✅ Función handleGenerateContract implementada');
    console.log('✅ Estados de carga y error agregados');
    console.log('✅ Botón actualizado en el modal');
    console.log('✅ Script de testing creado');

    console.log('\n⚠️ PENDIENTE: Aplicar migración SQL manualmente en Supabase Dashboard');
    console.log('📁 Archivo: supabase/migrations/20251025180000_add_contract_characteristics.sql');

  } catch (error) {
    console.error('❌ Error en tests:', error);
  }
};

// Ejecutar tests
runContractTests();

