/**
 * Script de prueba para verificar que la sincronización de condiciones contractuales
 * a la tabla rental_contracts funciona correctamente.
 *
 * Este script:
 * 1. Aplica las migraciones necesarias
 * 2. Crea datos de prueba
 * 3. Verifica que la función sync_contract_conditions_to_rental_contract funciona
 * 4. Valida que todos los campos se rellenen correctamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'tu-service-role-key';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('tu-proyecto') || supabaseServiceKey.includes('tu-service-role-key')) {
  console.error('❌ Variables de entorno no configuradas');
  console.error('Necesitas configurar:');
  console.error('  VITE_SUPABASE_URL=tu-url-de-supabase');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key');
  console.error('');
  console.error('También puedes ejecutar los scripts SQL directamente:');
  console.error('  - test_sync_simple.sql (para datos existentes)');
  console.error('  - test_contract_sync_simple.sql (crea datos de prueba)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTest() {
  console.log('🚀 Iniciando pruebas de sincronización de contratos...\n');

  try {
    // 1. Aplicar migraciones si es necesario
    console.log('📝 Aplicando migraciones...');
    await applyMigrations();

    // 2. Crear datos de prueba
    console.log('🧪 Creando datos de prueba...');
    const testData = await createTestData();

    // 3. Probar la función de sincronización
    console.log('🔄 Probando sincronización de condiciones contractuales...');
    await testContractSync(testData);

    // 4. Validar resultados
    console.log('✅ Validando resultados...');
    await validateResults(testData);

    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

async function applyMigrations() {
  // Leer y ejecutar las migraciones necesarias
  const migrationFiles = [
    'supabase/migrations/20251110_create_rental_contract_on_approval_function.sql'
  ];

  for (const migrationFile of migrationFiles) {
    if (fs.existsSync(migrationFile)) {
      console.log(`Aplicando migración: ${migrationFile}`);
      const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

      const { error } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      });

      if (error) {
        console.warn(`⚠️ Error aplicando migración ${migrationFile}:`, error.message);
        // Continuar con otras migraciones
      }
    }
  }
}

async function createTestData() {
  console.log('Creando perfil de usuario de prueba...');

  // Crear un usuario de prueba
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';

  // Verificar si ya existe un usuario de prueba
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', testUserId)
    .single();

  if (!existingUser) {
    // Crear perfil de usuario
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        first_name: 'Juan',
        last_name: 'Pérez',
        phone: '+56912345678'
      });

    if (profileError) {
      console.error('Error creando perfil:', profileError);
      throw profileError;
    }
  }

  console.log('Creando propiedad de prueba...');

  // Crear propiedad de prueba
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert({
      title: 'Propiedad de Prueba para Contratos',
      description: 'Propiedad creada para testing de sincronización de contratos',
      price_clp: 500000,
      owner_id: testUserId,
      property_type_characteristics_id: '550e8400-e29b-41d4-a716-446655440001', // UUID ficticio
      address: 'Calle de Prueba 123',
      city: 'Santiago',
      region: 'Metropolitana'
    })
    .select()
    .single();

  if (propertyError) {
    console.error('Error creando propiedad:', propertyError);
    throw propertyError;
  }

  console.log('Creando aplicación de prueba...');

  // Crear aplicación de prueba
  const { data: application, error: appError } = await supabase
    .from('applications')
    .insert({
      property_id: property.id,
      applicant_id: testUserId,
      status: 'approved'
    })
    .select()
    .single();

  if (appError) {
    console.error('Error creando aplicación:', appError);
    throw appError;
  }

  console.log('Creando datos del aplicante...');

  // Crear datos del aplicante
  const { error: applicantError } = await supabase
    .from('application_applicants')
    .insert({
      application_id: application.id,
      first_name: 'María',
      paternal_last_name: 'González',
      maternal_last_name: 'Rodríguez',
      email: 'maria.gonzalez@example.com',
      phone: '+56987654321',
      rut: '12.345.678-9'
    });

  if (applicantError) {
    console.error('Error creando aplicante:', applicantError);
    throw applicantError;
  }

  console.log('Creando rental_owner...');

  // Crear rental_owner
  const { error: rentalOwnerError } = await supabase
    .from('rental_owners')
    .insert({
      property_id: property.id,
      first_name: 'Carlos',
      paternal_last_name: 'Sánchez',
      maternal_last_name: 'López',
      rut: '15.678.901-2',
      email: 'carlos.sanchez@example.com',
      phone: '+56911223344'
    });

  if (rentalOwnerError) {
    console.error('Error creando rental_owner:', rentalOwnerError);
    throw rentalOwnerError;
  }

  console.log('Creando contrato básico...');

  // Crear contrato básico primero
  const { data: contract, error: contractError } = await supabase
    .from('rental_contracts')
    .insert({
      application_id: application.id,
      status: 'draft',
      created_by: testUserId
    })
    .select()
    .single();

  if (contractError) {
    console.error('Error creando contrato básico:', contractError);
    throw contractError;
  }

  console.log('Creando condiciones contractuales...');

  // Crear condiciones contractuales
  const { data: conditions, error: conditionsError } = await supabase
    .from('rental_contract_conditions')
    .insert({
      application_id: application.id,
      final_rent_price: 550000,
      broker_name: 'Corredor de Prueba Ltda.',
      broker_rut: '76.123.456-7',
      contract_duration_months: 12,
      monthly_payment_day: 5,
      guarantee_amount: 550000,
      contract_start_date: '2025-12-01',
      accepts_pets: true,
      dicom_clause: true,
      notification_email: 'contratos@example.com',
      bank_name: 'Banco de Chile',
      account_type: 'Cuenta Corriente',
      account_number: '123456789',
      account_holder_name: 'Carlos Sánchez López',
      account_holder_rut: '15.678.901-2',
      brokerage_commission: 27500,
      additional_conditions: 'Contrato con cláusula especial para mascotas'
    })
    .select()
    .single();

  if (conditionsError) {
    console.error('Error creando condiciones:', conditionsError);
    throw conditionsError;
  }

  return {
    userId: testUserId,
    propertyId: property.id,
    applicationId: application.id,
    contractId: contract.id,
    conditionsId: conditions.id
  };
}

async function testContractSync(testData) {
  console.log('Llamando a la función de sincronización...');

  const { data: syncResult, error: syncError } = await supabase
    .rpc('sync_contract_conditions_to_rental_contract', {
      p_application_id: testData.applicationId
    });

  if (syncError) {
    console.error('Error en sincronización:', syncError);
    throw syncError;
  }

  console.log('Resultado de sincronización:', syncResult);

  if (!syncResult) {
    throw new Error('La función de sincronización no retornó un resultado válido');
  }

  return syncResult;
}

async function validateResults(testData) {
  console.log('Validando datos sincronizados en rental_contracts...');

  // Obtener el contrato actualizado
  const { data: contract, error: contractError } = await supabase
    .from('rental_contracts')
    .select('*')
    .eq('id', testData.contractId)
    .single();

  if (contractError) {
    console.error('Error obteniendo contrato:', contractError);
    throw contractError;
  }

  console.log('Contrato sincronizado:', contract);

  // Validaciones de campos críticos
  const validations = [
    { field: 'final_amount', expected: 550000, description: 'Monto final del contrato' },
    { field: 'guarantee_amount', expected: 550000, description: 'Monto de garantía' },
    { field: 'final_amount_currency', expected: 'clp', description: 'Moneda del monto final' },
    { field: 'guarantee_amount_currency', expected: 'clp', description: 'Moneda de la garantía' },
    { field: 'start_date', expected: '2025-12-01', description: 'Fecha de inicio' },
    { field: 'validity_period_months', expected: 12, description: 'Período de validez en meses' },
    { field: 'account_holder_name', expected: 'Carlos Sánchez López', description: 'Nombre del titular de cuenta' },
    { field: 'account_number', expected: '123456789', description: 'Número de cuenta' },
    { field: 'account_bank', expected: 'Banco de Chile', description: 'Banco' },
    { field: 'account_type', expected: 'corriente', description: 'Tipo de cuenta' },
    { field: 'has_dicom_clause', expected: true, description: 'Cláusula DICOM' },
    { field: 'allows_pets', expected: true, description: 'Permite mascotas' },
    { field: 'has_brokerage_commission', expected: true, description: 'Tiene comisión de corredor' },
    { field: 'broker_name', expected: 'Corredor de Prueba Ltda.', description: 'Nombre del corredor' },
    { field: 'broker_amount', expected: 27500, description: 'Monto de comisión del corredor' },
    { field: 'broker_rut', expected: '76.123.456-7', description: 'RUT del corredor' },
    { field: 'tenant_email', expected: 'maria.gonzalez@example.com', description: 'Email del arrendatario' },
    { field: 'landlord_email', expected: 'contratos@example.com', description: 'Email del arrendador' }
  ];

  let failedValidations = [];

  for (const validation of validations) {
    const actualValue = contract[validation.field];
    const expectedValue = validation.expected;

    if (actualValue !== expectedValue) {
      failedValidations.push({
        field: validation.field,
        expected: expectedValue,
        actual: actualValue,
        description: validation.description
      });
    }
  }

  if (failedValidations.length > 0) {
    console.error('❌ Validaciones fallidas:');
    failedValidations.forEach(failure => {
      console.error(`  - ${failure.description}: esperado "${failure.expected}", obtenido "${failure.actual}"`);
    });
    throw new Error(`${failedValidations.length} validaciones fallaron`);
  }

  console.log('✅ Todas las validaciones pasaron correctamente');

  // Verificar que los campos contract_content y contract_html estén presentes (aunque puedan ser null)
  if (!contract.hasOwnProperty('contract_content')) {
    throw new Error('El campo contract_content no existe en la tabla rental_contracts');
  }

  if (!contract.hasOwnProperty('contract_html')) {
    throw new Error('El campo contract_html no existe en la tabla rental_contracts');
  }

  console.log('✅ Campos contract_content y contract_html están presentes en la tabla');
}

// Ejecutar pruebas
if (require.main === module) {
  runTest()
    .then(() => {
      console.log('\n🎉 Pruebas completadas exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Las pruebas fallaron:', error);
      process.exit(1);
    });
}

module.exports = { runTest, createTestData, testContractSync, validateResults };
