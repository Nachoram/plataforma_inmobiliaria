import React from 'react';

export const EnvTest: React.FC = () => {
  const envVars = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
  };

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-w-4xl mx-auto mt-8">
      <h2 className="text-lg font-bold mb-4">🧪 Variables de Entorno - Prueba de Carga</h2>

      <div className="space-y-2">
        <div>
          <strong>VITE_SUPABASE_URL:</strong>
          <span className={envVars.supabaseUrl ? 'text-green-400' : 'text-red-400'}>
            {envVars.supabaseUrl || '❌ UNDEFINED'}
          </span>
        </div>

        <div>
          <strong>VITE_SUPABASE_ANON_KEY:</strong>
          <span className={envVars.supabaseAnonKey ? 'text-green-400' : 'text-red-400'}>
            {envVars.supabaseAnonKey ? '✅ CARGADA' : '❌ UNDEFINED'}
          </span>
        </div>

        <div>
          <strong>Environment Mode:</strong> {envVars.mode || 'undefined'}
        </div>

        <div>
          <strong>DEV Mode:</strong> {envVars.dev ? '✅ true' : '❌ false'}
        </div>

        <div>
          <strong>All VITE_ vars:</strong>
          {Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', ') || 'ninguna'}
        </div>
      </div>

      <div className="mt-4 p-2 bg-gray-800 rounded">
        <strong>📋 Console Logs:</strong> Revisa la consola del navegador (F12) para más detalles
      </div>

      {(!envVars.supabaseUrl || !envVars.supabaseAnonKey) && (
        <div className="mt-4 p-2 bg-red-900 text-red-200 rounded">
          ⚠️ ERROR: Variables de entorno no cargadas correctamente
        </div>
      )}

      {(envVars.supabaseUrl && envVars.supabaseAnonKey) && (
        <div className="mt-4 p-2 bg-green-900 text-green-200 rounded">
          ✅ ÉXITO: Todas las variables de entorno cargadas correctamente
        </div>
      )}
    </div>
  );
};

export default EnvTest;
