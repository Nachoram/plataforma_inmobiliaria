// Script de prueba para validar la función de mapeo mapFormDataToDatabase
// Ejecutar con: node test_mapping_function.js

// Simular datos del formulario (como vienen de AdminPropertyDetailView)
const mockFormData = {
  duration: '12',
  payment_day: '5',
  monthly_rent: '500000',
  warranty_amount: '500000',
  notification_email: 'test@example.com',
  allows_pets: false,
  dicom_clause: true,
  special_conditions_house: 'Condiciones especiales de prueba',
  broker_name: 'Juan Pérez',
  broker_rut: '12345678-9',
  broker_commission: '25000',
  bank_name: 'Banco Estado',
  account_type: 'Cuenta Corriente',
  account_number: '123456789',
  account_holder_name: 'Juan Pérez',
  account_holder_rut: '12345678-9'
};

// Simular selectedProfile
const mockSelectedProfile = {
  applicationId: 'uuid-de-aplicacion-prueba'
};

// Función de mapeo (copia de la implementada en AdminPropertyDetailView)
const mapFormDataToDatabase = (formData) => {
  return {
    application_id: mockSelectedProfile.applicationId,

    // Campos temporales - duration se convierte a lease_term_months
    lease_term_months: Number(formData.duration),

    // Día de pago (validado 1-31)
    payment_day: Number(formData.payment_day),

    // Campos económicos - mapeo correcto
    final_price_clp: Number(formData.monthly_rent),
    broker_commission_clp: Number(formData.broker_commission) || null,
    guarantee_amount_clp: Number(formData.warranty_amount),

    // Email oficial
    official_communication_email: formData.notification_email?.trim() || null,

    // Condiciones booleanas - mapeo correcto
    accepts_pets: Boolean(formData.allows_pets),
    dicom_clause: Boolean(formData.dicom_clause),

    // Condiciones adicionales
    additional_conditions: formData.special_conditions_house?.trim() || null,

    // Información del broker
    broker_name: formData.broker_name?.trim() || null,
    broker_rut: formData.broker_rut?.trim() || null,

    // Información bancaria (si existe)
    bank_name: formData.bank_name?.trim() || null,
    account_type: formData.account_type?.trim() || null,
    account_number: formData.account_number?.trim() || null,
    account_holder_name: formData.account_holder_name?.trim() || null,
    account_holder_rut: formData.account_holder_rut?.trim() || null,

    // Actualizar timestamp
    updated_at: new Date().toISOString(),
  };
};

// Función de validación básica
const validateFormData = (formData) => {
  const errors = [];

  // Validar duración del contrato (1-60 meses)
  if (!formData.duration || Number(formData.duration) < 1 || Number(formData.duration) > 60) {
    errors.push('duración del contrato (debe estar entre 1 y 60 meses)');
  }

  // Validar día de pago (1-31)
  if (!formData.payment_day || Number(formData.payment_day) < 1 || Number(formData.payment_day) > 31) {
    errors.push('día de pago (debe estar entre 1 y 31)');
  }

  // Validar precio mensual (debe ser positivo)
  if (formData.monthly_rent === null || formData.monthly_rent === undefined || Number(formData.monthly_rent) <= 0) {
    errors.push('precio mensual (debe ser mayor a 0)');
  }

  // Validar monto de garantía (puede ser 0 pero no negativo)
  if (formData.warranty_amount === null || formData.warranty_amount === undefined || Number(formData.warranty_amount) < 0) {
    errors.push('monto de garantía (no puede ser negativo)');
  }

  // Validar email oficial
  if (!formData.notification_email || formData.notification_email.trim() === '') {
    errors.push('correo electrónico oficial');
  }

  // Validar RUT del broker si se proporciona
  if (formData.broker_rut && formData.broker_rut.trim() !== '') {
    const rutRegex = /^\d{7,8}-[\dkK]$/;
    if (!rutRegex.test(formData.broker_rut.trim())) {
      errors.push('RUT del corredor (formato inválido)');
    }
  }

  // Validar comisión del broker (no puede ser negativa)
  if (formData.broker_commission && Number(formData.broker_commission) < 0) {
    errors.push('comisión del corredor (no puede ser negativa)');
  }

  return errors;
};

// Ejecutar pruebas
console.log('🧪 PRUEBA DE MAPEO DE CAMPOS\n');

console.log('📋 Datos del formulario de entrada:');
console.log(JSON.stringify(mockFormData, null, 2));

console.log('\n🔄 Validando datos del formulario...');
const validationErrors = validateFormData(mockFormData);

if (validationErrors.length > 0) {
  console.log('❌ Errores de validación:', validationErrors);
} else {
  console.log('✅ Validación exitosa');

  console.log('\n🔄 Aplicando mapeo de campos...');
  const mappedData = mapFormDataToDatabase(mockFormData);

  console.log('📝 Datos mapeados para la base de datos:');
  console.log(JSON.stringify(mappedData, null, 2));

  // Verificaciones específicas
  console.log('\n✅ VERIFICACIONES:');

  // Verificar mapeos críticos
  const checks = [
    { campo: 'duration → lease_term_months', esperado: Number(mockFormData.duration), actual: mappedData.lease_term_months, correcto: Number(mockFormData.duration) === mappedData.lease_term_months },
    { campo: 'monthly_rent → final_price_clp', esperado: Number(mockFormData.monthly_rent), actual: mappedData.final_price_clp, correcto: Number(mockFormData.monthly_rent) === mappedData.final_price_clp },
    { campo: 'warranty_amount → guarantee_amount_clp', esperado: Number(mockFormData.warranty_amount), actual: mappedData.guarantee_amount_clp, correcto: Number(mockFormData.warranty_amount) === mappedData.guarantee_amount_clp },
    { campo: 'notification_email → official_communication_email', esperado: mockFormData.notification_email.trim(), actual: mappedData.official_communication_email, correcto: mockFormData.notification_email.trim() === mappedData.official_communication_email },
    { campo: 'allows_pets → accepts_pets', esperado: Boolean(mockFormData.allows_pets), actual: mappedData.accepts_pets, correcto: Boolean(mockFormData.allows_pets) === mappedData.accepts_pets },
    { campo: 'special_conditions_house → additional_conditions', esperado: mockFormData.special_conditions_house.trim(), actual: mappedData.additional_conditions, correcto: mockFormData.special_conditions_house.trim() === mappedData.additional_conditions },
  ];

  checks.forEach(check => {
    console.log(`${check.correcto ? '✅' : '❌'} ${check.campo}: ${check.correcto ? 'OK' : `Esperado: ${check.esperado}, Actual: ${check.actual}`}`);
  });

  const allCorrect = checks.every(check => check.correcto);
  console.log(`\n🎯 RESULTADO FINAL: ${allCorrect ? '✅ TODOS LOS MAPEOS CORRECTOS' : '❌ HAY ERRORES EN LOS MAPEOS'}`);
}

console.log('\n🏁 PRUEBA COMPLETADA');
