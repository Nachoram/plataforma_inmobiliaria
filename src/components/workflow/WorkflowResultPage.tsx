import React, { useState, useEffect } from 'react';
import { generateWorkflowOutput, getHtmlContentFromStorage, WORKFLOW_TYPES } from '@/lib/api/workflow';
import { HTMLCanvasViewer } from '@/components/common/misc';

interface WorkflowError {
  message?: string;
}

interface WorkflowResultPageProps {
  workflowType?: string;
  propertyId?: string;
  onSuccess?: (storagePath: string) => void;
  onError?: (error: string) => void;
}

export const WorkflowResultPage: React.FC<WorkflowResultPageProps> = ({
  workflowType = WORKFLOW_TYPES.INFORME_MENSUAL_PROPIEDAD,
  propertyId,
  onSuccess,
  onError
}) => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Iniciando proceso de informe...');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const updateStatus = (message: string) => {
    setStatusMessage(message);
    console.log(`📊 Estado: ${message}`);
  };

  const handleError = (errorMessage: string, canRetry: boolean = false) => {
    console.error('❌ Error:', errorMessage);
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);

    if (canRetry && retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setIsLoading(true);
        fetchWorkflowResult();
      }, 2000 * (retryCount + 1)); // Backoff exponencial
    }
  };

  const fetchWorkflowResult = async () => {
    try {
      updateStatus('Generando su informe personalizado...');

      // Generar el informe usando la Edge Function
      const storagePath = await generateWorkflowOutput(workflowType, propertyId);

      updateStatus(`Descargando informe desde ${storagePath}...`);

      // Descargar el contenido HTML desde Storage
      const content = await getHtmlContentFromStorage(storagePath);

      updateStatus('Procesando contenido HTML...');

      // Establecer el contenido HTML
      setHtmlContent(content);
      setIsLoading(false);
      onSuccess?.(storagePath);

      updateStatus('¡Informe generado exitosamente!');

    } catch (err: WorkflowError) {
      const errorMessage = err.message || 'Error desconocido al generar el informe';
      const canRetry = !errorMessage.includes('autenticado') && !errorMessage.includes('autorización');
      handleError(errorMessage, canRetry);
    }
  };

  useEffect(() => {
    if (retryCount === 0) {
      fetchWorkflowResult();
    }
  }, [workflowType, propertyId]); // Re-fetch cuando cambian los props

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    setHtmlContent(null);
    fetchWorkflowResult();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-10 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Generando Informe
          </h2>
          <p className="text-gray-600 mb-4">{statusMessage}</p>
          {retryCount > 0 && (
            <p className="text-sm text-orange-600">
              Intento {retryCount} de {maxRetries}
            </p>
          )}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-10 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error al Generar Informe
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          {retryCount < maxRetries && (
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Reintentar ({retryCount}/{maxRetries})
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="ml-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (htmlContent) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h1 className="text-2xl font-bold">
                Resultado del Workflow: {workflowType}
              </h1>
              <p className="text-blue-100 mt-1">
                Generado el {new Date().toLocaleString('es-CL')}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Tipo:</span> {workflowType}
                  {propertyId && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-medium">Propiedad:</span> {propertyId}
                    </>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    🖨️ Imprimir
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    🔄 Generar Nuevo
                  </button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <HTMLCanvasViewer htmlString={htmlContent} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-10">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          No se pudo cargar el informe
        </h2>
        <p className="text-gray-600">
          El contenido del informe no está disponible en este momento.
        </p>
      </div>
    </div>
  );
};
