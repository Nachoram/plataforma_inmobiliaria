// Script de prueba para verificar que la función create-rental-contract funciona
// Ejecuta este script con: node test_contract_function.js

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (usa tus variables de entorno)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no está definido');
  console.log('Asegúrate de tener un archivo .env con tus variables de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testContractCreation() {
  console.log('🧪 Probando función create-rental-contract...');
  console.log('URL:', supabaseUrl);

  // Datos de prueba (ajusta según tus datos reales)
  const testData = {
    application_id: '550e8400-e29b-41d4-a716-446655440000', // UUID de prueba
    contract_start_date: '2025-01-01',
    duration: 12,
    final_rent_price: 500000,
    warranty_amount: 500000,
    payment_day: 5,
    property_type_characteristics_id: '550e8400-e29b-41d4-a716-446655440001',
    broker_name: 'Corredor Test',
    broker_rut: '12.345.678-9',
    broker_commission: 25000,
    allows_pets: true,
    dicom_clause: false,
    notification_email: 'test@example.com',
    bank_name: 'Banco Estado',
    account_type: 'corriente',
    account_number: '123456789',
    account_holder_name: 'Test Owner',
    account_holder_rut: '11.111.111-1'
  };

  try {
    console.log('📡 Enviando datos a la función...');
    console.log('Datos:', JSON.stringify(testData, null, 2));

    const { data, error } = await supabase.functions.invoke('create-rental-contract', {
      body: testData
    });

    if (error) {
      console.error('❌ Error al invocar la función:', error);
      console.log('Posibles causas:');
      console.log('1. La función no está desplegada en Supabase');
      console.log('2. Error de autenticación (necesitas estar logueado)');
      console.log('3. Error en la lógica de la función');
      return;
    }

    console.log('✅ Respuesta de la función:');
    console.log(JSON.stringify(data, null, 2));

    if (data?.success) {
      console.log('🎉 ¡La función funciona correctamente!');
      console.log('Contrato creado con ID:', data.contract?.id);
    } else {
      console.log('⚠️ La función respondió pero sin éxito:', data?.error);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la prueba
testContractCreation();

