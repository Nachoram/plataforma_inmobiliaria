/**
 * PostulationErrorBoundary.tsx
 *
 * Error boundary específico para componentes relacionados con postulaciones inmobiliarias.
 * Maneja errores específicos del contexto de postulaciones, contratos y documentos.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText, Users, Briefcase } from 'lucide-react';
import { CustomButton } from '../buttons';

interface Props {
  children: ReactNode;
  postulationId?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, context: PostulationErrorContext) => void;
  showDetails?: boolean;
}

interface PostulationErrorContext {
  postulationId?: string;
  component: string;
  operation?: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  errorContext?: PostulationErrorContext;
  retryCount: number;
}

export class PostulationErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `postulation_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
      errorContext: {
        postulationId: undefined, // Se establece en componentDidCatch
        component: 'PostulationErrorBoundary',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorContext: PostulationErrorContext = {
      postulationId: this.props.postulationId,
      component: this.getComponentFromStack(errorInfo.componentStack),
      operation: this.getOperationFromError(error),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.setState({
      errorInfo,
      errorContext
    });

    // Log específico para postulaciones
    console.error('🚨 PostulationErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: errorContext,
      retryCount: this.state.retryCount
    });

    // Reportar error con contexto específico
    this.props.onError?.(error, errorInfo, errorContext);

    // Reportar a servicios de tracking (si están disponibles)
    this.reportPostulationError(error, errorInfo, errorContext);
  }

  private getComponentFromStack(componentStack: string): string {
    // Extraer el nombre del componente del stack trace
    const componentMatch = componentStack.match(/in\s+(\w+)/);
    return componentMatch ? componentMatch[1] : 'UnknownComponent';
  }

  private getOperationFromError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('contrato') || message.includes('contract')) {
      return 'contract_operation';
    }
    if (message.includes('documento') || message.includes('document')) {
      return 'document_operation';
    }
    if (message.includes('postul') || message.includes('application')) {
      return 'postulation_operation';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network_request';
    }

    return 'unknown_operation';
  }

  private reportPostulationError = (error: Error, errorInfo: ErrorInfo, context: PostulationErrorContext) => {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context,
      severity: this.determineSeverity(error),
      retryCount: this.state.retryCount,
      userImpact: this.assessUserImpact(error),
      suggestedActions: this.getSuggestedActions(error, context)
    };

    // En producción, enviar a servicio de error tracking
    console.log('📊 Postulation Error Report:', errorReport);

    // Integración con Sentry u otros servicios de tracking
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.withScope((scope: any) => {
        scope.setTag('component', 'postulation');
        scope.setTag('operation', context.operation);
        scope.setTag('severity', errorReport.severity);
        scope.setContext('postulation_context', context);
        scope.setContext('error_report', errorReport);
        (window as any).Sentry.captureException(error);
      });
    }
  };

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'high';
    }
    if (message.includes('internal server error') || message.includes('500')) {
      return 'critical';
    }

    return 'low';
  }

  private assessUserImpact(error: Error): 'minimal' | 'moderate' | 'severe' {
    // Evaluar impacto basado en el tipo de error
    const message = error.message.toLowerCase();

    if (message.includes('loading') || message.includes('fetch')) {
      return 'moderate'; // Usuario puede esperar o reintentar
    }
    if (message.includes('save') || message.includes('submit')) {
      return 'severe'; // Pérdida potencial de datos
    }

    return 'minimal';
  }

  private getSuggestedActions(error: Error, context: PostulationErrorContext): string[] {
    const actions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      actions.push('Verificar conexión a internet');
      actions.push('Reintentar la operación');
    }

    if (message.includes('unauthorized')) {
      actions.push('Verificar permisos de acceso');
      actions.push('Iniciar sesión nuevamente');
    }

    if (context.operation === 'contract_operation') {
      actions.push('Verificar condiciones contractuales');
      actions.push('Contactar administrador para soporte contractual');
    }

    if (context.operation === 'document_operation') {
      actions.push('Verificar formato de documento');
      actions.push('Reintentar carga de documento');
    }

    actions.push('Contactar soporte técnico');
    return actions;
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Máximo de reintentos alcanzado
      console.warn('Maximum retry attempts reached');
    }
  };

  private handleGoHome = () => {
    window.location.href = '/portfolio';
  };

  private getErrorIcon = () => {
    const operation = this.state.errorContext?.operation;

    switch (operation) {
      case 'contract_operation':
        return <Briefcase className="w-8 h-8 text-red-600" />;
      case 'document_operation':
        return <FileText className="w-8 h-8 text-red-600" />;
      case 'postulation_operation':
        return <Users className="w-8 h-8 text-red-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
    }
  };

  private getErrorTitle = () => {
    const operation = this.state.errorContext?.operation;

    switch (operation) {
      case 'contract_operation':
        return 'Error en Gestión Contractual';
      case 'document_operation':
        return 'Error en Gestión de Documentos';
      case 'postulation_operation':
        return 'Error en Postulación';
      default:
        return 'Error en Postulación';
    }
  };

  private getErrorMessage = () => {
    const operation = this.state.errorContext?.operation;

    switch (operation) {
      case 'contract_operation':
        return 'Ha ocurrido un error al procesar la información contractual. Nuestros técnicos han sido notificados.';
      case 'document_operation':
        return 'Ha ocurrido un error al procesar los documentos. Por favor, verifica el formato y vuelve a intentar.';
      case 'postulation_operation':
        return 'Ha ocurrido un error al procesar la postulación. No te preocupes, tus datos están seguros.';
      default:
        return 'Ha ocurrido un error inesperado en el procesamiento de la postulación.';
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default postulation-specific error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {this.getErrorIcon()}
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {this.getErrorTitle()}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-4">
              {this.getErrorMessage()}
            </p>

            {/* Postulation ID Context */}
            {this.props.postulationId && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>ID de Postulación:</strong> {this.props.postulationId}
                </p>
              </div>
            )}

            {/* Retry Count */}
            {this.state.retryCount > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-700">
                  Intentos de recuperación: {this.state.retryCount}/{this.maxRetries}
                </p>
              </div>
            )}

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-500 mb-1">ID del error:</p>
                <code className="text-xs font-mono text-gray-700 break-all">
                  {this.state.errorId}
                </code>
              </div>
            )}

            {/* Suggested Actions */}
            {this.state.errorContext && (
              <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-green-800 mb-2">
                  Acciones sugeridas:
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  {this.getSuggestedActions(this.state.error!, this.state.errorContext).map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {this.state.retryCount < this.maxRetries && (
                <CustomButton
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="primary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </CustomButton>
              )}

              <CustomButton
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Volver al Portfolio
              </CustomButton>
            </div>

            {/* Technical Details */}
            {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalles técnicos (para desarrolladores)
                </summary>
                <div className="mt-3 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Operación:</strong> {this.state.errorContext?.operation}
                  </div>
                  <div className="mb-2">
                    <strong>Componente:</strong> {this.state.errorContext?.component}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Support Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Si el problema persiste, contacta a nuestro{' '}
                <a
                  href="mailto:soporte@plataformainmobiliaria.com"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  equipo de soporte
                </a>
                {' '}con el ID del error.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component específico para postulaciones
export function withPostulationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  postulationId?: string,
  errorBoundaryProps?: Omit<Props, 'children' | 'postulationId'>
) {
  const WrappedComponent = (props: P) => (
    <PostulationErrorBoundary
      postulationId={postulationId}
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </PostulationErrorBoundary>
  );

  WrappedComponent.displayName = `withPostulationErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default PostulationErrorBoundary;



