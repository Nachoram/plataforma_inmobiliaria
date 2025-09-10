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

  // Si hay variables faltantes, mostrar error fatal
  if (missingVars.length > 0) {
    const errorMessage = `
🚨 ERROR CRÍTICO DE CONFIGURACIÓN 🚨

Faltan las siguientes variables de entorno requeridas:
${missingVars.map(v => `• ${v} (${REQUIRED_ENV_VARS[v as keyof typeof REQUIRED_ENV_VARS]})`).join('\n')}

📝 SOLUCIÓN:
1. Crea o verifica que existe el archivo '.env' en la raíz del proyecto
2. Agrega las siguientes líneas al archivo .env:

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui

3. Reinicia el servidor de desarrollo con: npm run dev

🔍 Para obtener estos valores:
• Ve a https://supabase.com/dashboard/projects
• Selecciona tu proyecto
• Ve a Settings > API
• Copia la "Project URL" para VITE_SUPABASE_URL
• Copia la "anon public" key para VITE_SUPABASE_ANON_KEY

La aplicación no puede continuar sin estas configuraciones críticas.
    `.trim();

    console.error(errorMessage);
    throw new Error(`Configuración de entorno incompleta: ${missingVars.join(', ')}`);
  }

  // Si hay variables inválidas, mostrar error fatal
  if (invalidVars.length > 0) {
    const errorMessage = `
🚨 ERROR CRÍTICO DE CONFIGURACIÓN 🚨

Las siguientes variables de entorno tienen valores inválidos:
${invalidVars.map(v => `• ${v}`).join('\n')}

📝 SOLUCIÓN:
Verifica que los valores en tu archivo .env sean correctos y reinicia el servidor.

🔍 Recuerda:
• La URL debe comenzar con https:// y contener .supabase.co
• La clave anónima debe ser una cadena larga (típicamente comienza con "eyJ")

La aplicación no puede continuar con configuraciones inválidas.
    `.trim();

    console.error(errorMessage);
    throw new Error(`Configuración de entorno inválida: ${invalidVars.join(', ')}`);
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
