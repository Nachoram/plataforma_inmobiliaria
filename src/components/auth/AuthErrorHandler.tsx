import React from 'react';
import { useAuth, AuthErrorType } from '../../hooks/useAuth';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({
  children,
  fallback
}) => {
  const { error, clearError, retryLastOperation, refreshSession } = useAuth();

  // Si no hay error, mostrar los hijos normalmente
  if (!error) {
    return <>{children}</>;
  }

  // Función para obtener mensaje de error amigable
  const getErrorMessage = (type: AuthErrorType): string => {
    switch (type) {
      case AuthErrorType.INVALID_REFRESH_TOKEN:
        return 'Tu sesión ha expirado. Intenta iniciar sesión nuevamente.';
      case AuthErrorType.NETWORK_ERROR:
        return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
      case AuthErrorType.SESSION_EXPIRED:
        return 'Tu sesión ha expirado. Haz clic en "Refrescar" para continuar.';
      case AuthErrorType.CONFIG_ERROR:
        return 'Error de configuración. Contacta al administrador del sistema.';
      case AuthErrorType.UNKNOWN_ERROR:
      default:
        return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
    }
  };

  // Función para obtener acciones recomendadas
  const getErrorActions = (type: AuthErrorType) => {
    switch (type) {
      case AuthErrorType.INVALID_REFRESH_TOKEN:
        return (
          <div className="space-x-2">
            <button
              onClick={retryLastOperation}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <a
              href="/auth"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Ir al Login
            </a>
          </div>
        );

      case AuthErrorType.SESSION_EXPIRED:
        return (
          <div className="space-x-2">
            <button
              onClick={refreshSession}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Refrescar Sesión
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Ignorar
            </button>
          </div>
        );

      case AuthErrorType.NETWORK_ERROR:
        return (
          <div className="space-x-2">
            <button
              onClick={retryLastOperation}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        );

      default:
        return (
          <div className="space-x-2">
            <button
              onClick={retryLastOperation}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        );
    }
  };

  // Si hay un fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Mostrar error por defecto
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Error de Autenticación
            </h3>
            <p className="text-sm text-gray-500">
              Tipo: {error.type.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700">
            {getErrorMessage(error.type)}
          </p>
        </div>

        {error.retryCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Intentos de recuperación: {error.retryCount}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          {getErrorActions(error.type)}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              Detalles técnicos
            </summary>
            <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs">
              <div>Error: {error.message}</div>
              <div>Tipo: {error.type}</div>
              <div>Hora: {error.timestamp.toLocaleString()}</div>
              <div>Intentos: {error.retryCount}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

// Hook personalizado para manejar errores de autenticación
export const useAuthErrorHandler = () => {
  const { error, clearError, retryLastOperation, refreshSession } = useAuth();

  return {
    hasError: !!error,
    error,
    clearError,
    retryLastOperation,
    refreshSession,
    getErrorMessage: (type: AuthErrorType): string => {
      switch (type) {
        case AuthErrorType.INVALID_REFRESH_TOKEN:
          return 'Tu sesión ha expirado. Intenta iniciar sesión nuevamente.';
        case AuthErrorType.NETWORK_ERROR:
          return 'Error de conexión. Verifica tu conexión a internet.';
        case AuthErrorType.SESSION_EXPIRED:
          return 'Tu sesión ha expirado.';
        case AuthErrorType.CONFIG_ERROR:
          return 'Error de configuración del sistema.';
        case AuthErrorType.UNKNOWN_ERROR:
        default:
          return 'Ha ocurrido un error inesperado.';
      }
    }
  };
};
