import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Hook separado para manejo de sesión de autenticación
export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para refrescar sesión con manejo mejorado de errores
  const refreshSession = useCallback(async (): Promise<void> => {
    console.log('🔄 Attempting to refresh session...');

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        // Manejar diferentes tipos de errores de refresh
        const errorMessage = error.message?.toLowerCase() || '';

        if (errorMessage.includes('refresh token') && errorMessage.includes('expired')) {
          console.warn('⚠️ Refresh token expired permanently');
          setUser(null);
          // Aquí podríamos emitir un evento para mostrar un mensaje al usuario
          throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }

        if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
          console.warn('⚠️ Invalid refresh token');
          setUser(null);
          throw new Error('Sesión inválida. Por favor, inicia sesión nuevamente.');
        }

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          console.warn('⚠️ Network error during session refresh');
          throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }

        // Para otros errores, intentar una vez más antes de fallar
        console.warn('⚠️ Unexpected error during session refresh:', error);
        throw error;
      }

      if (data.session) {
        console.log('✅ Session refreshed successfully');

        // Verificar que la sesión no esté a punto de expirar
        const expiresAt = data.session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt ? expiresAt - now : 0;

        if (timeUntilExpiry < 300) { // Menos de 5 minutos
          console.warn('⚠️ Session expires soon:', timeUntilExpiry, 'seconds');
        }

        setUser(data.session.user);
      } else {
        console.warn('⚠️ No session returned after refresh');
        setUser(null);
        throw new Error('No se pudo refrescar la sesión. Por favor, inicia sesión nuevamente.');
      }
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      setUser(null);

      // Re-lanzar el error para que el componente que lo llama pueda manejarlo
      throw error;
    }
  }, []);

  // Función para obtener sesión inicial
  const getInitialSession = useCallback(async () => {
    try {
      console.log('🔍 Getting initial session...');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Failed to get initial session:', error);
        setUser(null);
        return;
      }

      if (session?.user) {
        console.log('✅ Initial session found');
        setUser(session.user);
      } else {
        console.log('ℹ️ No initial session found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Failed to get initial session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    setUser,
    setLoading,
    refreshSession,
    getInitialSession
  };
};
