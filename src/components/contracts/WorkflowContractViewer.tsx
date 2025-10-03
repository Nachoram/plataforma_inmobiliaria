import React, { useState, useEffect } from 'react';
import { HTMLCanvasViewer } from '../common/HTMLCanvasViewer';
import { WorkflowViewer } from '../workflow/WorkflowViewer';
import CustomButton from '../common/CustomButton';
import {
  FileText,
  Download,
  Printer,
  Eye,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface WorkflowContractViewerProps {
  webhookUrl: string;
  requestBody?: Record<string, any>;
  contractTitle?: string;
  onClose?: () => void;
  showActions?: boolean;
}

const WorkflowContractViewer: React.FC<WorkflowContractViewerProps> = ({
  webhookUrl,
  requestBody,
  contractTitle = "Contrato Generado por Workflow",
  onClose,
  showActions = true
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Función para refrescar el contrato desde el workflow
  const refreshContract = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  // Efecto para cargar el contrato cuando se monta o cuando retryCount cambia
  useEffect(() => {
    const loadContract = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody ? JSON.stringify(requestBody) : undefined,
        });

        if (!response.ok) {
          throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          // Respuesta JSON esperada
          const data = await response.json();

          if (!data || !data.html) {
            throw new Error('La respuesta JSON no contiene la propiedad "html" esperada');
          }

          setHtmlContent(data.html);
        } else {
          // Respuesta HTML directa (como la que devuelve N8N con Respond to Webhook)
          const htmlText = await response.text();

          if (!htmlText || htmlText.trim().length === 0) {
            throw new Error('La respuesta HTML está vacía');
          }

          setHtmlContent(htmlText);
        }

        setLoading(false);
        setError(null);
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar el contrato';
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadContract();
  }, [webhookUrl, requestBody, retryCount]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && htmlContent) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-workflow-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Generando Contrato desde Workflow
              </h2>
              <p className="text-gray-600 mb-4">
                Conectando con N8N para obtener el contrato personalizado...
              </p>
              {retryCount > 0 && (
                <p className="text-sm text-orange-600">
                  Intento {retryCount} de {maxRetries}
                </p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4 max-w-md mx-auto">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error al Generar Contrato
              </h2>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex justify-center space-x-3">
                {retryCount < maxRetries && (
                  <CustomButton
                    onClick={refreshContract}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reintentar ({retryCount}/{maxRetries})</span>
                  </CustomButton>
                )}
                {onClose && (
                  <CustomButton
                    onClick={onClose}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver</span>
                  </CustomButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              {onClose && (
                <CustomButton
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver</span>
                </CustomButton>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  {contractTitle}
                </h1>
                <p className="text-gray-600 mt-1">
                  Generado por workflow de N8N • {new Date().toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
                <Eye className="h-4 w-4" />
                <span>Workflow N8N</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Fuente:</span> Workflow Automatizado
                  <span className="mx-2">•</span>
                  <span className="font-medium">Generado:</span> {new Date().toLocaleTimeString('es-CL')}
                </div>
                <div className="flex space-x-3">
                  <CustomButton
                    onClick={refreshContract}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Regenerar</span>
                  </CustomButton>
                  <CustomButton
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Nueva Pestaña</span>
                  </CustomButton>
                  <CustomButton
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir</span>
                  </CustomButton>
                  <CustomButton
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Descargar</span>
                  </CustomButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border rounded-lg overflow-hidden">
            <HTMLCanvasViewer htmlString={htmlContent} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom hook to use the WorkflowContractViewer
export const useWorkflowContract = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContractFromWorkflow = async (
    webhookUrl: string,
    requestBody?: Record<string, any>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody ? JSON.stringify(requestBody) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!data || !data.html) {
          throw new Error('La respuesta JSON no contiene la propiedad "html" esperada');
        }
        setHtmlContent(data.html);
      } else {
        const htmlText = await response.text();
        if (!htmlText || htmlText.trim().length === 0) {
          throw new Error('La respuesta HTML está vacía');
        }
        setHtmlContent(htmlText);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar el contrato';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    htmlContent,
    loading,
    error,
    loadContractFromWorkflow
  };
};

export default WorkflowContractViewer;
