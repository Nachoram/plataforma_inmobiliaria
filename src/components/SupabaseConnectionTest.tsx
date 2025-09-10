import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import CustomButton from './common/CustomButton';

export const SupabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('No probado');
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setConnectionStatus('Probando conexión...');
    setErrorDetails('');

    try {
      // 1. Verificar configuración
      console.log('🔧 Verificando configuración...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
      console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Faltante');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variables de entorno no configuradas correctamente');
      }

      // 2. Probar conexión básica
      console.log('🔍 Probando conexión básica...');
      const { data, error } = await supabase.from('properties').select('count').limit(1);

      if (error) {
        throw error;
      }

      setConnectionStatus('✅ Conexión exitosa a Supabase');
      console.log('✅ Conexión exitosa:', data);

    } catch (error: any) {
      console.error('❌ Error de conexión:', error);
      setConnectionStatus('❌ Error de conexión');

      let errorMessage = '';

      if (error.message?.includes('JWT')) {
        errorMessage = 'Error de autenticación - Verifica la clave API';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Error de red - Verifica tu conexión a internet';
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        errorMessage = 'Tabla no encontrada - Verifica que las migraciones estén aplicadas';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }

      setErrorDetails(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🧪 Prueba de Conexión Supabase
      </h2>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Estado de la conexión:</div>
        <div className={`p-3 rounded-lg text-sm font-medium ${
          connectionStatus.includes('✅')
            ? 'bg-green-100 text-green-800'
            : connectionStatus.includes('❌')
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-600'
        }`}>
          {connectionStatus}
        </div>
      </div>

      {errorDetails && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Detalles del error:</div>
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {errorDetails}
          </div>
        </div>
      )}

      <CustomButton
        onClick={testConnection}
        loading={loading}
        loadingText="Probando..."
        className="w-full"
        variant="primary"
      >
        🧪 Probar Conexión
      </CustomButton>

      <div className="mt-4 text-xs text-gray-500">
        <div className="mb-2">🔧 Configuración actual:</div>
        <div>URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
        <div>API Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
      </div>
    </div>
  );
};

export default SupabaseConnectionTest;
