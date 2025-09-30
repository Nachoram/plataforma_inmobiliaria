// Script simple para probar la conexión con Supabase
import { createClient } from '@supabase/supabase-js';

// Variables de entorno (simulando las del .env)
const supabaseUrl = 'https://uodpyvhgerxwoibdfths.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

console.log('🔍 Probando conexión con Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key presente:', !!supabaseKey);

try {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Verificar que el cliente se crea
  console.log('✅ Cliente Supabase creado correctamente');

  // Test 2: Intentar una consulta simple
  console.log('🔄 Probando consulta a la base de datos...');

  const { data, error } = await supabase
    .from('properties')
    .select('count')
    .limit(1);

  if (error) {
    console.log('❌ Error en consulta:', error.message);
  } else {
    console.log('✅ Consulta exitosa. Datos:', data);
  }

  // Test 3: Verificar autenticación
  console.log('🔄 Probando sistema de autenticación...');

  const { data: authData, error: authError } = await supabase.auth.getSession();

  if (authError) {
    console.log('❌ Error en autenticación:', authError.message);
  } else {
    console.log('✅ Autenticación operativa. Sesión:', authData.session ? 'Activa' : 'Inactiva');
  }

  // Test 4: Verificar storage
  console.log('🔄 Probando sistema de storage...');

  const { data: buckets, error: storageError } = await supabase.storage.listBuckets();

  if (storageError) {
    console.log('❌ Error en storage:', storageError.message);
  } else {
    console.log('✅ Storage operativo. Buckets encontrados:', buckets?.length || 0);
  }

  console.log('🎉 ¡Diagnóstico completado!');

} catch (error) {
  console.error('❌ Error general:', error.message);
}
