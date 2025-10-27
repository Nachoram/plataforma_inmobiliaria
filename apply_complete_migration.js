import fs from 'fs';

// URL de Supabase
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';

// Leer la migración completa
console.log('🔧 Aplicando migración completa de rental_owners y characteristics...');

try {
  const migrationSQL = fs.readFileSync('supabase/migrations/20251027160000_complete_rental_owners_and_characteristics.sql', 'utf8');

  console.log('📄 Migración cargada correctamente');
  console.log(`📊 Tamaño: ${migrationSQL.length} caracteres`);
  console.log('');

  console.log('🎯 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN:');
  console.log('===========================================');
  console.log('');
  console.log('1. Ve a: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
  console.log('');
  console.log('2. Crea una nueva consulta SQL');
  console.log('');
  console.log('3. Copia y pega TODO el contenido del archivo:');
  console.log('   supabase/migrations/20251027160000_complete_rental_owners_and_characteristics.sql');
  console.log('');
  console.log('4. Haz clic en "Run"');
  console.log('');
  console.log('5. Espera a que termine (puede tomar unos segundos)');
  console.log('');
  console.log('6. Verifica que no hay errores en la salida');
  console.log('');
  console.log('✅ RESULTADO ESPERADO:');
  console.log('   - Tabla rental_owners creada y poblada');
  console.log('   - Todas las columnas characteristic_id agregadas');
  console.log('   - Todos los UUIDs generados correctamente');
  console.log('');
  console.log('🧪 PARA VERIFICAR:');
  console.log('Ejecuta esta consulta después:');
  console.log('');
  console.log('SELECT COUNT(*) as rental_owners_count FROM rental_owners;');
  console.log('');
  console.log('Deberías ver un número mayor a 0 (dependiendo de cuántas propiedades de arriendo tienes)');
  console.log('');
  console.log('===========================================');
  console.log('');
  console.log('⚠️  IMPORTANTE: Esta migración es segura de ejecutar múltiples veces.');
  console.log('   Usa "IF NOT EXISTS" y "WHERE ... IS NULL" para evitar duplicados.');
  console.log('');
  console.log('🚀 Una vez aplicada, el error "PGRST116" desaparecerá y fetchContractData funcionará.');

} catch (error) {
  console.error('❌ Error al leer la migración:', error);
}
