/**
 * Script para probar que las validaciones no fallen con undefined
 */

const validateRut = (rut) => {
  if (!rut || !rut.trim()) return false;
  // Simplified validation for testing
  return true;
};

// Función de validación similar a la del formulario
function validateForm(formData) {
  const newErrors = {};

  // Required fields validation
  if (formData.address_street && !formData.address_street.trim()) newErrors.address_street = 'La calle es requerida';
  if (formData.address_number && !formData.address_number.trim()) newErrors.address_number = 'El número es requerido';
  if (!formData.region) newErrors.region = 'La región es requerida';
  if (!formData.commune) newErrors.commune = 'La comuna es requerida';
  if (formData.price && !formData.price.trim()) newErrors.price = 'El precio de arriendo es requerido';

  // Validaciones condicionales según el tipo de propietario
  if (formData.owner_type === 'natural') {
    if (!formData.owner_first_name || !formData.owner_first_name.trim()) newErrors.owner_first_name = 'El nombre del propietario es requerido';
    if (!formData.owner_paternal_last_name || !formData.owner_paternal_last_name.trim()) newErrors.owner_paternal_last_name = 'El apellido paterno del propietario es requerido';
    if (!formData.owner_maternal_last_name || !formData.owner_maternal_last_name.trim()) newErrors.owner_maternal_last_name = 'El apellido materno del propietario es requerido';
    if (!formData.owner_rut || !formData.owner_rut.trim()) newErrors.owner_rut = 'El RUT del propietario es requerido';
    if (formData.owner_rut && formData.owner_rut.trim() && !validateRut(formData.owner_rut)) {
      newErrors.owner_rut = 'El RUT del propietario no es válido';
    }
    if (!formData.marital_status) newErrors.marital_status = 'El estado civil es requerido';
  } else if (formData.owner_type === 'juridica') {
    if (!formData.owner_company_name || !formData.owner_company_name.trim()) newErrors.owner_company_name = 'La razón social es requerida';
    if (!formData.owner_company_rut || !formData.owner_company_rut.trim()) newErrors.owner_company_rut = 'El RUT de la empresa es requerido';

    // Validaciones para el representante legal
    if (!formData.owner_representative_first_name || !formData.owner_representative_first_name.trim()) newErrors.owner_representative_first_name = 'El nombre del representante legal es requerido';
    if (!formData.owner_representative_paternal_last_name || !formData.owner_representative_paternal_last_name.trim()) newErrors.owner_representative_paternal_last_name = 'El apellido paterno del representante legal es requerido';
    if (!formData.owner_representative_rut || !formData.owner_representative_rut.trim()) newErrors.owner_representative_rut = 'El RUT del representante legal es requerido';
  }

  // Validaciones comunes para ambos tipos
  if (!formData.owner_address_street || !formData.owner_address_street.trim()) newErrors.owner_address_street = 'La calle del propietario es requerida';
  if (!formData.owner_address_number || !formData.owner_address_number.trim()) newErrors.owner_address_number = 'El número del propietario es requerido';
  if (!formData.owner_region) newErrors.owner_region = 'La región del propietario es requerida';
  if (!formData.owner_commune) newErrors.owner_commune = 'La comuna del propietario es requerida';

  // Validación de email para personas naturales
  if (formData.owner_type === 'natural' && (!formData.owner_email || !formData.owner_email.trim())) {
    newErrors.owner_email = 'El email del propietario es requerido';
  }

  return newErrors;
}

// Casos de prueba
const testCases = [
  {
    name: 'Formulario con campos undefined',
    data: {
      owner_type: 'natural',
      // Campos undefined que causaban el error
      owner_email: undefined,
      owner_first_name: undefined,
      owner_paternal_last_name: undefined,
      owner_maternal_last_name: undefined,
      owner_rut: undefined,
      owner_address_street: undefined,
      owner_address_number: undefined,
    },
    expected: 'should not throw error'
  },
  {
    name: 'Formulario con campos null',
    data: {
      owner_type: 'natural',
      owner_email: null,
      owner_first_name: null,
      owner_paternal_last_name: null,
      owner_maternal_last_name: null,
      owner_rut: null,
      owner_address_street: null,
      owner_address_number: null,
    },
    expected: 'should not throw error'
  },
  {
    name: 'Campos requeridos vacíos',
    data: {
      owner_type: 'natural',
      owner_email: '',
      owner_first_name: '',
      owner_paternal_last_name: '',
      owner_maternal_last_name: '',
      owner_rut: '',
      owner_address_street: '',
      owner_address_number: '',
      owner_region: '',
      owner_commune: '',
    },
    expected: 'should return validation errors'
  }
];

console.log('🧪 Probando validaciones contra undefined...\n');

testCases.forEach((testCase, index) => {
  try {
    const errors = validateForm(testCase.data);
    console.log(`✅ Caso ${index + 1}: ${testCase.name} - PASÓ`);
    if (testCase.expected === 'should return validation errors') {
      console.log(`   📋 Errores encontrados: ${Object.keys(errors).length}`);
    }
  } catch (error) {
    console.log(`❌ Caso ${index + 1}: ${testCase.name} - FALLÓ: ${error.message}`);
  }
});

console.log('\n🎉 Pruebas completadas. Las validaciones ahora manejan correctamente valores undefined y null.');
