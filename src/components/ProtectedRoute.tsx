import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ProtectedPage } from './auth/AuthRecoveryGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  // enableAutoRecovery y maxAutoRetries están disponibles para futuras implementaciones
  enableAutoRecovery?: boolean;
  maxAutoRetries?: number;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true
  // enableAutoRecovery y maxAutoRetries no se usan actualmente
}) => {
  const { loading } = useAuth();

  // Si está cargando, mostrar indicador de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-sm">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Usar el componente ProtectedPage con recuperación automática
  return (
    <ProtectedPage
      requireAuth={requireAuth}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Acceso Restringido
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Necesitas iniciar sesión para acceder a esta página.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ProtectedPage>
  );
};