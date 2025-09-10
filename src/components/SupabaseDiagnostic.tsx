import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CustomButton from './common/CustomButton';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export const SupabaseDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (index: number, updates: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map((result, i) =>
      i === index ? { ...result, ...updates } : result
    ));
  };

  const runDiagnostics = async () => {
    setRunning(true);
    setResults([]);

    // Test 1: Environment Variables
    const envIndex = 0;
    addResult({
      test: 'Variables de Entorno',
      status: 'pending',
      message: 'Verificando configuración de entorno...'
    });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    setTimeout(() => {
      if (supabaseUrl && supabaseKey) {
        updateResult(envIndex, {
          status: 'success',
          message: '✅ Variables de entorno configuradas correctamente',
          details: `URL: ${supabaseUrl.substring(0, 30)}...\nKey: ${supabaseKey.substring(0, 20)}...`
        });
      } else {
        updateResult(envIndex, {
          status: 'error',
          message: '❌ Variables de entorno faltantes',
          details: `URL: ${supabaseUrl ? '✅' : '❌'}\nKey: ${supabaseKey ? '✅' : '❌'}`
        });
      }
    }, 500);

    // Test 2: Supabase Client Creation
    const clientIndex = 1;
    addResult({
      test: 'Cliente Supabase',
      status: 'pending',
      message: 'Creando cliente Supabase...'
    });

    setTimeout(async () => {
      try {
        // Intentar hacer una consulta simple
        const { data, error } = await supabase.from('properties').select('count').limit(1);

        if (error) {
          updateResult(clientIndex, {
            status: 'error',
            message: '❌ Error al crear cliente Supabase',
            details: error.message
          });
        } else {
          updateResult(clientIndex, {
            status: 'success',
            message: '✅ Cliente Supabase creado correctamente',
            details: 'Conexión básica exitosa'
          });
        }
      } catch (error: any) {
        updateResult(clientIndex, {
          status: 'error',
          message: '❌ Error en cliente Supabase',
          details: error.message
        });
      }
    }, 1000);

    // Test 3: Database Schema
    const schemaIndex = 2;
    addResult({
      test: 'Esquema de Base de Datos',
      status: 'pending',
      message: 'Verificando esquema de base de datos...'
    });

    setTimeout(async () => {
      try {
        // Intentar consultar una tabla específica
        const { data, error } = await supabase
          .from('properties')
          .select('id, owner_id, status, listing_type')
          .limit(1);

        if (error) {
          updateResult(schemaIndex, {
            status: 'error',
            message: '❌ Error en esquema de base de datos',
            details: `Tabla 'properties' no encontrada o inaccesible: ${error.message}`
          });
        } else {
          updateResult(schemaIndex, {
            status: 'success',
            message: '✅ Esquema de base de datos accesible',
            details: `Tabla 'properties' encontrada. Registros encontrados: ${data?.length || 0}`
          });
        }
      } catch (error: any) {
        updateResult(schemaIndex, {
          status: 'error',
          message: '❌ Error al acceder al esquema',
          details: error.message
        });
      }
    }, 1500);

    // Test 4: RLS Policies
    const rlsIndex = 3;
    addResult({
      test: 'Políticas RLS',
      status: 'pending',
      message: 'Verificando políticas de seguridad...'
    });

    setTimeout(async () => {
      try {
        // Intentar leer propiedades públicas (debería funcionar sin autenticación)
        const { data, error } = await supabase
          .from('properties')
          .select('id, status, listing_type')
          .eq('status', 'activa')
          .limit(5);

        if (error) {
          if (error.message.includes('permission denied') || error.message.includes('RLS')) {
            updateResult(rlsIndex, {
              status: 'warning',
              message: '⚠️ Posible problema con políticas RLS',
              details: 'No se pueden leer propiedades públicas. Verifica las políticas RLS.'
            });
          } else {
            updateResult(rlsIndex, {
              status: 'error',
              message: '❌ Error en políticas RLS',
              details: error.message
            });
          }
        } else {
          updateResult(rlsIndex, {
            status: 'success',
            message: '✅ Políticas RLS funcionando',
            details: `Se encontraron ${data?.length || 0} propiedades públicas`
          });
        }
      } catch (error: any) {
        updateResult(rlsIndex, {
          status: 'error',
          message: '❌ Error al verificar RLS',
          details: error.message
        });
      }
    }, 2000);

    // Test 5: Authentication
    const authIndex = 4;
    addResult({
      test: 'Sistema de Autenticación',
      status: 'pending',
      message: 'Verificando sistema de autenticación...'
    });

    setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          updateResult(authIndex, {
            status: 'error',
            message: '❌ Error en sistema de autenticación',
            details: error.message
          });
        } else {
          updateResult(authIndex, {
            status: 'success',
            message: '✅ Sistema de autenticación operativo',
            details: `Sesión: ${data.session ? 'Activa' : 'Inactiva'}`
          });
        }
      } catch (error: any) {
        updateResult(authIndex, {
          status: 'error',
          message: '❌ Error al verificar autenticación',
          details: error.message
        });
      }
    }, 2500);

    // Test 6: Storage
    const storageIndex = 5;
    addResult({
      test: 'Sistema de Storage',
      status: 'pending',
      message: 'Verificando sistema de archivos...'
    });

    setTimeout(async () => {
      try {
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
          updateResult(storageIndex, {
            status: 'error',
            message: '❌ Error en sistema de storage',
            details: error.message
          });
        } else {
          updateResult(storageIndex, {
            status: 'success',
            message: '✅ Sistema de storage operativo',
            details: `Buckets encontrados: ${data?.length || 0}`
          });
        }
      } catch (error: any) {
        updateResult(storageIndex, {
          status: 'error',
          message: '❌ Error al verificar storage',
          details: error.message
        });
      }
    }, 3000);

    // Finalizar diagnóstico
    setTimeout(() => {
      setRunning(false);
    }, 3500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🔍 Diagnóstico Completo de Supabase
      </h2>

      <div className="mb-6">
        <CustomButton
          onClick={runDiagnostics}
          disabled={running}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {running ? '🔄 Ejecutando Diagnóstico...' : '🚀 Ejecutar Diagnóstico Completo'}
        </CustomButton>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{result.test}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                {getStatusIcon(result.status)} {result.status.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-2">{result.message}</p>

            {result.details && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">Detalles técnicos</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded whitespace-pre-wrap">
                  {result.details}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {!running && results.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">📊 Resumen del Diagnóstico</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl">✅</div>
              <div>{results.filter(r => r.status === 'success').length} Correctos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">❌</div>
              <div>{results.filter(r => r.status === 'error').length} Errores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">⚠️</div>
              <div>{results.filter(r => r.status === 'warning').length} Advertencias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">⏳</div>
              <div>{results.filter(r => r.status === 'pending').length} Pendientes</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 text-center">
        💡 Si encuentras errores, revisa la consola del navegador (F12) para más detalles técnicos.
      </div>
    </div>
  );
};

export default SupabaseDiagnostic;
