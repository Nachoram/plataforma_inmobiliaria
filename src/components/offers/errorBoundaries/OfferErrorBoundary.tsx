import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// Error Boundary base para ofertas
export class OfferErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Offer Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Llamar al callback opcional
    this.props.onError?.(error, errorInfo);

    // En desarrollo, log adicional
    if (import.meta.env.DEV === true) {
      console.group('🚨 Offer Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-6">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Error en la aplicación
            </h2>

            <p className="text-gray-600 text-center mb-6">
              Ha ocurrido un error inesperado al cargar los detalles de la oferta.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </button>

              <button
                onClick={() => window.location.href = '/my-offers'}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Volver a Mis Ofertas
              </button>
            </div>

            {import.meta.env.DEV === true && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalles técnicos (desarrollo)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary específico para pestañas
export const TabErrorBoundary: React.FC<{
  children: ReactNode;
  tabName: string;
  onRetry?: () => void;
}> = ({ children, tabName, onRetry }) => (
  <OfferErrorBoundary
    onError={(error) => {
      console.error(`Error in tab ${tabName}:`, error);
    }}
    fallback={
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error al cargar {tabName}
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Hubo un problema al cargar el contenido de esta sección.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    }
  >
    {children}
  </OfferErrorBoundary>
);

// Hook para manejo de errores en componentes funcionales
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Error caught by useErrorHandler:', error);

    if (import.meta.env.DEV === true) {
      console.group('🚨 Component Error Details');
      console.error('Error:', error);
      if (errorInfo?.componentStack) {
        console.error('Component Stack:', errorInfo.componentStack);
      }
      console.groupEnd();
    }

    // Aquí podríamos enviar el error a un servicio de logging
    // logErrorToService(error, errorInfo);
  }, []);
};

export default OfferErrorBoundary;
