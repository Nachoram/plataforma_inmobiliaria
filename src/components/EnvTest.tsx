import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const EnvTest: React.FC = () => {
  const { user, isAuthenticated, error, loading, refreshSession, clearError } = useAuth();

  const envVars = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
  };

  // Logging simple para debugging
  React.useEffect(() => {
    console.log('🔧 === DEBUG INFO ===');
    console.log('URL:', envVars.supabaseUrl);
    console.log('Key exists:', !!envVars.supabaseAnonKey);
    console.log('Mode:', envVars.mode);
    console.log('User:', user?.email || 'No user');
    console.log('Error:', error?.message || 'No error');
    console.log('🔧 === END DEBUG ===');
  }, [envVars, user, error]);

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-w-4xl mx-auto mt-8">
      <h2 className="text-lg font-bold mb-4">🧪 Estado del Sistema</h2>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-blue-400 mb-2">🔧 Variables de Entorno</h3>
          <div className="space-y-1">
            <div>URL: {envVars.supabaseUrl ? '✅' : '❌'} {envVars.supabaseUrl}</div>
            <div>Key: {envVars.supabaseAnonKey ? '✅' : '❌'}</div>
            <div>Mode: {envVars.mode}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-purple-400 mb-2">🔐 Autenticación</h3>
          <div className="space-y-1">
            <div>Usuario: {user ? `✅ ${user.email}` : '❌ No autenticado'}</div>
            <div>Loading: {loading ? '⏳' : '✅'}</div>
            <div>Error: {error ? `❌ ${error.message}` : '✅ Sin errores'}</div>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-900 p-4 rounded">
            <h3 className="text-yellow-400 mb-2">⚠️ Error Detectado</h3>
            <p>{error.message}</p>
            <div className="mt-2 space-x-2">
              <button
                onClick={refreshSession}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Refrescar
              </button>
              <button
                onClick={clearError}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {(envVars.supabaseUrl && envVars.supabaseAnonKey && isAuthenticated && !error) && (
          <div className="bg-green-900 p-4 rounded">
            ✅ Sistema funcionando correctamente
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvTest;
