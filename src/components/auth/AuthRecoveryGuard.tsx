import React, { useEffect } from 'react';
import { useAuth, AuthErrorType } from '../../hooks/useAuth';
import { AuthErrorHandler } from './AuthErrorHandler';

interface AuthRecoveryGuardProps {
  children: React.ReactNode;
  onRecoverySuccess?: () => void;
  onRecoveryFailed?: () => void;
  maxAutoRetries?: number;
  enableAutoRecovery?: boolean;
}

export const AuthRecoveryGuard: React.FC<AuthRecoveryGuardProps> = ({
  children,
  onRecoverySuccess,
  onRecoveryFailed,
  maxAutoRetries = 2,
  enableAutoRecovery = true
}) => {
  const { error, retryLastOperation, refreshSession, isAuthenticated } = useAuth();

  // Efecto para recuperación automática
  useEffect(() => {
    if (!error || !enableAutoRecovery) return;

    const shouldAutoRecover = (
      error.type === AuthErrorType.SESSION_EXPIRED ||
      error.type === AuthErrorType.NETWORK_ERROR
    ) && error.retryCount < maxAutoRetries;

    if (shouldAutoRecover) {
      console.log(`🔄 Auto-recovery attempt ${error.retryCount + 1}/${maxAutoRetries} for ${error.type}`);

      const timer = setTimeout(async () => {
        try {
          if (error.type === AuthErrorType.SESSION_EXPIRED) {
            await refreshSession();
          } else {
            await retryLastOperation();
          }

          // Si llega aquí sin error, la recuperación fue exitosa
          console.log('✅ Auto-recovery successful');
          onRecoverySuccess?.();
        } catch (recoveryError) {
          console.error('❌ Auto-recovery failed:', recoveryError);
          onRecoveryFailed?.();
        }
      }, 2000 * (error.retryCount + 1)); // Delay exponencial

      return () => clearTimeout(timer);
    }
  }, [error, enableAutoRecovery, maxAutoRetries, refreshSession, retryLastOperation, onRecoverySuccess, onRecoveryFailed]);

  // Si hay un error que no se puede recuperar automáticamente,
  // mostrar el componente de manejo de errores
  if (error && (
    error.type === AuthErrorType.INVALID_REFRESH_TOKEN ||
    error.type === AuthErrorType.CONFIG_ERROR ||
    error.retryCount >= maxAutoRetries
  )) {
    return (
      <AuthErrorHandler>
        {null}
      </AuthErrorHandler>
    );
  }

  // Mostrar indicador de carga durante la recuperación automática
  if (error && enableAutoRecovery && error.retryCount < maxAutoRetries) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="animate-spin h-8 w-8 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Recuperando Sesión
              </h3>
              <p className="text-sm text-gray-500">
                Intento {error.retryCount + 1} de {maxAutoRetries}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-700">
              Estamos intentando recuperar tu sesión automáticamente...
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((error.retryCount + 1) / maxAutoRetries) * 100}%`
              }}
            />
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Tipo de error: {error.type.replace('_', ' ')}
          </div>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar los hijos
  return <>{children}</>;
};

// Componente de página protegida con recuperación automática
interface ProtectedPageProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({
  children,
  requireAuth = true,
  fallback
}) => {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-600">Verificando autenticación...</span>
        </div>
      </div>
    );
  }

  // Si requiere autenticación y no está autenticado, mostrar fallback o redirigir
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Redirigir al login
    window.location.href = '/auth';
    return null;
  }

  // Si está autenticado o no requiere autenticación, mostrar el contenido con recuperación automática
  return (
    <AuthRecoveryGuard
      onRecoverySuccess={() => {
        console.log('✅ Sesión recuperada exitosamente');
      }}
      onRecoveryFailed={() => {
        console.log('❌ Falló la recuperación automática de sesión');
      }}
    >
      {children}
    </AuthRecoveryGuard>
  );
};
