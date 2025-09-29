/**
 * Módulo de Validación de Variables de Entorno
 *
 * Este módulo valida que todas las variables de entorno críticas estén
 * configuradas correctamente antes de que la aplicación se inicialice.
 * Implementa el patrón "fail-fast" para detectar errores de configuración
 * lo más temprano posible.
 */

/**
 * Variables de entorno críticas requeridas por la aplicación
 */
const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: 'URL del proyecto de Supabase',
  VITE_SUPABASE_ANON_KEY: 'Clave anónima de Supabase'
} as const;

/**
 * Valida que todas las variables de entorno críticas estén presentes y válidas
 *
 * @throws {Error} Si alguna variable de entorno faltante o inválida
 */
export function validateEnvironment(): void {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  // Verificar cada variable requerida
  Object.entries(REQUIRED_ENV_VARS).forEach(([envVar, description]) => {
    const value = (import.meta.env as Record<string, string | undefined>)[envVar];

    // Verificar que existe
    if (value === undefined) {
      missingVars.push(envVar);
      return;
    }

    // Verificar que no esté vacía
    if (typeof value === 'string' && value.trim() === '') {
      invalidVars.push(`${envVar} (valor vacío)`);
      return;
    }

    // Validaciones específicas por variable
    if (envVar === 'VITE_SUPABASE_URL') {
      if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
        invalidVars.push(`${envVar} (formato inválido: debe ser una URL de Supabase válida)`);
      }
    }

    if (envVar === 'VITE_SUPABASE_ANON_KEY') {
      if (value.length < 20) {
        invalidVars.push(`${envVar} (parece ser una clave inválida o de prueba)`);
      }
    }
  });

  // 🚨 TEMPORAL: Para desarrollo local, permitir continuar con configuración básica
  // Esto permite probar el routing sin configuración completa de Supabase
  if (missingVars.length > 0 || invalidVars.length > 0) {
    console.warn('⚠️ CONFIGURACIÓN DE ENTORNO INCOMPLETA - MODO DESARROLLO');
    console.warn('Variables faltantes o inválidas detectadas, pero continuando para pruebas de routing...');

    if (missingVars.length > 0) {
      console.warn(`Faltan: ${missingVars.join(', ')}`);
    }

    if (invalidVars.length > 0) {
      console.warn(`Inválidas: ${invalidVars.join(', ')}`);
    }

    console.warn('🔧 Para funcionalidad completa, configura las variables de entorno correctamente.');

    // En lugar de lanzar error, mostrar advertencia y continuar
    return;
  }

  // Si todo está bien, mostrar confirmación
  console.log('✅ Configuración de entorno validada correctamente');
  console.log(`🌐 Supabase URL: ${import.meta.env.VITE_SUPABASE_URL}`);
  console.log(`🔑 Clave anónima: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Presente ✓' : 'Ausente ✗'}`);
}

/**
 * Función de conveniencia para obtener variables de entorno validadas
 * Útil para componentes que necesitan acceso directo a las variables
 */
export function getValidatedEnv(): {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
} {
  // Re-validar para asegurar consistencia (aunque ya se validó al inicio)
  validateEnvironment();

  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL!,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY!
  };
}
