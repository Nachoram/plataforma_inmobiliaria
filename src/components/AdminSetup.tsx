import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CustomButton } from './common';

interface AdminError {
  message: string;
}

export const AdminSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const createStorageBuckets = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // Verificar buckets existentes
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      setResults(prev => [...prev, `✅ Buckets existentes: ${existingBuckets?.map(b => b.name).join(', ') || 'ninguno'}`]);
      
      // Crear bucket para imágenes
      const { error: imgError } = await supabase.storage.createBucket('propiedades-imagenes', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });
      
      if (imgError && !imgError.message.includes('already exists')) {
        setResults(prev => [...prev, `❌ Error creando bucket imágenes: ${imgError.message}`]);
      } else {
        setResults(prev => [...prev, `✅ Bucket propiedades-imagenes: ${imgError?.message.includes('already exists') ? 'ya existe' : 'creado'}`]);
      }
      
      // Crear bucket para documentos
      const { error: docError } = await supabase.storage.createBucket('documentos-clientes', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      });
      
      if (docError && !docError.message.includes('already exists')) {
        setResults(prev => [...prev, `❌ Error creando bucket documentos: ${docError.message}`]);
      } else {
        setResults(prev => [...prev, `✅ Bucket documentos-clientes: ${docError?.message.includes('already exists') ? 'ya existe' : 'creado'}`]);
      }
      
      // Verificar buckets después de la creación
      const { data: finalBuckets } = await supabase.storage.listBuckets();
      setResults(prev => [...prev, `🎯 Buckets finales: ${finalBuckets?.map(b => b.name).join(', ')}`]);
      
      setResults(prev => [...prev, `🚀 ¡Configuración completada!`]);
      
    } catch (error: AdminError) {
      setResults(prev => [...prev, `❌ Error general: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // Test de conexión básica
      const { error } = await supabase.from('properties').select('count').limit(1);
      if (error) {
        setResults(prev => [...prev, `❌ Error de conexión: ${error.message}`]);
      } else {
        setResults(prev => [...prev, `✅ Conexión a Supabase: OK`]);
      }
      
      // Test de autenticación
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setResults(prev => [...prev, `❌ Error de autenticación: ${userError.message}`]);
      } else {
        setResults(prev => [...prev, `👤 Usuario: ${user?.email || 'No autenticado'}`]);
      }
      
      // Test de storage
      const { data: buckets } = await supabase.storage.listBuckets();
      setResults(prev => [...prev, `🗂️ Storage buckets: ${buckets?.length || 0}`]);
      
    } catch (error: AdminError) {
      setResults(prev => [...prev, `❌ Error de prueba: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 Configuración del Sistema</h1>
          
          <div className="space-y-4">
            <CustomButton
              onClick={testConnection}
              variant="primary"
              disabled={loading}
              loading={loading}
              loadingText="Probando..."
              className="mr-4"
            >
              🔍 Probar Conexión
            </CustomButton>

            <CustomButton
              onClick={createStorageBuckets}
              variant="success"
              disabled={loading}
              loading={loading}
              loadingText="Configurando..."
            >
              🗂️ Crear Buckets de Storage
            </CustomButton>
          </div>
          
          {results.length > 0 && (
            <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <h3 className="text-lg font-bold mb-3">📋 Resultados:</h3>
              {results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
