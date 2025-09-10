import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthSession } from './useAuthSession';

// Tipos de error de autenticación
export enum AuthErrorType {
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  CONFIG_ERROR = 'CONFIG_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface AuthErrorState {
  type: AuthErrorType;
  message: string;
  timestamp: Date;
  retryCount: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthErrorState | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Logger simplificado - movido a archivo separado
const authLogger = {
  info: (message: string) => console.log(`🔐 AUTH: ${message}`),
  error: (message: string, error?: any) => console.error(`❌ AUTH ERROR: ${message}`, error),
  warn: (message: string) => console.warn(`⚠️ AUTH WARNING: ${message}`)
};

// Hook separado para manejo de errores de autenticación
export const useAuthErrorHandler = () => {
  const [error, setError] = useState<AuthErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getAuthErrorType = (error: AuthError | Error): AuthErrorType => {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('refresh token') || message.includes('invalid refresh')) {
      return AuthErrorType.INVALID_REFRESH_TOKEN;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return AuthErrorType.NETWORK_ERROR;
    }
    if (message.includes('expired') || message.includes('session')) {
      return AuthErrorType.SESSION_EXPIRED;
    }

    return AuthErrorType.UNKNOWN_ERROR;
  };

  const handleAuthError = (error: AuthError | Error, context: string) => {
    const errorType = getAuthErrorType(error);
    const errorState: AuthErrorState = {
      type: errorType,
      message: error.message,
      timestamp: new Date(),
      retryCount
    };

    authLogger.error(`${context}: ${error.message}`, error);
    setError(errorState);
  };

  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  return {
    error,
    retryCount,
    handleAuthError,
    clearError,
    setRetryCount
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Usar hooks separados para responsabilidades específicas
  const { user, loading, setUser, refreshSession, getInitialSession } = useAuthSession();
  const { error, retryCount, handleAuthError, clearError, setRetryCount } = useAuthErrorHandler();

  // Función para reintentar
  const retryLastOperation = async () => {
    if (retryCount >= 3) {
      authLogger.error('Max retry attempts reached');
      return;
    }

    setRetryCount(prev => prev + 1);
    authLogger.info(`Retrying operation (attempt ${retryCount + 1}/3)`);

    // Esperar antes de reintentar
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));

    await refreshSession();
  };

  // Obtener sesión inicial
  useEffect(() => {
    getInitialSession();
  }, [getInitialSession]);

  // Escuchar cambios de autenticación
  useEffect(() => {
    authLogger.info('Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authLogger.info(`Auth state changed: ${event}`);

        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user ?? null);
            clearError();
            setRetryCount(0);
            break;

          case 'SIGNED_OUT':
            setUser(null);
            clearError();
            break;

          case 'TOKEN_REFRESHED':
            console.log('✅ Token refreshed successfully');
            setUser(session?.user ?? null);
            clearError();
            break;

          case 'USER_UPDATED':
            setUser(session?.user ?? null);
            break;

          default:
            setUser(session?.user ?? null);
        }

        setLoading(false);
      }
    );

    return () => {
      authLogger.info('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [setUser, clearError, setRetryCount]);

  // Función de sign in
  const signIn = async (email: string, password: string) => {
    try {
      authLogger.info('Attempting sign in');
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      authLogger.info('Sign in successful');
      clearError();

      return { error: null };
    } catch (error) {
      handleAuthError(error as AuthError, 'Sign in failed');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Función de sign up
  const signUp = async (email: string, password: string) => {
    try {
      authLogger.info('Attempting sign up');
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      authLogger.info('Sign up successful');
      clearError();

      return { error: null };
    } catch (error) {
      handleAuthError(error as AuthError, 'Sign up failed');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Función de sign out
  const signOut = async () => {
    try {
      authLogger.info('Attempting sign out');
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      authLogger.info('Sign out successful');
      setUser(null);
      clearError();

      return { error: null };
    } catch (error) {
      handleAuthError(error as AuthError, 'Sign out failed');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    refreshSession,
    clearError,
    retryLastOperation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};