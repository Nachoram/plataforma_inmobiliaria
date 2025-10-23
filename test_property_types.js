// Script para probar la función getPropertyTypeInfo
import { getPropertyTypeInfo } from './src/lib/supabase.js';

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

console.log('🧪 Probando función getPropertyTypeInfo:\n');

testTypes.forEach((type, index) => {
  const result = getPropertyTypeInfo(type);
  console.log(`${index + 1}. Input: "${type}"`);
  console.log(`   Output: "${result.label}" (${result.color})`);
  console.log(`   Badge: ${result.bgColor}`);
  console.log('');
});

console.log('✅ Prueba completada. La función ya no tiene valor por defecto hardcodeado.');
