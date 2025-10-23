// Script inline para probar la lógica de getPropertyTypeInfo
function getPropertyTypeInfo(propertyType) {
  // Remove hardcoded default - show actual value or fallback to "No especificado"
  const type = propertyType || 'No especificado';
  const typeMap = {
    'Casa': { label: 'Casa', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    'Departamento': { label: 'Departamento', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    'Oficina': { label: 'Oficina', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    'Local Comercial': { label: 'Local Comercial', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    'Estacionamiento': { label: 'Estacionamiento', color: 'text-green-700', bgColor: 'bg-green-100' },
    'Bodega': { label: 'Bodega', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    'Parcela': { label: 'Parcela', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
    'No especificado': { label: 'No especificado', color: 'text-gray-500', bgColor: 'bg-gray-100' }
  };
  return typeMap[type] || typeMap['No especificado'];
}

// Simular diferentes tipos de propiedad
const testTypes = [
  'Casa',
  'Departamento',
  'Parcela',
  'Oficina',
  'Estacionamiento',
  'Bodega',
  'Local Comercial',
  undefined,
  null,
  ''
];

console.log('🧪 Probando función getPropertyTypeInfo (versión corregida):\n');

testTypes.forEach((type, index) => {
  const result = getPropertyTypeInfo(type);
  console.log(`${index + 1}. Input: "${type}"`);
  console.log(`   Output: "${result.label}" (${result.color})`);
  console.log(`   Badge: ${result.bgColor}`);
  console.log('');
});

console.log('✅ Prueba completada. La función ya no tiene valor por defecto hardcodeado.');
console.log('   - Antes: Siempre mostraba "Casa" cuando propertyType era undefined');
console.log('   - Ahora: Muestra "No especificado" cuando propertyType es undefined/null');
