// =====================================================
// SCRIPT DE DEPURACIÓN PARA REGISTRO DE USUARIOS
// =====================================================
// Ejecuta esto en la consola del navegador durante el proceso de depuración

import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURA TUS CREDENCIALES AQUÍ
const supabaseUrl = 'TU_SUPABASE_URL';
const supabaseAnonKey = 'TU_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  console.log('🧪 DEPURACIÓN: Probando registro de usuario...');
  console.log('📊 Paso actual: Diagnóstico de error 500');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Usuario de Prueba';

  console.log(`📧 Email de prueba: ${testEmail}`);

  try {
    console.log('🔄 Enviando solicitud de registro...');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });

    if (error) {
      console.error('❌ ERROR 500 DETECTADO:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        status: error.status,
        details: error
      });

      // Análisis del tipo de error
      if (error.message.includes('Database error')) {
        console.log('🎯 DIAGNÓSTICO: Error en la base de datos (probablemente trigger)');
      } else if (error.message.includes('duplicate key')) {
        console.log('🎯 DIAGNÓSTICO: Conflicto de clave duplicada (email ya existe)');
      } else if (error.message.includes('violates')) {
        console.log('🎯 DIAGNÓSTICO: Violación de restricción (NOT NULL o UNIQUE)');
      }

      return false;
    }

    console.log('✅ REGISTRO EXITOSO:', data);
    console.log('👤 Usuario creado:', data.user?.email);

    // Verificar que se creó el perfil
    if (data.user) {
      console.log('🔍 Verificando creación de perfil...');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Error al verificar perfil:', profileError);
        console.log('🎯 Esto confirma que el trigger NO funcionó');
        return false;
      } else {
        console.log('✅ Perfil creado exitosamente:', profile);
        console.log('🎯 El trigger funcionó correctamente');
        return true;
      }
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return false;
  }
}

// Función para verificar el estado de RLS
async function checkRLSStatus() {
  console.log('🔒 Verificando estado de RLS...');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('permission denied')) {
        console.log('🎯 DIAGNÓSTICO: RLS está bloqueando el acceso');
        return 'BLOCKED';
      } else {
        console.log('❌ Error al consultar profiles:', error);
        return 'ERROR';
      }
    } else {
      console.log('✅ RLS permite acceso básico');
      return 'ALLOWED';
    }
  } catch (err) {
    console.error('❌ Error al verificar RLS:', err);
    return 'ERROR';
  }
}

// Ejecutar las pruebas
async function runDiagnostics() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...');
  console.log('=====================================');

  // Paso 1: Verificar RLS
  const rlsStatus = await checkRLSStatus();
  console.log('🔒 Estado RLS:', rlsStatus);
  console.log('');

  // Paso 2: Probar registro
  const registrationSuccess = await testRegistration();
  console.log('');

  // Paso 3: Análisis final
  console.log('📋 RESUMEN DEL DIAGNÓSTICO:');
  console.log('=====================================');

  if (rlsStatus === 'BLOCKED') {
    console.log('🎯 CAUSA IDENTIFICADA: RLS está bloqueando el trigger');
    console.log('💡 SOLUCIÓN: Ejecuta debug_registration_step3.sql y luego debug_registration_step5_success.sql');
  } else if (!registrationSuccess) {
    console.log('🎯 CAUSA IDENTIFICADA: Problema en el trigger o restricciones de BD');
    console.log('💡 SOLUCIÓN: Ejecuta debug_registration_step5_failure.sql para diagnóstico avanzado');
  } else {
    console.log('✅ TODO FUNCIONANDO: El registro y trigger están OK');
  }
}

// Ejecutar diagnóstico
runDiagnostics();
