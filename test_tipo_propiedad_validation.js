/**
 * Script para probar la validación de tipo_propiedad en RentalPublicationForm
 */

console.log('🧪 Probando validación de tipo_propiedad...\n');

// Simular la validación que se agregó al código
function validateTipoPropiedad(formData) {
  // Validate tipo_propiedad (required and cannot be empty)
  if (!formData.tipoPropiedad || formData.tipoPropiedad.trim() === '') {
    throw new Error('El tipo de propiedad es requerido. Por favor selecciona un tipo de propiedad.');
  }

  console.log('✅ Tipo de propiedad válido:', formData.tipoPropiedad);
  return true;
}

// Casos de prueba
const testCases = [
  { tipoPropiedad: 'Casa', expected: true, description: 'Valor válido' },
  { tipoPropiedad: 'Departamento', expected: true, description: 'Valor válido' },
  { tipoPropiedad: 'Oficina', expected: true, description: 'Valor válido' },
  { tipoPropiedad: 'Local Comercial', expected: true, description: 'Valor válido' },
  { tipoPropiedad: 'Estacionamiento', expected: true, description: 'Valor válido' },
  { tipoPropiedad: 'Bodega', expected: true, description: 'Valor válido' },
  { tipoPropiedad: 'Parcela', expected: true, description: 'Valor válido' },
  { tipoPropiedad: '', expected: false, description: 'String vacío (problema original)' },
  { tipoPropiedad: null, expected: false, description: 'Valor null' },
  { tipoPropiedad: undefined, expected: false, description: 'Valor undefined' },
  { tipoPropiedad: '   ', expected: false, description: 'Solo espacios en blanco' },
];

console.log('📋 Casos de prueba:\n');

testCases.forEach((testCase, index) => {
  const { tipoPropiedad, expected, description } = testCase;

  try {
    validateTipoPropiedad({ tipoPropiedad });
    if (expected) {
      console.log(`✅ Caso ${index + 1}: ${description} - PASÓ`);
    } else {
      console.log(`❌ Caso ${index + 1}: ${description} - Debería haber fallado pero pasó`);
    }
  } catch (error) {
    if (!expected) {
      console.log(`✅ Caso ${index + 1}: ${description} - PASÓ (falló correctamente: ${error.message})`);
    } else {
      console.log(`❌ Caso ${index + 1}: ${description} - FALLÓ inesperadamente: ${error.message}`);
    }
  }
});

console.log('\n🎯 Resumen de la corrección:');
console.log('✅ Agregada validación para tipo_propiedad requerido');
console.log('✅ Cambiado valor por defecto de "" a "Casa"');
console.log('✅ Corregida inicialización en modo edición');
console.log('✅ El error "invalid input value for enum tipo_propiedad_enum" debería estar resuelto');

console.log('\n🚀 La validación ahora debería prevenir el envío de valores vacíos al enum.');
